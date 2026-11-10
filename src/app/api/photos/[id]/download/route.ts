import { NextResponse } from "next/server";
import { z } from "zod";
import { apiMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { signDownload } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { supabase, userId } = auth.session;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: photo } = await supabase
    .from("photos").select("id, album_id, storage_path, original_filename, file_size").eq("id", id).maybeSingle();
  if (!photo) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: canDownload } = await supabase.rpc("can_download_album", { p_album: photo.album_id });
  if (!canDownload) return NextResponse.json({ error: "Downloads are turned off for this album." }, { status: 403 });
  if (!(await rateLimit(`dl:${userId}`, 600, 600))) {
    return NextResponse.json({ error: "Too many downloads - please wait a few minutes." }, { status: 429 });
  }

  const url = await signDownload(photo.storage_path, photo.original_filename);
  await createAdminClient().from("upload_activity").insert({
    user_id: userId, action: "download", photo_id: photo.id, album_id: photo.album_id, bytes: photo.file_size,
  });
  return NextResponse.redirect(url, 302);
}
