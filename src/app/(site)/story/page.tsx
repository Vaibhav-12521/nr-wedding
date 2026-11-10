import type { Metadata } from "next";
import { ComingSoon, PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { CoupleSection } from "@/components/site/couple";
import { getWedding } from "@/lib/wedding";

export const metadata: Metadata = { title: "Our Story" };

export default async function StoryPage() {
  const w = await getWedding();

  return (
    <>
      <PageHero eyebrow="Our" title="Story" intro={w.story_intro} />

      <section className="px-4 py-20">
        <CoupleSection w={w} />

        <div className="mx-auto mt-20 max-w-3xl">
          {w.story_timeline.length ? (
            <ol className="relative border-l border-champagne/50 pl-8 sm:mx-auto sm:border-l-0 sm:pl-0">
              <span aria-hidden className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-champagne to-transparent sm:block" />
              {w.story_timeline.map((item, i) => (
                <Reveal key={i} delay={0.05 * i}>
                  <li className={`relative mb-12 sm:w-1/2 ${i % 2 ? "sm:ml-auto sm:pl-12" : "sm:pr-12 sm:text-right"}`}>
                    <span aria-hidden className={`absolute top-2 -left-[2.4rem] size-3 rotate-45 border border-gold bg-cream sm:left-auto ${i % 2 ? "sm:-left-1.5" : "sm:-right-1.5"}`} />
                    {item.date && <p className="text-xs uppercase tracking-[0.3em] text-gold">{item.date}</p>}
                    <h3 className="mt-1 text-2xl font-medium">{item.title}</h3>
                    {item.text && <p className="mt-2 whitespace-pre-line leading-relaxed text-taupe">{item.text}</p>}
                  </li>
                </Reveal>
              ))}
            </ol>
          ) : (
            <div className="mt-4"><ComingSoon what="The rest of our story" /></div>
          )}
        </div>
      </section>
    </>
  );
}
