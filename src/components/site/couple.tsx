import { Seal } from "@/components/site/seal";
import { Reveal } from "@/components/site/reveal";
import { siteImageUrl } from "@/lib/wedding";
import type { WeddingDetails } from "@/lib/types";

function Portrait({ src, name, label, intro, delay }: { src: string | null; name: string; label: string; intro: string | null; delay: number }) {
  return (
    <Reveal delay={delay} className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="absolute -inset-3 rounded-t-full border border-champagne/60" aria-hidden />
        <div className="relative rounded-t-full bg-[linear-gradient(160deg,#f6e2a8,#b88a3a_35%,#f0d58f_60%,#8f6524)] p-[6px] shadow-[0_2px_2px_rgba(90,60,30,0.1),0_14px_28px_-8px_rgba(90,60,30,0.3),0_40px_70px_-30px_rgba(90,40,30,0.5)]">
        <div className="relative h-80 w-60 overflow-hidden rounded-t-full bg-gradient-to-b from-blush via-cream to-beige shadow-[inset_0_0_0_2px_rgba(255,250,240,0.85),inset_0_10px_30px_rgba(60,30,10,0.25)] sm:h-96 sm:w-72">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`${name}, the ${label.toLowerCase()}`} className="h-full w-full object-cover transition duration-1000 hover:scale-105" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-script text-8xl text-rose/80">{name[0]}</span>
          )}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_38%)]" />
        </div>
        </div>
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.35em] text-gold">{label}</p>
      <h3 className="mt-1 font-script text-6xl font-normal text-rose">{name}</h3>
      {intro && <p className="mt-3 max-w-sm whitespace-pre-line leading-relaxed text-taupe">{intro}</p>}
    </Reveal>
  );
}

export function CoupleSection({ w }: { w: WeddingDetails }) {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1fr_auto_1fr]">
      <Portrait src={siteImageUrl(w.bride_photo_path)} name={w.bride_name} label="The Bride" intro={w.bride_intro} delay={0} />
      <Reveal delay={0.2} className="flex justify-center">
        <Seal initials={[w.bride_name[0], w.groom_name?.[0]]} className="size-28 drop-shadow-[0_6px_10px_rgba(90,40,30,0.25)] md:size-32" />
      </Reveal>
      {w.groom_name && (
        <Portrait src={siteImageUrl(w.groom_photo_path)} name={w.groom_name} label="The Groom" intro={w.groom_intro} delay={0.3} />
      )}
    </div>
  );
}
