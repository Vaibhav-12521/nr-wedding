import type { Metadata } from "next";
import { ComingSoon, PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { getWedding } from "@/lib/wedding";
import type { FamilyMember } from "@/lib/types";

export const metadata: Metadata = { title: "Family & Relatives" };

function Side({ title, members }: { title: string; members: FamilyMember[] }) {
  return (
    <div className="card-frame paper p-8 sm:p-10">
      <h2 className="text-center font-script text-5xl font-normal text-rose">{title}</h2>
      <ul className="mt-8 divide-y divide-champagne/30">
        {members.map((m, i) => (
          <li key={i} className="py-4 text-center">
            <p className="font-display text-2xl">{m.name}</p>
            {m.relation && <p className="text-sm uppercase tracking-[0.2em] text-gold">{m.relation}</p>}
            {m.note && <p className="mt-1 text-taupe">{m.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function FamilyPage() {
  const w = await getWedding();
  const bride = w.families.filter((m) => m.side === "bride");
  const groom = w.families.filter((m) => m.side === "groom");
  return (
    <>
      <PageHero eyebrow="Our" title="Families" intro="Two families, one celebration. Meet the people who made this day possible." />
      <section className="px-4 py-20">
        {w.families.length ? (
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            {bride.length > 0 && <Reveal><Side title={`${w.bride_name}'s Family`} members={bride} /></Reveal>}
            {groom.length > 0 && <Reveal delay={0.15}><Side title={w.groom_name ? `${w.groom_name}'s Family` : "The Groom's Family"} members={groom} /></Reveal>}
          </div>
        ) : (
          <ComingSoon what="Family introductions" />
        )}
      </section>
    </>
  );
}
