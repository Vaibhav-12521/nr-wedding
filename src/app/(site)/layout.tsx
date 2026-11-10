import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { Mandala, Ornament } from "@/components/decor";
import { Seal } from "@/components/site/seal";
import { Toran } from "@/components/site/toran";
import { coupleNames, getWedding } from "@/lib/wedding";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const wedding = await getWedding();
  const monogram = wedding.groom_name ? `${wedding.bride_name[0]} & ${wedding.groom_name[0]}` : wedding.bride_name;
  const when = formatDate(wedding.wedding_date);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cream focus:px-4 focus:py-2">
        Skip to content
      </a>
      <SiteHeader monogram={monogram} initials={[wedding.bride_name[0], wedding.groom_name?.[0]]} />
      <main id="main">{children}</main>
      <footer className="relative overflow-hidden bg-[linear-gradient(180deg,#5a1220,#3a0b14)] text-[#f1d899]">
        <Toran className="absolute inset-x-0 top-0" count={40} />
        <Mandala className="pointer-events-none absolute left-1/2 top-1/2 size-[70rem] -translate-x-1/2 -translate-y-1/2 text-[#e2c27c] opacity-[0.06]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-28 text-center">
          <Seal initials={[wedding.bride_name[0], wedding.groom_name?.[0]]} className="mx-auto size-24 drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]" />
          <p className="mt-5 font-script text-5xl text-[#f6e2a8]">{coupleNames(wedding)}</p>
          <p className="mt-2 font-display text-lg italic text-[#f1d899]/85">{wedding.tagline}</p>
          {when && <p className="mt-2 text-sm uppercase tracking-[0.3em] text-[#e2c27c]">{when}</p>}
          <Ornament className="my-8 text-[#e2c27c]" />
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#f1d899]/80" aria-label="Footer">
            {[
              ["/story", "Our Story"], ["/events", "Events"], ["/gallery", "Gallery"], ["/invitation", "Invitation"],
              ["/family", "Family"], ["/wishes", "Blessings"], ["/rsvp", "RSVP"], ["/faq", "FAQ"], ["/contact", "Contact"], ["/privacy", "Privacy"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-[#f6e2a8]">{label}</Link>
            ))}
          </nav>
          <p className="mt-8 text-xs text-[#f1d899]/65">
            Family photos are private and shared only with invited guests.{" "}
            <Link href="/photos" className="underline underline-offset-4 hover:text-[#f6e2a8]">Open the photo album</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
