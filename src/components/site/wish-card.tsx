import { Quote } from "lucide-react";
import type { Wish } from "@/lib/types";

export function WishCard({ wish }: { wish: Wish }) {
  return (
    <figure className="card-frame paper break-inside-avoid p-6">
      <Quote className="relative z-10 size-6 text-champagne" />
      <blockquote className="relative z-10 mt-2 whitespace-pre-line font-display text-xl leading-snug text-cocoa">{wish.message}</blockquote>
      <figcaption className="relative z-10 mt-4 font-script text-2xl text-rose">- {wish.name}</figcaption>
    </figure>
  );
}
