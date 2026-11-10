import { FloralCorner, Mandala, Ornament } from "@/components/decor";

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string | null }) {
  return (
    <section className="paper relative overflow-hidden border-b border-champagne/25 px-4 pb-16 pt-32 text-center sm:pb-20 sm:pt-40">
      <Mandala className="pointer-events-none absolute left-1/2 top-1/2 size-[90vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]" />
      <FloralCorner className="pointer-events-none absolute -left-6 bottom-0 size-20 opacity-40 sm:size-48 sm:opacity-50" />
      <FloralCorner flip className="pointer-events-none absolute -right-6 bottom-0 size-20 opacity-40 sm:size-48 sm:opacity-50" />
      <div className="relative">
        <p className="font-script text-4xl text-rose sm:text-5xl">{eyebrow}</p>
        <h1 className="mt-1 text-5xl font-medium sm:text-6xl">{title}</h1>
        <Ornament className="mt-6" />
        {intro && <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-taupe">{intro}</p>}
      </div>
    </section>
  );
}

export function ComingSoon({ what }: { what: string }) {
  return (
    <div className="card-frame paper mx-auto max-w-xl p-10 text-center">
      <p className="font-display text-2xl">{what} will be shared soon</p>
      <p className="mt-2 text-taupe">Please check back closer to the celebrations.</p>
    </div>
  );
}
