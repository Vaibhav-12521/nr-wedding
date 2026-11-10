import { NextResponse } from "next/server";
import { z } from "zod";
import { apiMember } from "@/lib/auth";

const body = z.object({ ids: z.array(z.string().uuid()).min(1).max(1000), on: z.boolean() });

export async function POST(req: Request) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { supabase, userId } = auth.session;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { ids, on } = parsed.data;

  const { error } = on
    ? await supabase.from("photo_favourites").upsert(ids.map((photo_id) => ({ user_id: userId, photo_id })), { ignoreDuplicates: true })
    : await supabase.from("photo_favourites").delete().eq("user_id", userId).in("photo_id", ids);
  if (error) return NextResponse.json({ error: "Could not update favourites." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
