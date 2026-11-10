import { cn } from "@/lib/utils";

const COLOURS = ["#e7798a", "#f2a3ae", "#d94f68", "#f6c343", "#ff9a3c", "#f2a3ae"];

export function AmbientPetals({ count = 14, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden", className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
        const size = 9 + r(1) * 9;
        return (
          <span key={i} className="absolute -top-8 animate-[petal-fall_linear_infinite] rounded-[60%_10%_60%_10%] opacity-70"
            style={{
              left: `${r(2) * 100}%`, width: size, height: size * 0.7, background: COLOURS[i % COLOURS.length],
              animationDuration: `${14 + r(3) * 12}s`, animationDelay: `-${r(4) * 20}s`,
            }} />
        );
      })}
    </div>
  );
}
