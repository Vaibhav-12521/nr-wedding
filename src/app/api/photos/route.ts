import { NextResponse } from "next/server";
import { apiMember } from "@/lib/auth";
import { listPhotos, parseFilters } from "@/lib/photos";

export async function GET(req: Request) {
  const auth = await apiMember();
  if (auth.error) return auth.error;
  try {
    const result = await listPhotos(auth.session, parseFilters(new URL(req.url).searchParams));
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not load photos." }, { status: 500 });
  }
}
