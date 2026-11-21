"use client";

import { useEffect, useState } from "react";
import { Download, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** The couple's printed invitation card, framed like a keepsake. Tap to view full screen. */
export function InvitationCardPhoto({ src, names, className }: { src: string; names: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const filename = `${names.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "")}-invitation.webp`;
  const download = `${src}?download=${encodeURIComponent(filename)}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  return (
    <figure className={cn("group relative mx-auto w-full max-w-md", className)}>
      {/* soft golden halo behind the card */}
      <div aria-hidden className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.35),transparent_70%)] blur-2xl" />
      <button type="button" onClick={() => setOpen(true)}
        className="relative block w-full rotate-[-1.5deg] rounded-xl bg-gradient-to-br from-[#f7e7b4] via-[#c99b4a] to-[#8f6524] p-[3px] shadow-[0_30px_60px_-24px_rgba(90,40,20,0.55),0_12px_24px_-8px_rgba(90,60,30,0.25)] transition duration-700 ease-[var(--ease-soft)] hover:rotate-0 hover:scale-[1.015] focus-visible:rotate-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
        aria-label="View the invitation card full screen">
        <span className="block overflow-hidden rounded-[0.6rem] bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Wedding invitation card for ${names}`} className="block h-auto w-full" />
        </span>
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-cocoa/70 px-3 py-1.5 text-xs font-medium text-ivory opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100">
          <Expand className="size-3.5" /> View full size
        </span>
      </button>
      <figcaption className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/50 bg-cream/80 px-5 text-sm font-medium text-gold-deep transition hover:border-gold hover:bg-cream">
          <Expand className="size-4" /> View card
        </button>
        <a href={download} className="btn-gold inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-cream">
          <Download className="size-4" /> Download
        </a>
      </figcaption>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Invitation card"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1e0a0e]/90 p-4 backdrop-blur-sm page-in"
          onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Wedding invitation card for ${names}`} onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-full rounded-lg object-contain shadow-2xl" />
          <div className="absolute right-4 top-4 flex gap-2">
            <a href={download} onClick={(e) => e.stopPropagation()} aria-label="Download the invitation card"
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"><Download className="size-5" /></a>
            <button type="button" autoFocus onClick={() => setOpen(false)} aria-label="Close"
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"><X className="size-5" /></button>
          </div>
        </div>
      )}
    </figure>
  );
}
