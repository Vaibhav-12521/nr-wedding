"use client";

import { useState } from "react";
import { Lightbox } from "@/components/gallery/lightbox";
import type { PublicPhoto } from "@/lib/public-gallery";

export function PublicGallery({ photos }: { photos: PublicPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
        {photos.map((p, i) => (
          <li key={p.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block w-full overflow-hidden rounded-xl bg-beige outline-none ring-champagne focus-visible:ring-4"
              style={{ aspectRatio: p.width && p.height ? `${p.width} / ${p.height}` : "3 / 4" }}
              aria-label={`Open photo ${i + 1}${p.title ? `: ${p.title}` : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt={p.title ?? ""} loading="lazy" decoding="async"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cocoa/40 via-transparent opacity-0 transition group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        photos={photos}
        index={index}
        onIndexChange={setIndex}
        info={(p) => (
          <dl className="space-y-3">
            {p.title && <div><dt className="text-ivory/50">Title</dt><dd>{p.title}</dd></div>}
            {p.albumName && <div><dt className="text-ivory/50">Album</dt><dd>{p.albumName}</dd></div>}
          </dl>
        )}
      />
    </>
  );
}
