import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ComingSoon, PageHero } from "@/components/site/page-hero";
import { getWedding } from "@/lib/wedding";
import { directionsUrl } from "@/lib/format";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const w = await getWedding();
  const maps = directionsUrl(w.maps_url, [w.venue_address, w.location].filter(Boolean).join(", ") || null, w.venue_name);
  return (
    <>
      <PageHero eyebrow="Get in" title="Touch" intro="For travel, stay or anything else, the family is happy to help." />
      <section className="mx-auto max-w-5xl px-4 py-20">
        {w.contacts.length ? (
          <ul className="grid gap-6 sm:grid-cols-2">
            {w.contacts.map((c, i) => (
              <li key={i} className="card-frame paper p-8">
                <p className="font-display text-2xl">{c.name}</p>
                {c.role && <p className="text-sm uppercase tracking-[0.2em] text-gold">{c.role}</p>}
                <div className="relative z-10 mt-4 space-y-2">
                  {c.phone && (
                    <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-cocoa hover:text-gold-deep">
                      <Phone className="size-4 text-gold" /> {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-3 break-all text-cocoa hover:text-gold-deep">
                      <Mail className="size-4 text-gold" /> {c.email}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ComingSoon what="Contact details" />
        )}

        {(w.venue_name || w.venue_address) && (
          <div className="card-frame paper mt-10 flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center">
            <MapPin className="size-6 shrink-0 text-gold" />
            <div className="flex-1">
              <p className="font-display text-2xl">{w.venue_name}</p>
              <p className="text-taupe">{[w.venue_address, w.location].filter(Boolean).join(", ")}</p>
            </div>
            {maps && (
              <a href={maps} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex h-11 items-center rounded-full bg-gold px-6 font-medium text-cream hover:bg-gold-deep">
                Get directions
              </a>
            )}
          </div>
        )}
      </section>
    </>
  );
}
