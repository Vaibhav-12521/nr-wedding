import { NextResponse } from "next/server";
import { z } from "zod";
import { apiMember } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const withSizes = new URL(req.url).searchParams.get("sizes") === "1";
  const rows: { photo_id: string; photo: { file_size: number } }[] = [];
  for (let from = 0; from < 10_000; from += 1000) {
    const { data, error } = await auth.session.supabase
      .from("photo_selections")
      .select("photo_id, created_at, photo:photos!inner(file_size)")
      .eq("user_id", auth.session.userId)
      .order("created_at")
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: "Could not load selection." }, { status: 500 });
    rows.push(...((data ?? []) as unknown as typeof rows));
    if (!data || data.length < 1000) break;
  }
  const body = withSizes
    ? { ids: rows.map((r) => r.photo_id), items: rows.map((r) => ({ id: r.photo_id, size: Number(r.photo.file_size) })) }
    : { ids: rows.map((r) => r.photo_id) };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
}

const body = z.object({ ids: z.array(z.string().uuid()).max(2000), on: z.boolean() });

export async function POST(req: Request) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { supabase, userId } = auth.session;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { ids, on } = parsed.data;
  if (!ids.length) return NextResponse.json({ ok: true });

  const { error } = on
    ? await supabase.from("photo_selections").upsert(ids.map((photo_id) => ({ user_id: userId, photo_id })), { ignoreDuplicates: true })
    : await supabase.from("photo_selections").delete().eq("user_id", userId).in("photo_id", ids);
  if (error) return NextResponse.json({ error: "Could not update selection." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  const { error } = await auth.session.supabase.from("photo_selections").delete().eq("user_id", auth.session.userId);
  if (error) return NextResponse.json({ error: "Could not clear selection." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
