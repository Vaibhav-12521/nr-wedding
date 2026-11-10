"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Globe, Loader2, Sparkles, X } from "lucide-react";
import { Panel, runAction } from "@/components/admin/admin-ui";
import { Uploader } from "@/components/photos/uploader";
import { featurePhotos, reorderFeatured } from "../actions";
import { cn } from "@/lib/utils";

type P = { id: string; name: string; isPublic: boolean; album: string; thumbUrl: string };

export function WebsitePhotos({ featured: initial, recent, albums }: { featured: P[]; recent: P[]; albums: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const [featured, setFeatured] = useState(initial);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const move = async (i: number, d: number) => {
    const next = [...featured];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    setFeatured(next);
    await runAction(reorderFeatured(next.map((p) => p.id)), "Order saved");
  };
  const feature = async (ids: string[]) => {
    setBusy(true);
    if (await runAction(featurePhotos(ids, true))) { setPicked(new Set()); router.refresh(); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <Panel title={`On the website now (${featured.length})`}
        description="These photos play as the slideshow on the homepage, in this order. They are also shown in the public gallery.">
        {featured.length ? (
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {featured.map((p, i) => (
              <li key={p.id} className="overflow-hidden rounded-xl border border-champagne/40 bg-ivory">
                <div className="relative aspect-square bg-beige">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbUrl} alt="" className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-cocoa/70 px-2 text-xs font-semibold text-ivory">{i + 1}</span>
                </div>
                <div className="flex items-center justify-between p-1.5">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30" aria-label="Move earlier"><ArrowLeft className="size-4" /></button>
                  <button type="button" onClick={async () => { if (await runAction(featurePhotos([p.id], false))) { setFeatured((l) => l.filter((x) => x.id !== p.id)); router.refresh(); } }}
                    className="inline-flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Remove from website"><X className="size-4" /></button>
                  <button type="button" disabled={i === featured.length - 1} onClick={() => move(i, 1)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30" aria-label="Move later"><ArrowRight className="size-4" /></button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-taupe">No photos on the website yet. Upload some below, or pick from the album.</p>
        )}
        <p className="mt-4 text-sm text-taupe">
          Bride &amp; groom portraits and the homepage background are set in{" "}
          <Link href="/admin/wedding" className="font-medium text-gold-deep underline underline-offset-4">Wedding details</Link>.
        </p>
      </Panel>

      <Panel title="Upload photos for the website" description="Photos you upload here are saved to the chosen album and go straight onto the website.">
        {albums.length ? (
          <Uploader compact albums={albums} onUploaded={(ids) => feature(ids)} />
        ) : (
          <p className="text-taupe">Create an album first (Admin → Albums).</p>
        )}
      </Panel>

      <Panel title="Choose from the album" description="Recent photos from every album. Choosing a private photo publishes it."
        actions={picked.size > 0 && (
          <button type="button" onClick={() => feature([...picked])} disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gold px-5 text-sm font-medium text-cream hover:bg-gold-deep disabled:opacity-60">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Show {picked.size} on website
          </button>
        )}>
        {recent.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
            {recent.map((p) => {
              const on = picked.has(p.id);
              return (
                <li key={p.id}>
                  <button type="button" aria-pressed={on} onClick={() => setPicked((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })}
                    className={cn("relative block aspect-square w-full overflow-hidden rounded-lg bg-beige ring-offset-2 transition", on && "ring-[3px] ring-gold")}
                    title={`${p.name} · ${p.album}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumbUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                    {on && <span className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-gold text-cream"><Check className="size-3.5" strokeWidth={3} /></span>}
                    {p.isPublic && <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/40 p-1 text-white" title="Already public"><Globe className="size-3" /></span>}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-taupe">No photos in the album yet.</p>
        )}
      </Panel>
    </div>
  );
}
