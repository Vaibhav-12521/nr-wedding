import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart, FolderHeart, HardDrive, ImageIcon, ShieldCheck, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { signMany } from "@/lib/storage";
import { formatBytes, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin" };

type Stats = {
  photos: number; users: number; inactive_users: number; pending_invites: number; albums: number; storage_bytes: number;
  pending_approvals: number; public_photos: number; rsvps: number; rsvp_guests: number; daily_uploads: { day: string; count: number }[];
};

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();
  const [{ data: stats, error }, { data: recent }] = await Promise.all([
    supabase.rpc("admin_stats"),
    supabase.from("photos")
      .select("id, original_filename, created_at, thumbnail_path, album:albums!photos_album_id_fkey(name), uploader:profiles!photos_uploaded_by_fkey(full_name)")
      .order("created_at", { ascending: false }).limit(12),
  ]);
  if (error || !stats) return <p className="text-destructive">Could not load statistics.</p>;
  const s = stats as Stats;
  const urls = await signMany((recent ?? []).map((r) => r.thumbnail_path));
  const quotaGb = Number(process.env.STORAGE_QUOTA_GB) || null;
  const usedBytes = Math.round(s.storage_bytes * 1.08);
  const max = Math.max(1, ...s.daily_uploads.map((d) => d.count));

  const cards = [
    { label: "Photos", value: s.photos.toLocaleString("en-IN"), sub: `${s.public_photos} public`, icon: ImageIcon, href: "/admin/photos" },
    { label: "Guests", value: s.users, sub: `${s.pending_invites} invitations pending${s.inactive_users ? ` · ${s.inactive_users} inactive` : ""}`, icon: Users, href: "/admin/guests" },
    { label: "Albums", value: s.albums, sub: "Manage albums", icon: FolderHeart, href: "/admin/albums" },
    { label: "Storage", value: formatBytes(usedBytes), sub: quotaGb ? `${Math.round((usedBytes / (quotaGb * 1024 ** 3)) * 100)}% of ${quotaGb} GB` : "originals + previews", icon: HardDrive },
    { label: "Awaiting approval", value: s.pending_approvals, sub: "for the public gallery", icon: ShieldCheck, href: "/admin/photos", highlight: s.pending_approvals > 0 },
    { label: "RSVPs", value: s.rsvps, sub: `${s.rsvp_guests} guests attending`, icon: CalendarHeart, href: "/admin/rsvps" },
  ];

  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => {
          const body = (
            <div className={`h-full rounded-2xl border p-5 transition ${c.highlight ? "border-rose/60 bg-blush/30" : "border-champagne/40 bg-cream"} ${c.href ? "hover:border-gold" : ""}`}>
              <c.icon className="size-5 text-gold" />
              <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{c.value}</p>
              <p className="text-sm font-medium">{c.label}</p>
              <p className="mt-0.5 text-xs text-taupe">{c.sub}</p>
            </div>
          );
          return <li key={c.label}>{c.href ? <Link href={c.href}>{body}</Link> : body}</li>;
        })}
      </ul>

      {quotaGb && (
        <div className="rounded-2xl border border-champagne/40 bg-cream p-5">
          <p className="text-sm font-medium">Storage used</p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-beige">
            <div className="h-full rounded-full bg-gradient-to-r from-champagne to-gold" style={{ width: `${Math.min(100, (usedBytes / (quotaGb * 1024 ** 3)) * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-taupe">{formatBytes(usedBytes)} of {quotaGb} GB (set STORAGE_QUOTA_GB to your Supabase plan&apos;s limit)</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-champagne/40 bg-cream p-5 lg:col-span-2">
          <h2 className="font-display text-2xl">Upload activity</h2>
          <p className="text-sm text-taupe">Photos added per day, last 14 days</p>
          <div className="mt-5 flex h-40 items-end gap-1.5" role="img" aria-label="Uploads per day for the last 14 days">
            {s.daily_uploads.map((d) => (
              <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end">
                <span className="absolute -top-6 hidden rounded bg-cocoa px-1.5 py-0.5 text-[0.65rem] text-ivory group-hover:block">{d.count}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-gold to-champagne" style={{ height: `${Math.max(2, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[0.65rem] text-taupe">
            <span>{new Date(s.daily_uploads[0]?.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            <span>Today</span>
          </div>
          <Link href="/admin/activity" className="mt-4 inline-block text-sm font-medium text-gold-deep underline-offset-4 hover:underline">Full activity log →</Link>
        </section>

        <section className="rounded-2xl border border-champagne/40 bg-cream p-5 lg:col-span-3">
          <h2 className="font-display text-2xl">Recent uploads</h2>
          {recent?.length ? (
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {recent.map((r) => (
                <li key={r.id} className="min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urls.get(r.thumbnail_path)} alt="" className="aspect-square w-full rounded-lg bg-beige object-cover" loading="lazy" />
                  <p className="mt-1 truncate text-xs font-medium">{(r.uploader as unknown as { full_name?: string } | null)?.full_name || "Guest"}</p>
                  <p className="truncate text-[0.7rem] text-taupe">{(r.album as unknown as { name?: string } | null)?.name} · {formatDateTime(r.created_at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-taupe">No photos yet. <Link href="/upload" className="text-gold-deep underline">Upload the first ones</Link>.</p>
          )}
        </section>
      </div>
    </div>
  );
}
