import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());
const SLUG = "demo-photos";
const dir = join(process.cwd(), "public", "demo");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  const svc = createClient(url, key, { auth: { persistSession: false } });
  const mode = process.argv[2];

  const { data: existing } = await svc.from("albums").select("id").eq("slug", SLUG).maybeSingle();
  if (existing) {
    const { data: photos } = await svc.from("photos").select("storage_path, thumbnail_path, preview_path").eq("album_id", existing.id);
    const files = (photos ?? []).flatMap((p) => [p.storage_path, p.thumbnail_path, p.preview_path]);
    if (files.length) await svc.storage.from("photos").remove(files);
    await svc.from("albums").delete().eq("id", existing.id);
    console.log(`✓ Removed the demo album (${photos?.length ?? 0} photos).`);
  }
  if (mode === "remove") return;

  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as { id: string; title: string; width: number; height: number }[];
  const { data: admin } = await svc.from("profiles").select("id").eq("role", "admin").eq("is_active", true).limit(1).maybeSingle();
  const { data: album, error } = await svc.from("albums")
    .insert({ name: "Demo Photos", slug: SLUG, visibility: "public", description: "Sample artwork to preview the site. Remove with `npm run demo:remove`.", sort_order: 99 })
    .select("id").single();
  if (error || !album) throw new Error(`Could not create the album: ${error?.message}`);

  for (const [i, m] of manifest.entries()) {
    const id = randomUUID();
    const original = readFileSync(join(dir, `${m.id}.jpg`));
    const paths = { storage_path: `demo/${id}.jpg`, thumbnail_path: `d/${id}/thumb.webp`, preview_path: `d/${id}/preview.webp` };
    for (const [path, file, type] of [
      [paths.storage_path, `${m.id}.jpg`, "image/jpeg"],
      [paths.thumbnail_path, `${m.id}-thumb.webp`, "image/webp"],
      [paths.preview_path, `${m.id}-preview.webp`, "image/webp"],
    ] as const) {
      const { error: up } = await svc.storage.from("photos").upload(path, readFileSync(join(dir, file)), { contentType: type, upsert: true });
      if (up) throw new Error(`Upload failed for ${file}: ${up.message}`);
    }
    const { error: ins } = await svc.from("photos").insert({
      id, album_id: album.id, ...paths, original_filename: `${m.id}.jpg`, title: m.title, file_size: original.length,
      mime_type: "image/jpeg", width: m.width, height: m.height, uploaded_by: admin?.id ?? null,
      visibility: "public", approval_status: "approved", is_featured: i < 8, featured_order: i,
    });
    if (ins) throw new Error(`Could not save ${m.title}: ${ins.message}`);
    console.log(`✓ ${m.title}`);
  }
  console.log(`\nDone: ${manifest.length} demo photos are public, the first 8 play on the homepage slideshow.`);
  console.log("Remove them before the site goes to guests: npm run demo:remove");
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
