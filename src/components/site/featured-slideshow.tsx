"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Lightbox } from "@/components/gallery/lightbox";
import type { PublicPhoto } from "@/lib/public-gallery";
import { cn } from "@/lib/utils";

export function FeaturedSlideshow({ photos }: { photos: PublicPhoto[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [viewer, setViewer] = useState<number | null>(null);
  const touch = useRef<number | null>(null);
  const go = useCallback((d: number) => setI((x) => (x + d + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (!playing || viewer !== null || photos.length < 2) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [playing, viewer, go, photos.length]);

  if (!photos.length) return null;
  const p = photos[i];
  return (
    <div className="mx-auto max-w-5xl">
      <div className="card-frame relative overflow-hidden p-2 sm:p-3"
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (touch.current !== null) { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); } touch.current = null; }}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-beige sm:aspect-[16/9]">
          <AnimatePresence initial={false}>
            <motion.button key={p.id} type="button" onClick={() => setViewer(i)} className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
              aria-label={`View photo ${i + 1} of ${photos.length}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt={p.title ?? "Wedding photo"} className="relative h-full w-full object-contain" />
            </motion.button>
          </AnimatePresence>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/80 text-cocoa shadow backdrop-blur hover:bg-cream" aria-label="Previous photo"><ChevronLeft className="size-5" /></button>
              <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/80 text-cocoa shadow backdrop-blur hover:bg-cream" aria-label="Next photo"><ChevronRight className="size-5" /></button>
              <button type="button" onClick={() => setPlaying((v) => !v)} className="absolute bottom-3 right-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-cream/80 text-cocoa shadow backdrop-blur" aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
            </>
          )}
          {p.title && <p className="absolute bottom-3 left-3 z-10 max-w-[70%] truncate rounded-full bg-cocoa/55 px-3 py-1 text-sm text-ivory backdrop-blur">{p.title}</p>}
        </div>
      </div>
      {photos.length > 1 && (
        <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Choose photo">
          {photos.map((ph, j) => (
            <button key={ph.id} type="button" role="tab" aria-selected={j === i} onClick={() => setI(j)} aria-label={`Photo ${j + 1}`}
              className={cn("h-1.5 rounded-full transition-all", j === i ? "w-8 bg-gold" : "w-3 bg-champagne/50 hover:bg-champagne")} />
          ))}
        </div>
      )}
      <Lightbox photos={photos} index={viewer} onIndexChange={setViewer} />
    </div>
  );
}
