"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Images, LogIn } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Seal } from "@/components/site/seal";

const MAIN = [
  { href: "/story", label: "Our Story" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/invitation", label: "Invitation" },
  { href: "/rsvp", label: "RSVP" },
];
const MORE = [
  { href: "/wishes", label: "Blessings" },
  { href: "/family", label: "Family" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ monogram, initials }: { monogram: string; initials: [string, string?] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { setSignedIn(/(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie)); }, []);
  const home = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const solid = scrolled || !home;
  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-40 transition-all duration-500",
      solid ? "border-b border-champagne/25 bg-ivory/85 backdrop-blur-md" : "bg-transparent",
    )}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-wide text-cocoa" aria-label="Neha's Wedding - home">
          <Seal initials={initials} className="size-9 drop-shadow-[0_2px_4px_rgba(90,40,30,0.3)]" />
          <span className="text-gold-gradient">{monogram}</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {[...MAIN, ...MORE].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn(
                  "rounded-full px-3 py-2 text-[0.82rem] font-medium tracking-wide text-cocoa/80 transition hover:text-gold",
                  pathname === l.href && "text-gold",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href={signedIn ? "/photos" : "/login"}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-gold/40 bg-cream/70 px-4 text-sm font-medium text-gold-deep transition hover:border-gold hover:bg-cream"
          >
            {signedIn ? <Images className="size-4" /> : <LogIn className="size-4" />}
            {signedIn ? "Photos" : "Sign in"}
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex size-10 items-center justify-center rounded-full text-cocoa md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[82vw] max-w-sm bg-ivory paper">
              <SheetTitle className="px-6 pt-6 font-display text-3xl">
                <span className="text-gold-gradient">{monogram}</span>
              </SheetTitle>
              <ul className="mt-6 space-y-1 px-4">
                {[{ href: "/", label: "Home" }, ...MAIN, ...MORE].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "block rounded-xl px-3 py-3 font-display text-2xl text-cocoa transition hover:bg-blush/40",
                        pathname === l.href && "bg-blush/40 text-gold-deep",
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
