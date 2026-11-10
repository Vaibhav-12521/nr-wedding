import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITS, PHOTO_BUCKET } from "@/lib/env";

export const paths = {
  original: (uploaderId: string, photoId: string, ext: string) => `u/${uploaderId}/${photoId}.${ext}`,
  thumb: (photoId: string) => `d/${photoId}/thumb.webp`,
  preview: (photoId: string) => `d/${photoId}/preview.webp`,
};

export function parseOriginalPath(path: string, uploaderId: string) {
  const m = /^u\/([0-9a-f-]{36})\/([0-9a-f-]{36})\.(jpg|png|webp)$/.exec(path);
  if (!m || m[1] !== uploaderId) return null;
  return { photoId: m[2], ext: m[3] };
}

const bucket = () => createAdminClient().storage.from(PHOTO_BUCKET);

export async function createUploadUrl(path: string) {
  const { data, error } = await bucket().createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "could not create upload URL");
  return data;
}

export async function download(path: string): Promise<Buffer> {
  const { data, error } = await bucket().download(path);
  if (error || !data) throw new Error(error?.message ?? "file not found");
  return Buffer.from(await data.arrayBuffer());
}

export async function put(path: string, body: Buffer, contentType: string) {
  const { error } = await bucket().upload(path, body, { contentType, upsert: true, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
}

export async function remove(paths: string[]) {
  for (let i = 0; i < paths.length; i += 900) {
    const { error } = await bucket().remove(paths.slice(i, i + 900));
    if (error) throw new Error(error.message);
  }
}

export async function signMany(paths: string[], seconds = LIMITS.signedUrlSeconds): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 500) {
    const { data, error } = await bucket().createSignedUrls(unique.slice(i, i + 500), seconds);
    if (error) throw new Error(error.message);
    for (const d of data ?? []) if (d.signedUrl && d.path) out.set(d.path, d.signedUrl);
  }
  return out;
}

export async function signDownload(path: string, filename: string) {
  const { data, error } = await bucket().createSignedUrl(path, LIMITS.downloadUrlSeconds, { download: filename });
  if (error || !data) throw new Error(error?.message ?? "could not sign download");
  return data.signedUrl;
}
