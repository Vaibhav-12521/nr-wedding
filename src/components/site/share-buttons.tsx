"use client";

import { Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

export function ShareButtons({ text, url, className }: { text: string; url: string; className?: string }) {
  const message = `${text} ${url}`;
  const native = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Neha's Wedding", text, url }); } catch {  }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };
  const btn = "inline-flex h-11 items-center gap-2 rounded-full border border-champagne/60 bg-cream/80 px-4 text-sm font-medium text-cocoa backdrop-blur transition hover:border-gold hover:text-gold-deep";
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="size-4 text-[#25D366]" /> WhatsApp
      </a>
      <button type="button" className={btn} onClick={native}>
        <Share2 className="size-4" /> Share
      </button>
      <button type="button" className={btn} onClick={copy} aria-label="Copy link">
        <Link2 className="size-4" /> Copy link
      </button>
    </div>
  );
}
