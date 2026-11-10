import { useId } from "react";
import { cn } from "@/lib/utils";

export function Seal({ initials, className, still }: { initials: [string, string?]; className?: string; still?: boolean }) {
  const u = `s${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const id = (n: string) => `${u}-${n}`;
  const scallops = Array.from({ length: 28 }, (_, i) => (i * 360) / 28);
  const petals = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  const [a, b] = initials;
  return (
    <svg viewBox="0 0 200 200" className={cn("drop-shadow-[0_10px_22px_rgba(60,10,20,0.45)]", className)} role="img" aria-label={b ? `${a} and ${b}` : a}>
      <defs>
        <linearGradient id={id("gold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbeec2" /><stop offset=".3" stopColor="#d9b263" />
          <stop offset=".55" stopColor="#9c7128" /><stop offset=".8" stopColor="#e6c27a" /><stop offset="1" stopColor="#b8893a" />
        </linearGradient>
        <radialGradient id={id("enamel")} cx=".38" cy=".32" r=".8">
          <stop offset="0" stopColor="#b23a4c" /><stop offset=".6" stopColor="#7a1a2a" /><stop offset="1" stopColor="#4a0c18" />
        </radialGradient>
        <linearGradient id={id("sheen")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={id("emboss")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="3" specularConstant=".9" specularExponent="22" lightingColor="#fff7dc" result="spec">
            <fePointLight x="40" y="20" z="140" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3=".8" k4="0" />
        </filter>
        <clipPath id={id("disc")}><circle cx="100" cy="100" r="96" /></clipPath>
      </defs>

      <g filter={`url(#${id("emboss")})`}>
        {scallops.map((r) => <circle key={r} cx="100" cy="12" r="9" fill={`url(#${id("gold")})`} transform={`rotate(${r} 100 100)`} />)}
        <circle cx="100" cy="100" r="86" fill={`url(#${id("gold")})`} />
        {petals.map((r) => <path key={r} d="M100 22c-6 7-6 15 0 22 6-7 6-15 0-22Z" fill="#a67a2c" transform={`rotate(${r} 100 100)`} />)}
        <circle cx="100" cy="100" r="58" fill={`url(#${id("gold")})`} />
      </g>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#6e4f17" strokeWidth=".8" strokeDasharray="1.5 3" opacity=".7" />
      <circle cx="100" cy="100" r="52" fill={`url(#${id("enamel")})`} />
      <circle cx="100" cy="100" r="52" fill="none" stroke="#3a0a12" strokeWidth="1.2" opacity=".6" />
      <ellipse cx="88" cy="78" rx="30" ry="16" fill="#fff" opacity=".1" transform="rotate(-25 88 78)" />
      <circle cx="100" cy="100" r="46" fill="none" stroke="#e7c97f" strokeWidth=".8" strokeDasharray="2 3" opacity=".75" />

      <text x="100" y={b ? 108 : 114} textAnchor="middle" fill={`url(#${id("gold")})`} fontFamily="var(--font-display), serif"
        fontSize={b ? 34 : 46} fontWeight="600" letterSpacing="1" style={{ paintOrder: "stroke" }} stroke="#3a0a12" strokeWidth=".6">
        {a}
        {b && <tspan fontFamily="var(--font-script-face), cursive" fontSize="26" dx="4" dy="-2">&amp;</tspan>}
        {b && <tspan dx="4" dy="2">{b}</tspan>}
      </text>
      <g transform="translate(100 128)" fill="none" stroke="#e7c97f" strokeWidth="1.1">
        <path d="M0-7c-3 3.5-3 7 0 10 3-3 3-6.5 0-10Z" /><path d="M0 3c-4-.5-7-3-7.5-7 4 .5 7 3 7.5 7Z" /><path d="M0 3c4-.5 7-3 7.5-7-4 .5-7 3-7.5 7Z" />
      </g>

      {!still && (
        <g clipPath={`url(#${id("disc")})`} style={{ mixBlendMode: "soft-light" }}>
          <rect x="-120" y="-20" width="80" height="240" fill={`url(#${id("sheen")})`} transform="rotate(20 100 100)">
            <animate attributeName="x" values="-120;260;260" keyTimes="0;.45;1" dur="6s" repeatCount="indefinite" />
          </rect>
        </g>
      )}
    </svg>
  );
}
