"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff, FolderInput, Globe, Sparkles, Trash2, X } from "lucide-react";
import { Lightbox } from "@/components/gallery/lightbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { runAction } from "@/components/admin/admin-ui";
import { deletePhotos, featurePhotos, makePhotoPrivate, movePhotos, reviewPhoto } from "../actions";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type P = {
  id: string; filename: string; title: string | null; createdAt: string; albumName: string; uploaderName: string;
  visibility: "public" | "private"; approval: string; thumbUrl: string; previewUrl: string;
};

export function Moderation({ photos, albums, tab }: { photos: P[]; albums: { id: string; name: string }[]; tab: string }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const done = async (p: ReturnType<typeof reviewPhoto>, msg?: string) => { if (await runAction(p, msg)) { setSel(new Set()); router.refresh(); } };

  if (!photos.length) {
    return <div className="rounded-2xl border border-champagne/40 bg-cream p-10 text-center text-taupe">{tab === "pending" ? "Nothing waiting for approval." : "No photos."}</div>;
  }

  return (
    <>
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-champagne/40 bg-cream/95 p-2.5 backdrop-blur">
        <button type="button" onClick={() => setSel(sel.size === photos.length ? new Set() : new Set(photos.map((p) => p.id)))}
          className="h-9 rounded-full px-3 text-sm font-medium text-gold-deep hover:bg-blush/40">
          {sel.size === photos.length ? "Deselect all" : "Select all on page"}
        </button>
        <span className="text-sm text-taupe">{sel.size} selected</span>
        {sel.size > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {tab === "pending" && (
              <button type="button" onClick={async () => { for (const id of sel) await reviewPhoto(id, true); await done(Promise.resolve({ ok: true }), "Approved"); }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-3 text-sm font-medium text-white"><Check className="size-4" /> Approve</button>
            )}
            <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className="h-9 rounded-full border border-input bg-ivory px-3 text-sm" aria-label="Move to album">
              <option value="">Move to album…</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {moveTo && (
              <button type="button" onClick={() => done(movePhotos([...sel], moveTo))} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold/50 px-3 text-sm font-medium text-gold-deep">
                <FolderInput className="size-4" /> Move
              </button>
            )}
            <button type="button" onClick={() => setConfirmDelete([...sel])} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-destructive/10 px-3 text-sm font-medium text-destructive">
              <Trash2 className="size-4" /> Delete
            </button>
          </div>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id} className={cn("overflow-hidden rounded-2xl border bg-cream", sel.has(p.id) ? "border-gold ring-2 ring-gold" : "border-champagne/40")}>
            <div className="relative aspect-square bg-beige">
              <button type="button" onClick={() => setIndex(i)} className="absolute inset-0" aria-label={`View ${p.filename}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
              <label className="absolute left-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/30 backdrop-blur">
                <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} className="size-4 accent-[#a9813f]" aria-label={`Select ${p.filename}`} />
              </label>
              {p.visibility === "public" && <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">Public</span>}
              {p.approval === "pending" && <span className="absolute right-2 top-2 rounded-full bg-rose px-2 py-0.5 text-xs text-white">Pending</span>}
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-medium">{p.title || p.filename}</p>
              <p className="truncate text-xs text-taupe">{p.uploaderName} · {p.albumName}</p>
              <p className="text-xs text-taupe">{formatDateTime(p.createdAt)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.approval === "pending" ? (
                  <>
                    <button type="button" onClick={() => done(reviewPhoto(p.id, true), "Approved - now public")} className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-600 px-3 text-xs font-medium text-white"><Check className="size-3.5" /> Approve</button>
                    <button type="button" onClick={() => done(reviewPhoto(p.id, false), "Kept private")} className="inline-flex h-8 items-center gap-1 rounded-full border border-input px-3 text-xs font-medium"><X className="size-3.5" /> Reject</button>
                  </>
                ) : p.visibility === "public" ? (
                  <button type="button" onClick={() => done(makePhotoPrivate(p.id), "Removed from public gallery")} className="inline-flex h-8 items-center gap-1 rounded-full border border-input px-3 text-xs font-medium"><EyeOff className="size-3.5" /> Make private</button>
                ) : (
                  <button type="button" onClick={() => done(reviewPhoto(p.id, true), "Published")} className="inline-flex h-8 items-center gap-1 rounded-full border border-gold/50 px-3 text-xs font-medium text-gold-deep"><Globe className="size-3.5" /> Publish</button>
                )}
                <button type="button" onClick={() => done(featurePhotos([p.id], true))} title="Show in the homepage slideshow"
                  className="inline-flex size-8 items-center justify-center rounded-full text-gold-deep hover:bg-blush/40" aria-label="Feature on website"><Sparkles className="size-3.5" /></button>
                <button type="button" onClick={() => setConfirmDelete([p.id])} className="inline-flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Lightbox photos={photos} index={index} onIndexChange={setIndex}
        info={(p) => <p className="text-ivory/80">{p.filename}<br />by {p.uploaderName} · {p.albumName}</p>} />
      <ConfirmDialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.length ?? 0} photo${confirmDelete?.length === 1 ? "" : "s"}?`}
        description="These photos and their original files will be permanently removed for everyone." confirmLabel="Delete"
        onConfirm={() => confirmDelete && done(deletePhotos(confirmDelete))} />
    </>
  );
}
