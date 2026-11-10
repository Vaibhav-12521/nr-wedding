import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { WishRow } from "./wish-row";

export const metadata: Metadata = { title: "Blessings · Admin" };

export default async function AdminWishesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab === "approved" ? "approved" : "pending";
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("wishes").select("id, name, message, status, created_at")
    .eq("status", tab).order("created_at", { ascending: tab === "pending" }).limit(500);
  return (
    <Panel title="Blessings" description="Guests' wishes appear on the website only after you approve them.">
      <div className="mb-4 flex gap-2">
        {(["pending", "approved"] as const).map((t) => (
          <Link key={t} href={`/admin/wishes?tab=${t}`}
            className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-medium", tab === t ? "bg-gold text-cream" : "bg-ivory ring-1 ring-champagne/40")}>
            {t === "pending" ? "Waiting for approval" : "On the website"}
          </Link>
        ))}
      </div>
      {data?.length ? (
        <ul className="divide-y divide-champagne/30">{data.map((w) => <WishRow key={w.id} wish={w} />)}</ul>
      ) : (
        <p className="text-taupe">{tab === "pending" ? "Nothing waiting." : "No approved blessings yet."}</p>
      )}
    </Panel>
  );
}
