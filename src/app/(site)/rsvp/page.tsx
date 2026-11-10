import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { RsvpForm } from "./rsvp-form";
import { getEvents, getWedding } from "@/lib/wedding";
import { formatDate } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "RSVP" };

export default async function RsvpPage() {
  const [w, events] = await Promise.all([getWedding(), getEvents()]);
  const closed = !w.rsvp_enabled || (w.rsvp_deadline && new Date(`${w.rsvp_deadline}T23:59:59+05:30`) < new Date());
  return (
    <>
      <PageHero eyebrow="Kindly" title="RSVP"
        intro={w.rsvp_deadline ? `Please let us know by ${formatDate(w.rsvp_deadline)}.` : "Please let us know if you can join us."} />
      <section className="mx-auto max-w-2xl px-4 py-16">
        {!isSupabaseConfigured ? (
          <div className="card-frame paper p-10 text-center">
            <p className="font-display text-2xl">RSVPs open soon</p>
            <p className="mt-2 text-taupe">Please check back shortly.</p>
          </div>
        ) : closed ? (
          <div className="card-frame paper p-10 text-center">
            <p className="font-display text-2xl">RSVPs are closed</p>
            <p className="mt-2 text-taupe">Please contact the family directly.</p>
          </div>
        ) : (
          <RsvpForm events={events.filter((e) => !e.id.startsWith("default-")).map((e) => ({ id: e.id, title: e.title }))} />
        )}
      </section>
    </>
  );
}
