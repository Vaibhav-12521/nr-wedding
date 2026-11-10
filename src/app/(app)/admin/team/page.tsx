import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TeamManager } from "./team-manager";

export const metadata: Metadata = { title: "Admins · Admin" };

export default async function TeamPage() {
  const session = await requireAdmin();
  const svc = createAdminClient();
  const [{ data: people }, { data: pending }] = await Promise.all([
    svc.from("profiles").select("id, email, full_name, role, is_active").eq("is_active", true).order("full_name").limit(1000),
    svc.from("invitations").select("id, email, full_name").eq("role", "admin").is("accepted_at", null).is("user_id", null),
  ]);
  return (
    <TeamManager
      me={session.userId}
      admins={(people ?? []).filter((p) => p.role === "admin")}
      guests={(people ?? []).filter((p) => p.role === "guest")}
      pending={pending ?? []}
    />
  );
}
