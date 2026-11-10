"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, Download, Heart, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useSelection } from "@/components/photos/selection-context";
import { downloadZip, zipParts } from "@/components/photos/zip-download";
import { LIMITS } from "@/lib/env";

export function SelectionBar({ visibleIds, onFavourited }: { visibleIds: string[]; onFavourited?: (ids: string[]) => void }) {
  const { selected, set, clear } = useSelection();
  const [busy, setBusy] = useState<"zip" | "fav" | null>(null);
  const [parts, setParts] = useState<string[][] | null>(null);
  const count = selected.size;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const startZip = async () => {
    setBusy("zip");
    try {
      const r = await fetch("/api/selection?sizes=1", { cache: "no-store" });
      const { items } = (await r.json()) as { items: { id: string; size: number }[] };
      if (!items?.length) return toast.error("Nothing to download.");
      const split = zipParts(items, LIMITS.zipMaxPhotos, LIMITS.zipMaxBytes);
      if (split.length === 1) {
        downloadZip(split[0]);
        toast.success(`Preparing ${items.length} photo${items.length === 1 ? "" : "s"} - your download will start shortly.`);
      } else {
        setParts(split);
      }
    } catch {
      toast.error("Couldn't start the download.");
    } finally {
      setBusy(null);
    }
  };

  const favourite = async () => {
    setBusy("fav");
    const ids = [...selected];
    try {
      for (let i = 0; i < ids.length; i += 1000) {
        const r = await fetch("/api/favourites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: ids.slice(i, i + 1000), on: true }) });
        if (!r.ok) throw new Error();
      }
      onFavourited?.(ids);
      toast.success(`Added ${ids.length} to favourites`);
    } catch {
      toast.error("Couldn't add to favourites.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      {(count > 0 || visibleIds.length > 0) && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 px-3 md:bottom-5"
        >
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-champagne/50 bg-cream/95 p-2.5 shadow-[0_18px_50px_-20px_rgba(58,46,42,0.45)] backdrop-blur">
            <p className="px-2 text-sm font-semibold text-cocoa" aria-live="polite">
              {count ? <>Selected: <span className="tabular-nums">{count}</span> photo{count === 1 ? "" : "s"}</> : "Nothing selected"}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => set(visibleIds, !allVisibleSelected)} disabled={!visibleIds.length}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-gold-deep hover:bg-blush/40 disabled:opacity-40">
                <CheckSquare className="size-4" /> {allVisibleSelected ? "Deselect visible" : "Select all visible"}
              </button>
              {count > 0 && (
                <>
                  <button type="button" onClick={favourite} disabled={busy !== null}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-rose hover:bg-blush/40 disabled:opacity-50" aria-label="Add selected to favourites">
                    {busy === "fav" ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}
                    <span className="hidden sm:inline">Add to Favourites</span>
                  </button>
                  <Link href="/selection" className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-cocoa hover:bg-blush/40">View</Link>
                  <button type="button" onClick={clear} disabled={busy !== null}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-taupe hover:bg-muted" aria-label="Remove selection">
                    <X className="size-4" /> <span className="hidden sm:inline">Remove Selection</span>
                  </button>
                  <button type="button" onClick={startZip} disabled={busy !== null}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gold px-4 text-sm font-medium text-cream hover:bg-gold-deep disabled:opacity-60">
                    {busy === "zip" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    Download Selected
                  </button>
                </>
              )}
            </div>
          </div>

          {parts && (
            <div className="mx-auto mt-2 max-w-3xl rounded-2xl border border-champagne/50 bg-cream p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-cocoa">
                  Your selection is larger than one ZIP ({LIMITS.zipMaxPhotos} photos / 2 GB), so it&apos;s split into {parts.length} parts. Download each one:
                </p>
                <button type="button" onClick={() => setParts(null)} aria-label="Close" className="text-taupe"><X className="size-4" /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {parts.map((p, i) => (
                  <button key={i} type="button" onClick={() => { downloadZip(p); toast.success(`Part ${i + 1} is being prepared`); }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-gold/50 px-4 text-sm font-medium text-gold-deep hover:bg-blush/30">
                    <Download className="size-4" /> Part {i + 1} ({p.length})
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
