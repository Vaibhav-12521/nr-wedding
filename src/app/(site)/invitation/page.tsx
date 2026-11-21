import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart, MapPin, Navigation } from "lucide-react";
import { FloralCorner, Mandala, Ornament } from "@/components/decor";
import { ShareButtons } from "@/components/site/share-buttons";
import { InvitationCardPhoto } from "@/components/site/invitation-card";
import { Reveal } from "@/components/site/reveal";
import { coupleNames, getEvents, getWedding, siteImageUrl } from "@/lib/wedding";
import { env } from "@/lib/env";
import { directionsUrl, eventDateLabel, eventDayParts, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitationPage() {
  const [w, events] = await Promise.all([getWedding(), getEvents()]);
  const names = coupleNames(w);
  const card = siteImageUrl(w.invitation_card_path);
  const venue = [w.venue_name, w.venue_address, w.location].filter(Boolean).join(", ");
  const maps = directionsUrl(w.maps_url, w.venue_address, w.venue_name);

  const letter = (
    <article className="card-frame paper relative mx-auto w-full max-w-2xl overflow-hidden px-6 py-14 text-center sm:px-14 sm:py-20">
      <FloralCorner className="pointer-events-none absolute -left-3 -top-3 size-28 sm:size-36" />
      <FloralCorner flip className="pointer-events-none absolute -right-3 -top-3 size-28 sm:size-36" />
      <FloralCorner className="pointer-events-none absolute -bottom-3 -left-3 size-28 -scale-y-100 sm:size-36" />
      <FloralCorner flip className="pointer-events-none absolute -bottom-3 -right-3 size-28 -scale-y-100 sm:size-36" />

      <p className="text-[0.68rem] uppercase tracking-[0.4em] text-taupe sm:text-xs">With the blessings of our elders</p>
      <p className="mx-auto mt-6 max-w-md leading-relaxed text-cocoa/80">
        {w.invitation_message || "We request the pleasure of your company at the wedding celebrations of"}
      </p>
      <h1 className="mt-6 font-script text-6xl font-normal leading-tight text-rose sm:text-7xl">{names}</h1>
      <Ornament className="my-8" />
      <p className="font-display text-xl italic text-cocoa/85">{w.tagline}</p>

      <ol className="mx-auto mt-10 max-w-md divide-y divide-champagne/40 border-y border-champagne/40 text-left">
        {events.map((e) => {
          const d = eventDayParts(e);
          const time = formatTime(e.starts_at);
          return (
            <li key={e.id} className="flex items-center gap-5 py-5">
              <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl border border-champagne/60 bg-cream text-center shadow-[0_8px_20px_-14px_rgba(138,106,49,0.8)]">
                {d ? (
                  <>
                    <span className="font-display text-2xl font-semibold leading-none text-gold-deep">{d.day}</span>
                    <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-cocoa">{d.month}</span>
                  </>
                ) : (
                  <CalendarHeart className="size-6 text-gold" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold leading-tight">{e.title}</p>
                <p className="text-sm text-gold-deep">{eventDateLabel(e)}{time ? ` · ${time}` : ""}</p>
                {e.venue_name && <p className="text-sm text-taupe">{e.venue_name}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {venue && (
        <p className="mx-auto mt-8 flex max-w-md items-start justify-center gap-2 text-taupe">
          <MapPin className="mt-0.5 size-4 shrink-0 text-gold" /> <span>{venue}</span>
        </p>
      )}
      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-3">
          {w.rsvp_enabled && (
            <Link href="/rsvp" className="btn-gold inline-flex h-12 items-center rounded-full px-8 font-medium tracking-wide text-cream">Kindly RSVP</Link>
          )}
          {maps && (
            <a href={maps} target="_blank" rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-gold/50 px-6 font-medium text-gold-deep transition hover:bg-blush/30">
              <Navigation className="size-4" /> Directions
            </a>
          )}
        </div>
        <ShareButtons text={`You're invited to ${names}'s wedding!`} url={`${env.siteUrl}/invitation`} />
      </div>
    </article>
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-beige/60 via-ivory to-ivory px-4 pb-24 pt-28 sm:pt-36">
      <Mandala className="pointer-events-none absolute left-1/2 top-40 size-[120vmin] -translate-x-1/2 opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(185,114,124,0.18),transparent_60%)]" />
      {card && (
        <Reveal className="relative mx-auto mb-14 max-w-2xl text-center lg:mb-16">
          <p className="font-script text-4xl text-rose sm:text-5xl">You are invited</p>
          <p className="mt-2 text-[0.68rem] uppercase tracking-[0.4em] text-taupe sm:text-xs">Our invitation card</p>
        </Reveal>
      )}
      <div className={cn("relative mx-auto", card ? "grid max-w-6xl items-start gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14" : "max-w-2xl")}>
        {card && (
          <Reveal className="lg:sticky lg:top-28">
            <InvitationCardPhoto src={card} names={names} />
          </Reveal>
        )}
        <Reveal delay={card ? 0.15 : 0}>{letter}</Reveal>
      </div>
    </section>
  );
}
