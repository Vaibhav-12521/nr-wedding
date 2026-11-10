import { NextResponse } from "next/server";
import { z } from "zod";
import { apiMember } from "@/lib/auth";
import { remove } from "@/lib/storage";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data, error } = await auth.session.supabase
    .from("photos").delete().eq("id", id)
    .select("storage_path, thumbnail_path, preview_path").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not delete." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "You can't delete this photo." }, { status: 403 });

  await remove([data.storage_path, data.thumbnail_path, data.preview_path]).catch((e) => console.error("orphaned files", e));
  return NextResponse.json({ ok: true });
}
