import type { Metadata } from "next";
import Link from "next/link";
import { CalendarHeart, ChevronDown, MapPin, Navigation } from "lucide-react";
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

  // Everything a guest needs - names, dates, venue, RSVP - is kept compact so it fits the first screen.
  const letter = (
    <article className="card-frame paper relative mx-auto w-full max-w-2xl overflow-hidden px-5 py-9 text-center sm:px-10 sm:py-10">
      <FloralCorner className="pointer-events-none absolute -left-3 -top-3 size-20 sm:size-28" />
      <FloralCorner flip className="pointer-events-none absolute -right-3 -top-3 size-20 sm:size-28" />
      <FloralCorner className="pointer-events-none absolute -bottom-3 -left-3 size-20 -scale-y-100 sm:size-28" />
      <FloralCorner flip className="pointer-events-none absolute -bottom-3 -right-3 size-20 -scale-y-100 sm:size-28" />

      <p className="font-script text-3xl text-rose sm:text-4xl">You are invited</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cocoa/75 sm:text-[0.95rem]">
        {w.invitation_message || "With the blessings of our elders, we request the pleasure of your company at the wedding celebrations of"}
      </p>
      <h1 className="mt-3 font-script text-5xl font-normal leading-tight text-rose sm:text-6xl">{names}</h1>
      <Ornament className="my-3" />
      <p className="font-display text-base italic text-cocoa/80 sm:text-lg">{w.tagline}</p>

      <ol className={cn("mx-auto mt-6 grid max-w-xl gap-3 text-left", events.length > 1 && "sm:grid-cols-2")}>
        {events.map((e) => {
          const d = eventDayParts(e);
          const time = formatTime(e.starts_at);
          return (
            <li key={e.id} className="flex items-center gap-3 rounded-xl border border-champagne/50 bg-cream/70 p-3">
              <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg border border-champagne/60 bg-cream text-center shadow-[0_8px_20px_-14px_rgba(138,106,49,0.8)]">
                {d ? (
                  <>
                    <span className="font-display text-2xl font-semibold leading-none text-gold-deep">{d.day}</span>
                    <span className="mt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-cocoa">{d.month}</span>
                  </>
                ) : (
                  <CalendarHeart className="size-6 text-gold" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold leading-tight">{e.title}</p>
                <p className="text-xs text-gold-deep sm:text-sm">{eventDateLabel(e)}{time ? ` · ${time}` : ""}</p>
                {e.venue_name && <p className="truncate text-xs text-taupe sm:text-sm">{e.venue_name}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {venue && (
        <p className="mx-auto mt-4 flex max-w-md items-start justify-center gap-2 text-sm text-taupe">
          <MapPin className="mt-0.5 size-4 shrink-0 text-gold" /> <span>{venue}</span>
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {w.rsvp_enabled && (
          <Link href="/rsvp" className="btn-gold inline-flex h-11 items-center rounded-full px-7 font-medium tracking-wide text-cream">Kindly RSVP</Link>
        )}
        {maps && (
          <a href={maps} target="_blank" rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-gold/50 px-5 font-medium text-gold-deep transition hover:bg-blush/30">
            <Navigation className="size-4" /> Directions
          </a>
        )}
        {card && (
          <a href="#card" className="inline-flex h-11 items-center gap-1.5 rounded-full border border-gold/50 px-5 font-medium text-gold-deep transition hover:bg-blush/30 lg:hidden">
            See our card <ChevronDown className="size-4" />
          </a>
        )}
      </div>
      <div className="mt-5 flex justify-center">
        <ShareButtons text={`You're invited to ${names}'s wedding!`} url={`${env.siteUrl}/invitation`} />
      </div>
    </article>
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-beige/60 via-ivory to-ivory px-4 pb-20 pt-20 sm:pt-24 lg:flex lg:min-h-svh lg:items-center lg:pb-10">
      <Mandala className="pointer-events-none absolute left-1/2 top-40 size-[120vmin] -translate-x-1/2 opacity-[0.06]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_50%_0%,rgba(185,114,124,0.18),transparent_60%)]" />
      <div className={cn("relative mx-auto w-full", card ? "grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12" : "max-w-2xl")}>
        {/* On phones the details come first; on wide screens the card sits beside them. */}
        <Reveal className="lg:order-2">{letter}</Reveal>
        {card && (
          <Reveal delay={0.15} className="scroll-mt-20 lg:order-1">
            <div id="card" className="scroll-mt-20">
              <InvitationCardPhoto src={card} names={names} fitScreen />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
