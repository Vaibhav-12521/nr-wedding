import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth";
import { formatBytes, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Activity · Admin" };
const PER_PAGE = 50;

const LABEL: Record<string, string> = {
  upload: "uploaded", delete: "deleted", download: "downloaded", zip_download: "downloaded a ZIP of",
  approve: "approved for the public gallery", reject: "kept private", visibility_change: "changed the visibility of",
};

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page) || 0);
  const { supabase } = await requireAdmin();
  let q = supabase.from("upload_activity")
    .select("id, action, bytes, detail, created_at, user:profiles!upload_activity_user_id_fkey(full_name), album:albums(name)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (sp.action && sp.action in LABEL) q = q.eq("action", sp.action);
  const { data, count } = await q.range(page * PER_PAGE, page * PER_PAGE + PER_PAGE - 1);
  const pages = Math.ceil((count ?? 0) / PER_PAGE);

  return (
    <Panel title="Activity log" description="Uploads, downloads, deletions and approvals - newest first."
      actions={
        <form className="flex gap-2">
          <select name="action" defaultValue={sp.action ?? ""} className="h-10 rounded-full border border-input bg-ivory px-3 text-sm" aria-label="Filter by action">
            <option value="">All actions</option>
            {Object.keys(LABEL).map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}
          </select>
          <button className="h-10 rounded-full bg-gold px-4 text-sm font-medium text-cream">Filter</button>
        </form>
      }>
      {data?.length ? (
        <ul className="divide-y divide-champagne/30">
          {data.map((a) => {
            const detail = a.detail as { filename?: string; count?: number };
            const who = (a.user as unknown as { full_name?: string } | null)?.full_name || "Someone";
            const album = (a.album as unknown as { name?: string } | null)?.name;
            const what = a.action === "zip_download" ? `${detail.count ?? "?"} photos` : detail.filename ?? "a photo";
            return (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 py-2.5 text-sm">
                <span className="font-medium">{who}</span>
                <span className="text-taupe">{LABEL[a.action] ?? a.action}</span>
                <span className="font-medium">{what}</span>
                {album && <span className="text-taupe">in {album}</span>}
                {a.bytes ? <span className="text-taupe">· {formatBytes(Number(a.bytes))}</span> : null}
                <span className="ml-auto text-xs text-taupe">{formatDateTime(a.created_at)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-taupe">No activity yet.</p>
      )}
      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3">
          {page > 0 && <Link href={`/admin/activity?page=${page - 1}${sp.action ? `&action=${sp.action}` : ""}`} className="rounded-full border border-input px-4 py-2 text-sm">← Newer</Link>}
          <span className="text-sm text-taupe">Page {page + 1} of {pages}</span>
          {page + 1 < pages && <Link href={`/admin/activity?page=${page + 1}${sp.action ? `&action=${sp.action}` : ""}`} className="rounded-full border border-input px-4 py-2 text-sm">Older →</Link>}
        </nav>
      )}
    </Panel>
  );
}
