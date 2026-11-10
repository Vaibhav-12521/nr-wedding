import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { GuestManager } from "./guest-manager";

export const metadata: Metadata = { title: "Guests" };

export default async function GuestsPage() {
  const session = await requireAdmin();
  const svc = createAdminClient();
  const [{ data: profiles }, { data: invitations }, { data: uploads }] = await Promise.all([
    svc.from("profiles").select("id, email, full_name, role, is_active, created_at").order("created_at", { ascending: false }).limit(1000),
    svc.from("invitations").select("id, email, full_name, role, created_at, accepted_at, user_id").order("created_at", { ascending: false }).limit(1000),
    session.supabase.rpc("upload_counts"),
  ]);
  const counts = new Map<string, number>();
  ((uploads ?? []) as { user_id: string; uploads: number }[]).forEach((u) => counts.set(u.user_id, Number(u.uploads)));
  const members = (profiles ?? []).map((p) => ({ ...p, uploads: counts.get(p.id) ?? 0 }));
  const pending = (invitations ?? []).filter((i) => !i.accepted_at);
  return <GuestManager me={session.userId} members={members} pending={pending} />;
}
