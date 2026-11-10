import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signMany } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Moderation } from "./moderation";

export const metadata: Metadata = { title: "Photos · Admin" };
const PER_PAGE = 48;

export default async function AdminPhotosPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "public" || sp.tab === "all" ? sp.tab : "pending";
  const page = Math.max(0, Number(sp.page) || 0);
  const { supabase } = await requireAdmin();

  let q = supabase.from("photos").select(
    "id, original_filename, title, created_at, album_id, visibility, approval_status, file_size, thumbnail_path, preview_path, album:albums!photos_album_id_fkey(name), uploader:profiles!photos_uploaded_by_fkey(full_name)",
    { count: "exact" });
  if (tab === "pending") q = q.eq("approval_status", "pending");
  if (tab === "public") q = q.eq("visibility", "public");
  const [{ data, count }, { data: albums }] = await Promise.all([
    q.order("created_at", { ascending: tab === "pending" }).range(page * PER_PAGE, page * PER_PAGE + PER_PAGE - 1),
    supabase.from("albums").select("id, name").order("sort_order"),
  ]);
  const urls = await signMany((data ?? []).flatMap((p) => [p.thumbnail_path, p.preview_path]));
  const photos = (data ?? []).map((p) => ({
    id: p.id,
    filename: p.original_filename,
    title: p.title,
    createdAt: p.created_at,
    albumName: (p.album as unknown as { name?: string } | null)?.name ?? "",
    uploaderName: (p.uploader as unknown as { full_name?: string } | null)?.full_name || "Guest",
    visibility: p.visibility as "public" | "private",
    approval: p.approval_status as string,
    thumbUrl: urls.get(p.thumbnail_path) ?? "",
    previewUrl: urls.get(p.preview_path) ?? "",
  }));
  const pages = Math.ceil((count ?? 0) / PER_PAGE);
  const tabs = [["pending", "Awaiting approval"], ["public", "Public gallery"], ["all", "All photos"]] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Link key={key} href={`/admin/photos?tab=${key}`}
            className={cn("inline-flex h-9 items-center rounded-full px-4 text-sm font-medium", tab === key ? "bg-gold text-cream" : "bg-cream ring-1 ring-champagne/40")}>
            {label}
          </Link>
        ))}
      </div>
      <p className="text-sm text-taupe">
        {tab === "pending" ? "Guests suggested these for the public website. Nothing is public until you approve it."
          : tab === "public" ? "Everyone can see these on the public gallery page."
          : "Every photo in every album."}{" "}{count ?? 0} photo{count === 1 ? "" : "s"}.
      </p>
      <Moderation key={`${tab}-${page}`} photos={photos} albums={albums ?? []} tab={tab} />
      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3 pt-4">
          {page > 0 && <Link href={`/admin/photos?tab=${tab}&page=${page - 1}`} className="rounded-full border border-input px-4 py-2 text-sm">← Previous</Link>}
          <span className="text-sm text-taupe">Page {page + 1} of {pages}</span>
          {page + 1 < pages && <Link href={`/admin/photos?tab=${tab}&page=${page + 1}`} className="rounded-full border border-input px-4 py-2 text-sm">Next →</Link>}
        </nav>
      )}
    </div>
  );
}
