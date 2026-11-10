import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { STATE_FILE, type E2EState } from "./fixtures";

export default async function globalSetup() {
  loadEnvConfig(process.cwd());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("E2E tests need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  const svc = createClient(url, key, { auth: { persistSession: false } });
  await cleanup(svc);

  const password = `E2e-${randomUUID()}`;
  const users = {} as E2EState["users"];
  for (const [k, role, name] of [["admin", "admin", "E2E Admin"], ["guest1", "guest", "E2E Guest One"], ["guest2", "guest", "E2E Guest Two"]] as const) {
    const email = `${k}-${Date.now()}@e2e.test`;
    await svc.from("invitations").insert({ email, full_name: name, role });
    const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
    users[k] = { id: data.user.id, email, name };
  }

  const albums = {} as E2EState["albums"];
  for (const [k, visibility] of [["open", "members"], ["restricted", "restricted"]] as const) {
    const slug = `e2e-${k}-${Date.now()}`;
    const { data, error } = await svc.from("albums").insert({ name: `E2E ${k}`, slug, visibility }).select("id").single();
    if (error) throw new Error(`album: ${error.message}`);
    albums[k] = { id: data.id, slug, name: `E2E ${k}` };
  }
  await svc.from("album_permissions").insert({ album_id: albums.restricted.id, user_id: users.guest2.id, can_view: true, can_upload: true, can_download: true });

  const dir = join(process.cwd(), "tests", "e2e", ".tmp");
  mkdirSync(dir, { recursive: true });
  const restrictedPhotoId = randomUUID();
  const jpg = await sharp({ create: { width: 800, height: 600, channels: 3, background: "#8a6a31" } }).jpeg().toBuffer();
  const base = `u/${users.guest2.id}/${restrictedPhotoId}`;
  for (const [path, body, type] of [[`${base}.jpg`, jpg, "image/jpeg"], [`d/${restrictedPhotoId}/thumb.webp`, jpg, "image/webp"], [`d/${restrictedPhotoId}/preview.webp`, jpg, "image/webp"]] as const) {
    const { error } = await svc.storage.from("photos").upload(path, body, { contentType: type, upsert: true });
    if (error) throw new Error(`storage: ${error.message}`);
  }
  await svc.from("photos").insert({
    id: restrictedPhotoId, album_id: albums.restricted.id, storage_path: `${base}.jpg`, thumbnail_path: `d/${restrictedPhotoId}/thumb.webp`,
    preview_path: `d/${restrictedPhotoId}/preview.webp`, original_filename: "secret.jpg", file_size: jpg.length, mime_type: "image/jpeg",
    uploaded_by: users.guest2.id, width: 800, height: 600,
  });

  const colours = ["#c9a96e", "#b9727c", "#ecd2cd", "#3a2e2a"];
  const images = await Promise.all(colours.map(async (c, i) => {
    const file = join(dir, `e2e-photo-${i + 1}.jpg`);
    await sharp({ create: { width: 1600, height: 1067, channels: 3, background: c } }).jpeg({ quality: 90 }).toFile(file);
    return file;
  }));
  writeFileSync(join(dir, "not-a-photo.jpg"), "this is text pretending to be a jpeg");

  const state: E2EState = { password, users, albums, restrictedPhotoId, images };
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cleanup(svc: any) {
  const { data: albums } = await svc.from("albums").select("id").like("slug", "e2e-%");
  for (const a of albums ?? []) {
    const { data: photos } = await svc.from("photos").select("storage_path, thumbnail_path, preview_path").eq("album_id", a.id);
    const files = (photos ?? []).flatMap((p: Record<string, string>) => [p.storage_path, p.thumbnail_path, p.preview_path]);
    if (files.length) await svc.storage.from("photos").remove(files);
    await svc.from("albums").delete().eq("id", a.id);
  }
  const { data: list } = await svc.auth.admin.listUsers({ perPage: 1000 });
  for (const u of list?.users ?? []) if (u.email?.endsWith("@e2e.test")) await svc.auth.admin.deleteUser(u.id);
  await svc.from("invitations").delete().like("email", "%@e2e.test");
}
