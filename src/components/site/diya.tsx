import { useId } from "react";
import { cn } from "@/lib/utils";

export function Diya({ className, delay = 0 }: { className?: string; delay?: number }) {
  const u = `d${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 120 120" className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <radialGradient id={`${u}-glow`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffcf6b" stopOpacity=".55" /><stop offset="1" stopColor="#ffcf6b" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${u}-clay`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d98a4a" /><stop offset=".5" stopColor="#a8541f" /><stop offset="1" stopColor="#5e2a0c" /></linearGradient>
        <linearGradient id={`${u}-rim`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7a3a12" /><stop offset=".45" stopColor="#f0b070" /><stop offset="1" stopColor="#6a2e0c" /></linearGradient>
        <radialGradient id={`${u}-flame`} cx=".5" cy=".75" r=".75"><stop offset="0" stopColor="#fffbe6" /><stop offset=".35" stopColor="#ffd75e" /><stop offset=".75" stopColor="#ff8a1e" /><stop offset="1" stopColor="#ff5a0a" stopOpacity="0" /></radialGradient>
        <filter id={`${u}-soft`}><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>
      <circle cx="60" cy="58" r="56" fill={`url(#${u}-glow)`} className="diya-glow" style={{ animationDelay: `${delay}s` }} />
      <path d="M14 78c6 22 26 30 46 30s40-8 46-30c-10 6-30 9-46 9s-36-3-46-9Z" fill={`url(#${u}-clay)`} />
      <path d="M14 78c10 6 30 9 46 9s36-3 46-9c4-2 10-6 10-9-6 3-14 3-14 3-12 4-26 5-42 5s-30-1-42-5c0 0-8 0-14-3 0 3 6 7 10 9Z" fill={`url(#${u}-rim)`} />
      <ellipse cx="60" cy="78" rx="40" ry="5" fill="#3a1606" opacity=".55" />
      <path d="M92 74c8-1 14-4 18-8-2 6-8 10-16 11Z" fill="#c06a2c" />
      <path d="M100 70l3-6" stroke="#2a1406" strokeWidth="2" strokeLinecap="round" />
      <g className="diya-flame" style={{ animationDelay: `${delay}s`, transformOrigin: "103px 66px" }}>
        <path d="M103 66c-9-8-6-20 0-32 6 12 9 24 0 32Z" fill={`url(#${u}-flame)`} filter={`url(#${u}-soft)`} />
        <path d="M103 64c-4-4-3-10 0-16 3 6 4 12 0 16Z" fill="#fffdf0" opacity=".9" />
      </g>
    </svg>
  );
}

export function Bokeh({ className }: { className?: string }) {
  const lights = Array.from({ length: 16 }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * 91.7 + n * 47.3) * 9301.5) % 1 + 1) % 1;
    return { x: r(1) * 100, y: r(2) * 70, s: 70 + r(3) * 150, c: ["255,206,120", "255,170,150", "255,226,170", "246,160,120"][i % 4], o: 0.18 + r(4) * 0.25, d: r(5) * 12 };
  });
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {lights.map((l, i) => (
        <span key={i} className="bokeh absolute rounded-full"
          style={{
            left: `${l.x}%`, top: `${l.y}%`, width: l.s, height: l.s, opacity: l.o, animationDelay: `-${l.d}s`,
            background: `radial-gradient(circle, rgba(${l.c},0.95) 0%, rgba(${l.c},0.55) 38%, rgba(${l.c},0) 70%)`,
          }} />
      ))}
    </div>
  );
}
