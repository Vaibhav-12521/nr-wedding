import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { EventCard } from "@/components/site/event-card";
import { getEvents } from "@/lib/wedding";

export const metadata: Metadata = { title: "Wedding Events" };

export default async function EventsPage() {
  const events = await getEvents();
  return (
    <>
      <PageHero eyebrow="Celebrations" title="Wedding Events" intro="Every ceremony, every celebration - here is where and when to find us." />
      <section className="px-4 py-20">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {events.map((e, i) => (
            <Reveal key={e.id} delay={(i % 2) * 0.12}><EventCard event={e} index={i} /></Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
