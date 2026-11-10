import type { Metadata } from "next";
import Link from "next/link";
import { FloralCorner, Mandala, Ornament } from "@/components/decor";
import { ShareButtons } from "@/components/site/share-buttons";
import { Reveal } from "@/components/site/reveal";
import { coupleNames, getEvents, getWedding } from "@/lib/wedding";
import { env } from "@/lib/env";
import { eventDateLabel, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitationPage() {
  const [w, events] = await Promise.all([getWedding(), getEvents()]);
  const names = coupleNames(w);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-beige/60 via-ivory to-ivory px-4 pb-24 pt-28 sm:pt-36">
      <Mandala className="pointer-events-none absolute left-1/2 top-40 size-[120vmin] -translate-x-1/2 opacity-[0.06]" />
      <Reveal>
        <article className="card-frame paper relative mx-auto max-w-2xl overflow-hidden px-6 py-14 text-center sm:px-14 sm:py-20">
          <FloralCorner className="pointer-events-none absolute -left-3 -top-3 size-36" />
          <FloralCorner flip className="pointer-events-none absolute -right-3 -top-3 size-36" />
          <FloralCorner className="pointer-events-none absolute -bottom-3 -left-3 size-36 -scale-y-100" />
          <FloralCorner flip className="pointer-events-none absolute -bottom-3 -right-3 size-36 -scale-y-100" />

          <p className="text-xs uppercase tracking-[0.4em] text-taupe">With the blessings of our elders</p>
          <p className="mt-6 leading-relaxed text-cocoa/80">
            {w.invitation_message || "We request the pleasure of your company at the wedding celebrations of"}
          </p>
          <h1 className="mt-6 font-script text-6xl font-normal leading-tight text-rose sm:text-7xl">{names}</h1>
          <Ornament className="my-8" />
          <p className="font-display text-xl italic">{w.tagline}</p>

          <div className="mt-10 space-y-6">
            {events.map((e) => (
              <div key={e.id}>
                <p className="font-display text-2xl font-semibold">{e.title}</p>
                <p className="text-gold-deep">{eventDateLabel(e)}{formatTime(e.starts_at) ? ` · ${formatTime(e.starts_at)}` : ""}</p>
                {e.venue_name && <p className="text-taupe">{e.venue_name}</p>}
              </div>
            ))}
          </div>

          {(w.venue_name || w.location) && (
            <p className="mt-10 text-taupe">{[w.venue_name, w.venue_address, w.location].filter(Boolean).join(", ")}</p>
          )}
          <div className="mt-12 flex flex-col items-center gap-4">
            {w.rsvp_enabled && (
              <Link href="/rsvp" className="inline-flex h-12 items-center rounded-full bg-gold px-8 font-medium text-cream hover:bg-gold-deep">RSVP</Link>
            )}
            <ShareButtons text={`You're invited to ${names}'s wedding!`} url={`${env.siteUrl}/invitation`} />
          </div>
        </article>
      </Reveal>
    </section>
  );
}
