import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const [{ count }, { count: wishes }] = await Promise.all([
    session.supabase.from("photos").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
    session.supabase.from("wishes").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return (
    <div className="pb-32 pt-4">
      <p className="font-script text-3xl text-rose">Family admin</p>
      <h1 className="mb-5 text-4xl font-medium sm:text-5xl">Dashboard</h1>
      <AdminNav pending={count ?? 0} wishes={wishes ?? 0} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
