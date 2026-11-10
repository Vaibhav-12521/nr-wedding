import { NextResponse } from "next/server";
import { z } from "zod";
import { apiMember } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const note = z.object({ note: z.string().max(500).optional() }).safeParse(await req.json().catch(() => ({})));

  const { error } = await auth.session.supabase.rpc("request_photo_public", {
    p_photo: id, p_note: note.success ? note.data.note ?? null : null,
  });
  if (error) return NextResponse.json({ error: "You can only submit your own photos." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
