import { useId } from "react";
import { cn } from "@/lib/utils";

const petal = "M0 0C-8-5-9-20-4-27C-2-25 0-29 2-27C4-29 6-25 7-26C11-19 9-5 0 0Z";

function ring(n: number, r: number, scale: number, fill: string, twist: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 360 + twist;
    return <path key={i} d={petal} fill={fill} stroke="#7a2400" strokeOpacity=".28" strokeWidth=".7" transform={`rotate(${a}) translate(0 ${-r * 0.25}) scale(${scale})`} />;
  });
}

function MarigoldSymbol({ id, light, outer, mid, inner, core }: { id: string; light: string; outer: string; mid: string; inner: string; core: string }) {
  return (
    <symbol id={id} viewBox="-34 -34 68 68" overflow="visible">
      <g>{ring(18, 22, 1, `url(#${id}-o)`, 0)}</g>
      <g>{ring(14, 12, 0.78, `url(#${id}-m)`, 9)}</g>
      <g>{ring(10, 4, 0.55, `url(#${id}-i)`, 4)}</g>
      <circle r="4.5" fill={core} />
      <circle r="31" fill={`url(#${light})`} />
      <defs>
        <radialGradient id={`${id}-o`} cx="0" cy="0" r="30" gradientUnits="userSpaceOnUse"><stop offset=".25" stopColor={mid} /><stop offset="1" stopColor={outer} /></radialGradient>
        <radialGradient id={`${id}-m`} cx="0" cy="0" r="22" gradientUnits="userSpaceOnUse"><stop offset=".2" stopColor={inner} /><stop offset="1" stopColor={mid} /></radialGradient>
        <radialGradient id={`${id}-i`} cx="0" cy="0" r="14" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={core} /><stop offset="1" stopColor={inner} /></radialGradient>
      </defs>
    </symbol>
  );
}

export function Toran({ className }: { className?: string; count?: number }) {
  const p = `t${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const id = (name: string) => `${p}-${name}`;
  const W = 1600, step = 42;
  const flowers = Array.from({ length: Math.ceil(W / step) + 1 }, (_, i) => i * step + 10);
  return (
    <div className={cn("pointer-events-none h-[118px] overflow-hidden", className)} aria-hidden>
      <svg viewBox={`0 0 ${W} 118`} preserveAspectRatio="xMidYMin slice" className="h-full w-full">
        <defs>
          <radialGradient id={id("light")} cx="-.25" cy="-.35" r="1.1">
            <stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset=".45" stopColor="#fff" stopOpacity="0" />
            <stop offset=".75" stopColor="#5a1a00" stopOpacity="0" /><stop offset="1" stopColor="#5a1a00" stopOpacity=".35" />
          </radialGradient>
          <linearGradient id={id("leaf")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2f6b2a" /><stop offset=".5" stopColor="#5a9a3f" /><stop offset="1" stopColor="#2a5a24" /></linearGradient>
          <MarigoldSymbol id={id("orange")} light={id("light")} outer="#c2410c" mid="#f26b1d" inner="#ff9a3c" core="#8a2a05" />
          <MarigoldSymbol id={id("yellow")} light={id("light")} outer="#d18a00" mid="#f6b40e" inner="#ffd54a" core="#9a5a00" />
          <filter id={id("shadow")} x="-5%" y="-20%" width="110%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#3a1405" floodOpacity=".35" /></filter>
        </defs>

        <path d={`M0 14H${W}`} stroke="#7a4a1a" strokeWidth="7" />
        <path d={`M0 14H${W}`} stroke="#c69350" strokeWidth="7" strokeDasharray="3 5" opacity=".75" />

        <g filter={`url(#${id("shadow")})`}>
          {flowers.filter((_, i) => i % 3 === 1).map((x, i) => (
            <g key={`s${x}`} className="toran-sway" style={{ animationDelay: `${-(i % 5) * 0.7}s` }}>
              <path d={`M${x} 22V70`} stroke="#6b4a1e" strokeWidth="1.2" />
              <path d={`M${x} 40c-9 7-11 19-1 30c1 2 1 2 2 0c10-11 8-23-1-30Z`} fill={`url(#${id("leaf")})`} />
              <path d={`M${x} 42v26`} stroke="#bfe0a0" strokeWidth=".8" opacity=".7" />
              <use href={`#${id(i % 2 ? "yellow" : "orange")}`} x={x - 11} y={70} width="22" height="22" />
              <use href={`#${id(i % 2 ? "orange" : "yellow")}`} x={x - 9} y={88} width="18" height="18" />
            </g>
          ))}
          {flowers.map((x, i) => (
            <use key={x} href={`#${id(i % 2 ? "yellow" : "orange")}`} x={x - 19} y={2 + (i % 3) * 1.5} width="38" height="38" />
          ))}
        </g>
      </svg>
    </div>
  );
}
