import { useId } from "react";
import { cn } from "@/lib/utils";

export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-champagne", className)} aria-hidden>
      <span className="gold-rule h-px w-16 sm:w-24" />
      <svg viewBox="0 0 48 24" className="h-5 w-10" fill="none" stroke="currentColor" strokeWidth="1.1">
        <path d="M24 3c-3.5 4.2-3.5 10.3 0 15 3.5-4.7 3.5-10.8 0-15Z" />
        <path d="M24 18c-5.5-.6-9.6-4.4-10.6-9.6 5.4.6 9.4 4.3 10.6 9.6Z" />
        <path d="M24 18c5.5-.6 9.6-4.4 10.6-9.6-5.4.6-9.4 4.3-10.6 9.6Z" />
        <path d="M24 18c-7 1.8-13.6.2-18-4 6.6-1 12.8.8 18 4Z" />
        <path d="M24 18c7 1.8 13.6.2 18-4-6.6-1-12.8.8-18 4Z" />
        <circle cx="24" cy="21.5" r="1" fill="currentColor" />
      </svg>
      <span className="gold-rule h-px w-16 sm:w-24" />
    </div>
  );
}

export function Mandala({ className }: { className?: string }) {
  const petals = Array.from({ length: 16 });
  const small = Array.from({ length: 24 });
  return (
    <svg viewBox="0 0 400 400" className={cn("text-champagne", className)} fill="none" stroke="currentColor" aria-hidden>
      <g strokeWidth="0.8">
        <circle cx="200" cy="200" r="190" />
        <circle cx="200" cy="200" r="178" strokeDasharray="2 6" />
        <circle cx="200" cy="200" r="120" />
        <circle cx="200" cy="200" r="60" />
        <circle cx="200" cy="200" r="22" />
        {petals.map((_, i) => (
          <path key={i} transform={`rotate(${i * 22.5} 200 200)`}
            d="M200 80c-14 18-14 40 0 58 14-18 14-40 0-58Z M200 140c-8 10-8 22 0 32 8-10 8-22 0-32Z" />
        ))}
        {small.map((_, i) => (
          <path key={`s${i}`} transform={`rotate(${i * 15} 200 200)`} d="M200 18c-6 8-6 18 0 26 6-8 6-18 0-26Z" />
        ))}
      </g>
    </svg>
  );
}

export function FloralCorner({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 160 160" className={cn("text-champagne", flip && "-scale-x-100", className)} fill="none" stroke="currentColor" aria-hidden>
      <g strokeWidth="1" strokeLinecap="round">
        <path d="M6 154C40 120 70 90 150 8" />
        <path d="M40 120c-14-2-22-12-22-24 14 2 22 12 22 24Z" />
        <path d="M64 96c-2-14 6-24 18-28 2 14-6 24-18 28Z" />
        <path d="M88 72c-14-2-22-12-22-24 14 2 22 12 22 24Z" />
        <path d="M112 48c-2-14 6-24 18-28 2 14-6 24-18 28Z" />
        <circle cx="150" cy="8" r="5" />
        <path d="M145 13c-6-1-10 2-12 7M155 3c1 6-2 10-7 12" />
        <circle cx="26" cy="132" r="3" fill="currentColor" stroke="none" opacity=".5" />
      </g>
      <g className="text-rose" stroke="currentColor" strokeWidth="1">
        <circle cx="72" cy="60" r="7" />
        <circle cx="72" cy="60" r="3" fill="currentColor" stroke="none" opacity=".6" />
        <circle cx="122" cy="74" r="5" />
      </g>
    </svg>
  );
}

export function SectionHeading({ eyebrow, title, intro, className }: { eyebrow?: string; title: string; intro?: string | null; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow && <p className="font-script text-3xl text-rose sm:text-4xl">{eyebrow}</p>}
      <h2 className="mt-1 text-4xl font-medium sm:text-5xl">{title}</h2>
      <Ornament className="mt-5" />
      {intro && <p className="mt-5 text-base leading-relaxed text-taupe sm:text-lg">{intro}</p>}
    </div>
  );
}

export function Jharokha({ className, children }: { className?: string; children?: React.ReactNode }) {
  const u = `j${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const outer = "M4 236 V92 C4 60 26 44 52 34 C70 27 88 18 100 4 C112 18 130 27 148 34 C174 44 196 60 196 92 V236";
  const inner = "M14 236 V96 C14 68 33 54 56 45 C73 38 89 30 100 18 C111 30 127 38 144 45 C167 54 186 68 186 96 V236";
  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 200 240" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`${u}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e8d3a6" /><stop offset=".5" stopColor="#a9813f" /><stop offset="1" stopColor="#d9bd84" />
          </linearGradient>
          <linearGradient id={`${u}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf9" stopOpacity=".92" /><stop offset="1" stopColor="#fbf3ea" stopOpacity=".75" />
          </linearGradient>
        </defs>
        <path d={`${outer} Z`} fill={`url(#${u}-fill)`} />
        <path d={outer} fill="none" stroke={`url(#${u}-gold)`} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        <path d={inner} fill="none" stroke="#c9a96e" strokeWidth="0.8" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity=".8" />
        <path d="M-4 236 H204" stroke={`url(#${u}-gold)`} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        <path d="M2 240 H198" stroke="#c9a96e" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg viewBox="0 0 24 34" className="absolute left-1/2 top-0 h-9 w-6 -translate-x-1/2 -translate-y-[85%] text-gold" fill="currentColor" aria-hidden>
        <circle cx="12" cy="5" r="3.2" /><path d="M12 9c-5 4-7 9-4 14h8c3-5 1-10-4-14Z" opacity=".85" /><rect x="7" y="24" width="10" height="2.2" rx="1" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}

export function PatternBand({ className }: { className?: string }) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24"><g fill="none" stroke="#c9a96e" stroke-width="1"><path d="M24 4c-3 4-3 8 0 12 3-4 3-8 0-12Z"/><path d="M24 16c-4-.4-7-3-7.6-6.8 4 .4 7 3 7.6 6.8ZM24 16c4-.4 7-3 7.6-6.8-4 .4-7 3-7.6 6.8Z"/><path d="M2 12l4-4 4 4-4 4zM38 12l4-4 4 4-4 4z"/><path d="M10 12h4M34 12h4" /></g></svg>`,
  );
  return <div aria-hidden className={cn("h-6 w-full opacity-80", className)} style={{ backgroundImage: `url("data:image/svg+xml,${svg}")`, backgroundRepeat: "repeat-x", backgroundPosition: "center" }} />;
}
