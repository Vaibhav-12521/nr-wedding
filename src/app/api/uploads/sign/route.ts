import { NextResponse } from "next/server";
import { z } from "zod";
import { apiMember } from "@/lib/auth";
import { ALLOWED_TYPES, EXT_FOR, LIMITS, type AllowedType } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createUploadUrl, paths } from "@/lib/storage";

const body = z.object({
  albumId: z.string().uuid(),
  files: z.array(z.object({
    name: z.string().min(1).max(255),
    size: z.number().int().positive(),
    type: z.string(),
  })).min(1).max(LIMITS.maxFilesPerBatch),
});

export async function POST(req: Request) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { supabase, userId } = auth.session;

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!(await rateLimit(`sign:${userId}`, 40, 60))) {
    return NextResponse.json({ error: "Too many uploads at once - please wait a minute." }, { status: 429 });
  }

  const { data: canUpload, error } = await supabase.rpc("can_upload_album", { p_album: parsed.data.albumId });
  if (error) return NextResponse.json({ error: "Could not check album access." }, { status: 500 });
  if (!canUpload) return NextResponse.json({ error: "You can't upload to this album." }, { status: 403 });

  const results = await Promise.all(parsed.data.files.map(async (f) => {
    const type = f.type.toLowerCase() as AllowedType;
    if (!ALLOWED_TYPES.includes(type)) return { name: f.name, error: "Only JPG, PNG and WebP photos are supported." };
    if (f.size > LIMITS.maxPhotoBytes) return { name: f.name, error: `Photos must be under ${LIMITS.maxPhotoBytes / 1024 / 1024} MB.` };
    const path = paths.original(userId, crypto.randomUUID(), EXT_FOR[type]);
    try {
      const signed = await createUploadUrl(path);
      return { name: f.name, path, uploadUrl: signed.signedUrl };
    } catch {
      return { name: f.name, error: "Storage is unavailable - please retry." };
    }
  }));
  return NextResponse.json({ files: results });
}
