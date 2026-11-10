import { CalendarDays, CalendarPlus, Clock, MapPin, Navigation, Shirt } from "lucide-react";
import { directionsUrl, eventDateLabel, eventDayParts, formatTime } from "@/lib/format";
import { siteImageUrl } from "@/lib/wedding";
import type { WeddingEvent } from "@/lib/types";
import { FloralCorner, Mandala } from "@/components/decor";

function googleCalendarUrl(e: WeddingEvent) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = e.ends_at ?? new Date(new Date(e.starts_at!).getTime() + 3 * 3600_000).toISOString();
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${e.title} · Neha's Wedding`,
    dates: `${fmt(e.starts_at!)}/${fmt(end)}`,
    location: [e.venue_name, e.address].filter(Boolean).join(", "),
    details: e.description ?? "",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function EventCard({ event, index, compact }: { event: WeddingEvent; index: number; compact?: boolean }) {
  const img = siteImageUrl(event.image_path);
  const start = formatTime(event.starts_at);
  const end = formatTime(event.ends_at);
  const maps = directionsUrl(event.maps_url, event.address, event.venue_name);
  const gcal = event.starts_at ? googleCalendarUrl(event) : null;
  const day = eventDayParts(event);
  return (
    <article className="card-frame paper group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-gradient-to-br from-blush/70 via-cream to-beige">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" loading="lazy" className="h-full w-full object-cover transition duration-1000 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FloralCorner className="absolute -left-4 -top-4 size-32 opacity-50" />
            <FloralCorner flip className="absolute -bottom-4 -right-4 size-32 rotate-180 opacity-50" />
            <Mandala className="absolute left-1/2 top-1/2 size-[85%] -translate-x-1/2 -translate-y-1/2 opacity-25" />
            <span className="relative font-display text-2xl italic text-gold-deep/80">{event.title}</span>
          </div>
        )}
        {day && (
          <div className="absolute left-5 top-5 rounded-2xl border border-champagne/70 bg-cream/95 px-4 py-2.5 text-center shadow-lg backdrop-blur">
            <p className="font-display text-4xl font-semibold leading-none text-gold-deep">{day.day}</p>
            <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-cocoa">{day.month} {day.year}</p>
          </div>
        )}
      </div>
      <div className="relative z-10 flex flex-1 flex-col p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Event {index + 1}</p>
        <h3 className="mt-2 text-3xl font-medium">{event.title}</h3>
        <ul className="mt-5 space-y-2.5 text-[0.95rem] text-cocoa/85">
          <li className="flex gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-gold" />{eventDateLabel(event)}</li>
          <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-gold" />
            {start ? (end ? `${start} – ${end}` : start) : "Time to be announced"}</li>
          <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
            <span>{event.venue_name || "Venue to be announced"}{event.address && <span className="block text-taupe">{event.address}</span>}</span></li>
          {event.dress_code && <li className="flex gap-3"><Shirt className="mt-0.5 size-4 shrink-0 text-gold" />{event.dress_code}</li>}
        </ul>
        {!compact && event.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-taupe">{event.description}</p>}
        {(maps || gcal) && (
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {maps && (
              <a href={maps} target="_blank" rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-cream">
                <Navigation className="size-4" /> Directions
              </a>
            )}
            {gcal && (
              <>
                <a href={gcal} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2.5 text-sm font-medium text-gold-deep transition hover:bg-blush/30">
                  <CalendarPlus className="size-4" /> Google Calendar
                </a>
                <a href={`/api/events/${event.id}/ics`}
                  className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2.5 text-sm font-medium text-gold-deep transition hover:bg-blush/30">
                  <CalendarPlus className="size-4" /> Apple / Outlook
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
