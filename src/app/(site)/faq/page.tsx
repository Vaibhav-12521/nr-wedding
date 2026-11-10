import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { ComingSoon, PageHero } from "@/components/site/page-hero";
import { getWedding } from "@/lib/wedding";

export const metadata: Metadata = { title: "FAQ" };

export default async function FaqPage() {
  const w = await getWedding();
  return (
    <>
      <PageHero eyebrow="Good to know" title="Questions & Answers" />
      <section className="mx-auto max-w-3xl px-4 py-20">
        {w.faqs.length ? (
          <div className="space-y-3">
            {w.faqs.map((f, i) => (
              <details key={i} className="group card-frame paper px-6 py-1 [&_summary::-webkit-details-marker]:hidden">
                <summary className="relative z-10 flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl">
                  {f.question}
                  <ChevronDown className="size-5 shrink-0 text-gold transition group-open:rotate-180" />
                </summary>
                <p className="relative z-10 whitespace-pre-line pb-5 leading-relaxed text-taupe">{f.answer}</p>
              </details>
            ))}
          </div>
        ) : (
          <ComingSoon what="Frequently asked questions" />
        )}
      </section>
    </>
  );
}
