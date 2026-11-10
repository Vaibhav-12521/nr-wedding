"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { apiAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { remove as removePhotoFiles } from "@/lib/storage";
import { env, SITE_BUCKET } from "@/lib/env";
import { slugify } from "@/lib/format";

export type ActionResult = { ok?: boolean; error?: string; message?: string; path?: string };

async function admin() {
  const r = await apiAdmin();
  if (r.error) throw new Error("Admins only.");
  return r.session;
}

async function run(fn: () => Promise<ActionResult | void>, revalidate: string[] = []): Promise<ActionResult> {
  try {
    const res = (await fn()) ?? { ok: true };
    revalidate.forEach((p) => revalidatePath(p, "layout"));
    return res;
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

const uuid = z.string().uuid();
const optionalText = (max: number) => z.string().trim().max(max).transform((v) => v || null);
const optionalUrl = z.string().trim().max(500).refine((v) => !v || /^https:\/\//i.test(v), "Links must start with https://").transform((v) => v || null);


const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  full_name: z.string().trim().min(1, "Enter their name.").max(120),
  role: z.enum(["guest", "admin"]),
});

export async function inviteGuest(_p: ActionResult, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const d = inviteSchema.parse(Object.fromEntries(form));
    const svc = createAdminClient();

    const { data: prior } = await svc.from("invitations").select("id").eq("email", d.email).maybeSingle();
    const { error: invErr } = prior
      ? await svc.from("invitations").update({ full_name: d.full_name, role: d.role }).eq("id", prior.id)
      : await svc.from("invitations").insert({ email: d.email, full_name: d.full_name, role: d.role, invited_by: s.userId });
    if (invErr) throw new Error("Could not save the invitation.");

    const { data: existing } = await svc.from("profiles").select("id").eq("email", d.email).maybeSingle();
    if (existing) {
      await svc.from("profiles").update({ is_active: true, role: d.role, full_name: d.full_name }).eq("id", existing.id);
      await svc.auth.admin.updateUserById(existing.id, { ban_duration: "none" });
      return { ok: true, message: `${d.full_name} already had an account - access has been granted.` };
    }
    const { error } = await svc.auth.admin.inviteUserByEmail(d.email, {
      redirectTo: `${env.siteUrl}/auth/confirm`,
      data: { full_name: d.full_name },
    });
    if (error) throw new Error(`Invitation saved, but the email couldn't be sent: ${error.message}`);
    return { ok: true, message: `Invitation sent to ${d.email}` };
  }, ["/admin"]);
}

export async function resendInvite(email: string): Promise<ActionResult> {
  return run(async () => {
    await admin();
    const e = z.string().email().parse(email);
    const svc = createAdminClient();
    const { error } = await svc.auth.admin.inviteUserByEmail(e, { redirectTo: `${env.siteUrl}/auth/confirm` });
    if (error) {
      const { error: resetErr } = await svc.auth.resetPasswordForEmail(e, { redirectTo: `${env.siteUrl}/auth/confirm?next=/set-password` });
      if (resetErr) throw new Error(resetErr.message);
      return { ok: true, message: "They already have an account - a password reset link was sent." };
    }
    return { ok: true, message: "Invitation re-sent." };
  });
}

export async function revokeInvitation(id: string): Promise<ActionResult> {
  return run(async () => {
    await admin();
    const svc = createAdminClient();
    const { data: inv } = await svc.from("invitations").select("user_id").eq("id", uuid.parse(id)).single();
    if (inv?.user_id) {
      await svc.from("profiles").update({ is_active: false }).eq("id", inv.user_id);
      await svc.auth.admin.updateUserById(inv.user_id, { ban_duration: "876000h" });
    }
    await svc.from("invitations").delete().eq("id", id);
  }, ["/admin"]);
}

async function otherActiveAdmins(svc: ReturnType<typeof createAdminClient>, exceptId: string) {
  const { count } = await svc.from("profiles").select("id", { count: "exact", head: true })
    .eq("role", "admin").eq("is_active", true).neq("id", exceptId);
  return count ?? 0;
}

export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    uuid.parse(userId);
    if (userId === s.userId && !active) throw new Error("You can't deactivate your own account.");
    const svc = createAdminClient();
    const { error } = await svc.from("profiles").update({ is_active: active }).eq("id", userId);
    if (error) throw new Error("Could not update the account.");
    await svc.auth.admin.updateUserById(userId, { ban_duration: active ? "none" : "876000h" });
  }, ["/admin"]);
}

export async function setUserRole(userId: string, role: "guest" | "admin"): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    uuid.parse(userId);
    z.enum(["guest", "admin"]).parse(role);
    const svc = createAdminClient();
    if (role === "guest" && userId === s.userId && (await otherActiveAdmins(svc, s.userId)) === 0) {
      throw new Error("You're the only admin - make someone else an admin first.");
    }
    const { error } = await svc.from("profiles").update({ role }).eq("id", userId);
    if (error) throw new Error("Could not change the role.");
  }, ["/admin"]);
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    uuid.parse(userId);
    if (userId === s.userId) throw new Error("You can't delete your own account here.");
    const svc = createAdminClient();
    const { error } = await svc.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    await svc.from("invitations").delete().eq("user_id", userId);
  }, ["/admin"]);
}


const albumSchema = z.object({
  name: z.string().trim().min(1, "Give the album a name.").max(80),
  description: optionalText(500),
  visibility: z.enum(["public", "members", "restricted"]),
  event_id: z.string().transform((v) => v || null).pipe(uuid.nullable()),
  allow_uploads: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  allow_downloads: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

async function uniqueSlug(svc: ReturnType<typeof createAdminClient>, name: string, exceptId?: string) {
  const base = slugify(name);
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    let q = svc.from("albums").select("id").eq("slug", slug);
    if (exceptId) q = q.neq("id", exceptId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function saveAlbum(_p: ActionResult, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const id = form.get("id") ? uuid.parse(form.get("id")) : null;
    const d = albumSchema.parse({
      name: form.get("name"), description: form.get("description") ?? "", visibility: form.get("visibility"),
      event_id: form.get("event_id") ?? "", allow_uploads: form.get("allow_uploads"), allow_downloads: form.get("allow_downloads"),
    });
    const svc = createAdminClient();
    const slug = await uniqueSlug(svc, d.name, id ?? undefined);
    const { error } = id
      ? await s.supabase.from("albums").update({ ...d, slug }).eq("id", id)
      : await s.supabase.from("albums").insert({ ...d, slug, created_by: s.userId });
    if (error) throw new Error("Could not save the album.");
    return { ok: true, message: id ? "Album saved" : "Album created" };
  }, ["/admin", "/albums"]);
}

const SUGGESTED = [
  ["31 January Celebration", "members"], ["Wedding Day – 15 February", "members"], ["Family Moments", "members"],
  ["Bride's Collection", "members"], ["Groom's Collection", "members"], ["Friends and Relatives", "members"], ["Behind the Scenes", "members"],
] as const;

export async function createSuggestedAlbums(): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const svc = createAdminClient();
    const { data: events } = await svc.from("wedding_events").select("id, date_label").order("sort_order");
    const eventFor = (name: string) => events?.find((e) => e.date_label && name.includes(e.date_label.split(" ")[0]) && name.includes(e.date_label.split(" ")[1] ?? ""))?.id ?? null;
    let created = 0;
    for (const [i, [name, visibility]] of SUGGESTED.entries()) {
      const slug = slugify(name);
      const { data: exists } = await svc.from("albums").select("id").eq("slug", slug).maybeSingle();
      if (exists) continue;
      const { error } = await s.supabase.from("albums").insert({ name, slug, visibility, sort_order: i, created_by: s.userId, event_id: eventFor(name) });
      if (!error) created++;
    }
    return { ok: true, message: created ? `Created ${created} albums` : "Those albums already exist" };
  }, ["/admin", "/albums"]);
}

export async function deleteAlbum(id: string): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    uuid.parse(id);
    const svc = createAdminClient();
    const photos: { storage_path: string; thumbnail_path: string; preview_path: string }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await svc.from("photos").select("storage_path, thumbnail_path, preview_path").eq("album_id", id).range(from, from + 999);
      photos.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    const { error } = await s.supabase.from("albums").delete().eq("id", id);
    if (error) throw new Error("Could not delete the album.");
    await removePhotoFiles((photos ?? []).flatMap((p) => [p.storage_path, p.thumbnail_path, p.preview_path]))
      .catch((e) => console.error("orphaned files after album delete", e));
    return { ok: true, message: `Album and ${photos.length} photos deleted` };
  }, ["/admin", "/albums"]);
}

export async function setAlbumPermission(albumId: string, userId: string, perms: { can_view: boolean; can_upload: boolean; can_download: boolean } | null): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    uuid.parse(albumId); uuid.parse(userId);
    const { error } = perms
      ? await s.supabase.from("album_permissions").upsert({ album_id: albumId, user_id: userId, ...perms, granted_by: s.userId })
      : await s.supabase.from("album_permissions").delete().eq("album_id", albumId).eq("user_id", userId);
    if (error) throw new Error("Could not update access.");
  }, ["/admin"]);
}


export async function reviewPhoto(photoId: string, approve: boolean): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const { error } = await s.supabase.rpc("review_photo", { p_photo: uuid.parse(photoId), p_approve: approve, p_note: null });
    if (error) throw new Error("Could not update the photo.");
  }, ["/admin", "/gallery", "/"]);
}

export async function makePhotoPrivate(photoId: string): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const { error } = await s.supabase.from("photos").update({ visibility: "private", approval_status: "none", is_featured: false }).eq("id", uuid.parse(photoId));
    if (error) throw new Error("Could not update the photo.");
    await createAdminClient().from("upload_activity").insert({ user_id: s.userId, action: "visibility_change", photo_id: photoId, detail: { to: "private" } });
  }, ["/admin", "/gallery", "/"]);
}

export async function deletePhotos(ids: string[]): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const list = z.array(uuid).min(1).max(500).parse(ids);
    const { data, error } = await s.supabase.from("photos").delete().in("id", list).select("storage_path, thumbnail_path, preview_path");
    if (error) throw new Error("Could not delete.");
    await removePhotoFiles((data ?? []).flatMap((p) => [p.storage_path, p.thumbnail_path, p.preview_path])).catch((e) => console.error(e));
    return { ok: true, message: `${data?.length ?? 0} deleted` };
  }, ["/admin", "/gallery", "/"]);
}

export async function movePhotos(ids: string[], albumId: string): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const list = z.array(uuid).min(1).max(500).parse(ids);
    const { error } = await s.supabase.from("photos").update({ album_id: uuid.parse(albumId) }).in("id", list);
    if (error) throw new Error("Could not move the photos.");
    return { ok: true, message: `Moved ${list.length} photo${list.length === 1 ? "" : "s"}` };
  }, ["/admin", "/albums"]);
}


export async function featurePhotos(ids: string[], on: boolean): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const list = z.array(uuid).min(1).max(200).parse(ids);
    if (!on) {
      const { error } = await s.supabase.from("photos").update({ is_featured: false }).in("id", list);
      if (error) throw new Error("Could not update.");
      return { ok: true, message: "Removed from the website slideshow" };
    }
    const { data: top } = await s.supabase.from("photos").select("featured_order").eq("is_featured", true)
      .order("featured_order", { ascending: false }).limit(1).maybeSingle();
    let order = (top?.featured_order ?? 0) + 1;
    for (const id of list) {
      const { data: p } = await s.supabase.from("photos").select("visibility, approval_status").eq("id", id).single();
      if (p && (p.visibility !== "public" || p.approval_status !== "approved")) {
        const { error } = await s.supabase.rpc("review_photo", { p_photo: id, p_approve: true, p_note: "Featured on the website" });
        if (error) throw new Error("Could not publish a photo.");
      }
      const { error } = await s.supabase.from("photos").update({ is_featured: true, featured_order: order++ }).eq("id", id);
      if (error) throw new Error("Could not feature a photo.");
    }
    return { ok: true, message: `${list.length} photo${list.length === 1 ? "" : "s"} now on the website` };
  }, ["/", "/gallery", "/admin"]);
}

export async function reorderFeatured(ids: string[]): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const list = z.array(uuid).max(200).parse(ids);
    for (const [i, id] of list.entries()) {
      const { error } = await s.supabase.from("photos").update({ featured_order: i + 1 }).eq("id", id).eq("is_featured", true);
      if (error) throw new Error("Could not reorder.");
    }
  }, ["/"]);
}


export async function setWishStatus(id: string, status: "approved" | "rejected"): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const { error } = await s.supabase.from("wishes").update({ status: z.enum(["approved", "rejected"]).parse(status) }).eq("id", uuid.parse(id));
    if (error) throw new Error("Could not update the blessing.");
  }, ["/", "/wishes", "/admin"]);
}

export async function deleteWish(id: string): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const { error } = await s.supabase.from("wishes").delete().eq("id", uuid.parse(id));
    if (error) throw new Error("Could not delete.");
  }, ["/", "/wishes", "/admin"]);
}


export async function uploadSiteImage(form: FormData): Promise<ActionResult> {
  return run(async () => {
    await admin();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image.");
    if (file.size > 15 * 1024 * 1024) throw new Error("Please use an image under 15 MB.");
    let out: Buffer;
    try {
      out = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" })
        .rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    } catch {
      throw new Error("That file isn't a supported image.");
    }
    const folder = z.enum(["hero", "events", "couple"]).parse(form.get("folder"));
    const path = `${folder}/${crypto.randomUUID()}.webp`;
    const { error } = await createAdminClient().storage.from(SITE_BUCKET).upload(path, out, { contentType: "image/webp", cacheControl: "31536000" });
    if (error) throw new Error("Could not store the image.");
    return { ok: true, path };
  });
}


const list = <T extends z.ZodTypeAny>(item: T) => z.string().transform((s, ctx) => {
  try { return JSON.parse(s || "[]"); } catch { ctx.addIssue({ code: "custom", message: "Invalid list" }); return z.NEVER; }
}).pipe(z.array(item).max(100));

const detailsSchema = z.object({
  bride_name: z.string().trim().min(1, "The bride's name is required.").max(80),
  groom_name: optionalText(80),
  tagline: z.string().trim().min(1).max(160),
  wedding_date: z.string().trim().transform((v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null)),
  venue_name: optionalText(160),
  venue_address: optionalText(300),
  location: optionalText(160),
  maps_url: optionalUrl,
  hero_image_path: optionalText(300),
  bride_photo_path: optionalText(300),
  groom_photo_path: optionalText(300),
  bride_intro: optionalText(3000),
  groom_intro: optionalText(3000),
  story_intro: optionalText(1500),
  invitation_message: optionalText(1500),
  rsvp_enabled: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  rsvp_deadline: z.string().trim().transform((v) => v || null),
  privacy_contact: optionalText(200),
  story_timeline: list(z.object({ date: z.string().max(60).optional(), title: z.string().min(1).max(120), text: z.string().max(2000).optional() })),
  families: list(z.object({ side: z.enum(["bride", "groom"]), name: z.string().min(1).max(120), relation: z.string().max(80).optional(), note: z.string().max(300).optional() })),
  faqs: list(z.object({ question: z.string().min(1).max(300), answer: z.string().min(1).max(3000) })),
  contacts: list(z.object({ name: z.string().min(1).max(120), role: z.string().max(80).optional(), phone: z.string().max(30).optional(), email: z.string().max(200).optional() })),
});

export async function saveWedding(_p: ActionResult, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const parsed = detailsSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    const { error } = await s.supabase.from("wedding_details").update(parsed.data).eq("id", 1);
    if (error) throw new Error("Could not save the details.");
    return { ok: true, message: "Wedding details saved" };
  }, ["/"]);
}


const eventSchema = z.object({
  title: z.string().trim().min(1, "Give the event a title.").max(120),
  date_label: optionalText(60),
  starts_at: z.string().trim().transform((v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null)),
  ends_at: z.string().trim().transform((v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null)),
  venue_name: optionalText(160),
  address: optionalText(300),
  maps_url: optionalUrl,
  description: optionalText(3000),
  dress_code: optionalText(160),
  image_path: optionalText(300),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_published: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export async function saveEvent(_p: ActionResult, form: FormData): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const id = form.get("id") ? uuid.parse(form.get("id")) : null;
    const parsed = eventSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    if (parsed.data.starts_at && parsed.data.ends_at && parsed.data.ends_at < parsed.data.starts_at) throw new Error("The end time is before the start time.");
    const { error } = id
      ? await s.supabase.from("wedding_events").update(parsed.data).eq("id", id)
      : await s.supabase.from("wedding_events").insert(parsed.data);
    if (error) throw new Error("Could not save the event.");
    return { ok: true, message: id ? "Event saved" : "Event added" };
  }, ["/"]);
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const { error } = await s.supabase.from("wedding_events").delete().eq("id", uuid.parse(id));
    if (error) throw new Error("Could not delete the event.");
  }, ["/"]);
}


export async function deleteRsvp(id: string): Promise<ActionResult> {
  return run(async () => {
    const s = await admin();
    const { error } = await s.supabase.from("rsvps").delete().eq("id", uuid.parse(id));
    if (error) throw new Error("Could not delete.");
  }, ["/admin"]);
}
