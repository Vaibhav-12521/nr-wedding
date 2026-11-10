import { NextResponse } from "next/server";
import { downloadZip } from "client-zip";
import { z } from "zod";
import { apiMember } from "@/lib/auth";
import { LIMITS } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { signMany } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

const ids = z.array(z.string().uuid()).min(1).max(LIMITS.zipMaxPhotos);

export async function POST(req: Request) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { supabase, userId } = auth.session;

  let raw: unknown;
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) raw = (await req.json().catch(() => ({}))).ids;
  else raw = String((await req.formData()).get("ids") ?? "").split(",").filter(Boolean);
  const parsed = ids.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: `Choose between 1 and ${LIMITS.zipMaxPhotos} photos per ZIP.` }, { status: 400 });
  }
  if (!(await rateLimit(`zip:${userId}`, 12, 600))) {
    return NextResponse.json({ error: "Too many ZIP downloads - please wait a few minutes." }, { status: 429 });
  }

  const { data: rows, error } = await supabase
    .from("photos")
    .select("id, album_id, storage_path, original_filename, file_size, created_at, album:albums!photos_album_id_fkey(name)")
    .in("id", parsed.data);
  if (error) return NextResponse.json({ error: "Could not load photos." }, { status: 500 });

  const albumIds = [...new Set((rows ?? []).map((r) => r.album_id))];
  const allowed = new Set<string>();
  await Promise.all(albumIds.map(async (a) => {
    const { data } = await supabase.rpc("can_download_album", { p_album: a });
    if (data) allowed.add(a);
  }));
  const photos = (rows ?? []).filter((r) => allowed.has(r.album_id));
  if (!photos.length) return NextResponse.json({ error: "None of these photos can be downloaded." }, { status: 403 });

  const total = photos.reduce((s, p) => s + Number(p.file_size), 0);
  if (total > LIMITS.zipMaxBytes) {
    return NextResponse.json({ error: "That's more than 2 GB - please download in smaller batches." }, { status: 413 });
  }

  const used = new Map<string, number>();
  const entries = photos.map((p) => {
    const album = ((p.album as unknown as { name?: string } | null)?.name ?? "Photos").replace(/[\\/:*?"<>|]/g, "-");
    const base = p.original_filename.replace(/[\\/:*?"<>|]/g, "-");
    let name = `${album}/${base}`;
    const n = (used.get(name.toLowerCase()) ?? 0) + 1;
    used.set(name.toLowerCase(), n);
    if (n > 1) name = name.replace(/(\.[^.]*)?$/, (ext) => ` (${n})${ext}`);
    return { ...p, zipName: name, lastModified: new Date(p.created_at) };
  });

  const urls = await signMany(entries.map((e) => e.storage_path), 30 * 60);

  async function* files() {
    for (const e of entries) {
      const url = urls.get(e.storage_path);
      const res = url ? await fetch(url) : null;
      if (!res?.ok || !res.body) throw new Error(`could not fetch ${e.storage_path}`);
      yield { input: res, name: e.zipName, lastModified: e.lastModified, size: Number(e.file_size) };
    }
  }

  await createAdminClient().from("upload_activity").insert({
    user_id: userId, action: "zip_download", bytes: total, detail: { count: entries.length },
  });

  const zip = downloadZip(files(), {
    metadata: entries.map((e) => ({ name: e.zipName, size: Number(e.file_size), lastModified: e.lastModified })),
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = new Headers({
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="nehas-wedding-photos-${stamp}.zip"`,
    "Cache-Control": "no-store",
  });
  const length = zip.headers.get("Content-Length");
  if (length) headers.set("Content-Length", length);
  return new Response(zip.body, { headers });
}
