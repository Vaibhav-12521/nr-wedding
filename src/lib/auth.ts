import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile } from "@/lib/types";

export type Session = {
  userId: string;
  email: string;
  profile: Profile;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export const getSession = cache(async (): Promise<Session | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;
  return { userId: user.id, email: user.email ?? "", profile, supabase };
});

export async function requireMember(next = "/photos"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!session.profile.is_active) redirect("/login?error=inactive");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireMember("/admin");
  if (session.profile.role !== "admin") notFound();
  return session;
}

type ApiResult = { session: Session; error?: never } | { session?: never; error: NextResponse };

export async function apiMember(): Promise<ApiResult> {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  if (!session.profile.is_active) return { error: NextResponse.json({ error: "Your account is not active." }, { status: 403 }) };
  return { session };
}

export async function apiAdmin(): Promise<ApiResult> {
  const r = await apiMember();
  if (r.error) return r;
  if (r.session.profile.role !== "admin") return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  return r;
}
