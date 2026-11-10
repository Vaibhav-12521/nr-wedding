"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

export function Countdown({ target, className }: { target: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const end = new Date(target).getTime();
  if (now === null) return <div className={className} style={{ minHeight: 92 }} aria-hidden />;
  if (now >= end) {
    return <p className={`font-script text-4xl text-gold-deep ${className ?? ""}`}>Just married - thank you for celebrating with us</p>;
  }
  const p = parts(end - now);
  const cells: [number, string][] = [[p.days, "Days"], [p.hours, "Hours"], [p.minutes, "Minutes"], [p.seconds, "Seconds"]];
  return (
    <div className={className} role="timer" aria-label={`${p.days} days, ${p.hours} hours and ${p.minutes} minutes to go`}>
      <div className="flex justify-center gap-2 sm:gap-4">
        {cells.map(([n, label]) => (
          <div key={label} className="w-[4.5rem] rounded-2xl border border-champagne/50 bg-cream/70 px-2 py-3 text-center shadow-sm backdrop-blur sm:w-24">
            <div className="font-display text-3xl font-semibold tabular-nums text-cocoa sm:text-4xl">{String(n).padStart(2, "0")}</div>
            <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-taupe">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
