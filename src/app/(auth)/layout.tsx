import Link from "next/link";
import { FloralCorner, Mandala, Ornament } from "@/components/decor";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="paper relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-16">
      <Mandala className="pointer-events-none absolute left-1/2 top-1/2 size-[120vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]" />
      <FloralCorner className="pointer-events-none absolute left-0 top-0 size-48 opacity-60" />
      <FloralCorner flip className="pointer-events-none absolute bottom-0 right-0 size-48 rotate-180 opacity-60" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="block text-center">
          <p className="font-script text-5xl text-rose">Neha&apos;s Wedding</p>
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-taupe">Family photo album</p>
        </Link>
        <Ornament className="my-6" />
        <div className="card-frame bg-cream p-6 sm:p-8">
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    </main>
  );
}
