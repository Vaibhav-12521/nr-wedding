import { NextResponse } from "next/server";
import { z } from "zod";
import { apiMember } from "@/lib/auth";
import { EXT_FOR, LIMITS } from "@/lib/env";
import { ImageError, processPhoto } from "@/lib/images";
import { download, parseOriginalPath, paths, put, remove } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const body = z.object({
  albumId: z.string().uuid(),
  path: z.string().max(200),
  filename: z.string().min(1).max(255),
  title: z.string().trim().max(200).optional(),
});

export async function POST(req: Request) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { supabase, userId } = auth.session;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { albumId, path, filename, title } = parsed.data;

  const parts = parseOriginalPath(path, userId);
  if (!parts) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });

  const { data: existing } = await supabase.from("photos").select("id").eq("storage_path", path).maybeSingle();
  if (existing) return NextResponse.json({ id: existing.id });

  const thumbPath = paths.thumb(parts.photoId);
  const previewPath = paths.preview(parts.photoId);
  let original: Buffer;
  try {
    original = await download(path);
  } catch {
    return NextResponse.json({ error: "The upload didn't reach storage - please retry." }, { status: 409 });
  }

  const reject = async (message: string, status = 422) => {
    await remove([path, thumbPath, previewPath]).catch(() => {});
    return NextResponse.json({ error: message }, { status });
  };

  if (original.length > LIMITS.maxPhotoBytes) return reject("Photos must be under 50 MB.");
  let processed;
  try {
    processed = await processPhoto(original);
  } catch (e) {
    return reject(e instanceof ImageError ? e.message : "This photo couldn't be processed.");
  }
  if (EXT_FOR[processed.mime] !== parts.ext) return reject("The file type doesn't match its contents.");

  try {
    await Promise.all([put(thumbPath, processed.thumb, "image/webp"), put(previewPath, processed.preview, "image/webp")]);
  } catch {
    return reject("Storage is unavailable - please retry.", 503);
  }

  const { data: row, error } = await supabase.from("photos").insert({
    id: parts.photoId,
    album_id: albumId,
    storage_path: path,
    thumbnail_path: thumbPath,
    preview_path: previewPath,
    original_filename: filename.replace(/[\\/\u0000-\u001f]/g, "_"),
    title: title || null,
    file_size: original.length,
    mime_type: processed.mime,
    width: processed.width,
    height: processed.height,
    uploaded_by: userId,
  }).select("id").single();

  if (error || !row) {
    return reject(error?.code === "42501" ? "You can't upload to this album." : "Could not save the photo.", error?.code === "42501" ? 403 : 500);
  }
  return NextResponse.json({ id: row.id });
}
