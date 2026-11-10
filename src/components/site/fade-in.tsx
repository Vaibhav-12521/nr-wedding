import { cn } from "@/lib/utils";

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={cn("animate-[fade-up_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none", className)}
      style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
