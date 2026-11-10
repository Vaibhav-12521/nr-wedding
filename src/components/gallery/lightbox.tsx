"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Info, Minimize, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LightboxPhoto = { id: string; previewUrl: string; thumbUrl: string; title?: string | null; width?: number | null; height?: number | null };

type Props<T extends LightboxPhoto> = {
  photos: T[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
  actions?: (photo: T) => React.ReactNode;
  info?: (photo: T) => React.ReactNode;
  onNearEnd?: () => void;
};

export function Lightbox<T extends LightboxPhoto>({ photos, index, onIndexChange, actions, info, onNearEnd }: Props<T>) {
  const open = index !== null && photos[index] !== undefined;
  const photo = open ? photos[index] : null;
  const [showInfo, setShowInfo] = useState(false);
  const [full, setFull] = useState(false);
  const [loaded, setLoaded] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((d: number) => {
    if (index === null) return;
    const next = index + d;
    if (next >= 0 && next < photos.length) onIndexChange(next);
    if (next >= photos.length - 4) onNearEnd?.();
  }, [index, photos.length, onIndexChange, onNearEnd]);

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onIndexChange(null);
  }, [onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") close();
      else if (e.key.toLowerCase() === "i") setShowInfo((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [open, go, close]);

  useEffect(() => {
    if (index === null) return;
    [photos[index + 1], photos[index - 1]].forEach((p) => { if (p) new Image().src = p.previewUrl; });
  }, [index, photos]);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {photo && (
        <motion.div
          ref={root}
          key="lightbox"
          className="fixed inset-0 z-50 flex flex-col bg-[#1c1512]/95 text-ivory backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label={photo.title || "Photo viewer"}
          onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
          onTouchEnd={(e) => {
            if (!touch.current) return;
            const dx = e.changedTouches[0].clientX - touch.current.x;
            const dy = e.changedTouches[0].clientY - touch.current.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
            else if (dy > 110) close();
            touch.current = null;
          }}
        >
          <div className="flex items-center gap-2 px-3 py-3 sm:px-5">
            <button ref={closeBtn} type="button" onClick={close} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Close viewer">
              <X className="size-6" />
            </button>
            <p className="min-w-0 flex-1 truncate text-sm text-ivory/80">
              <span className="tabular-nums">{index! + 1} / {photos.length}</span>
              {photo.title && <span className="ml-3 hidden sm:inline">{photo.title}</span>}
            </p>
            {actions?.(photo)}
            {info && (
              <button type="button" onClick={() => setShowInfo((v) => !v)} aria-pressed={showInfo}
                className={cn("inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10", showInfo && "bg-white/15")} aria-label="Photo details">
                <Info className="size-5" />
              </button>
            )}
            <button type="button" className="hidden size-11 items-center justify-center rounded-full hover:bg-white/10 sm:inline-flex"
              onClick={() => { void (full ? document.exitFullscreen() : root.current?.requestFullscreen())?.catch(() => {}); }}
              aria-label={full ? "Exit full screen" : "Full screen"}>
              {full ? <Minimize className="size-5" /> : <Expand className="size-5" />}
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1">
            <div className="relative flex min-w-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
              {loaded !== photo.id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.thumbUrl} alt="" aria-hidden className="absolute max-h-full max-w-full scale-[1.02] object-contain blur-md" />
              )}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={photo.id}
                  src={photo.previewUrl}
                  alt={photo.title || "Wedding photo"}
                  onLoad={() => setLoaded(photo.id)}
                  className="relative max-h-full max-w-full select-none rounded-sm object-contain shadow-2xl"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  draggable={false}
                />
              </AnimatePresence>
              <button type="button" onClick={() => go(-1)} disabled={index === 0}
                className="absolute left-2 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 sm:inline-flex" aria-label="Previous photo">
                <ChevronLeft className="size-6" />
              </button>
              <button type="button" onClick={() => go(1)} disabled={index === photos.length - 1}
                className="absolute right-2 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 sm:inline-flex" aria-label="Next photo">
                <ChevronRight className="size-6" />
              </button>
            </div>
            {info && showInfo && (
              <aside className="absolute inset-x-0 bottom-0 max-h-[50%] overflow-y-auto rounded-t-2xl bg-[#2a201b] p-5 text-sm sm:static sm:inset-auto sm:max-h-none sm:w-80 sm:rounded-none sm:border-l sm:border-white/10">
                {info(photo)}
              </aside>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
