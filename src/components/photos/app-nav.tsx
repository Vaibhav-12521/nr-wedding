"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, FolderHeart, Images, ImagePlus, LayoutDashboard, UserRound } from "lucide-react";
import { useSelection } from "@/components/photos/selection-context";
import { cn } from "@/lib/utils";

export function AppNav({ isAdmin, name }: { isAdmin: boolean; name: string }) {
  const pathname = usePathname();
  const { selected } = useSelection();
  const items = [
    { href: "/photos", label: "Photos", icon: Images },
    { href: "/albums", label: "Albums", icon: FolderHeart },
    { href: "/upload", label: "Upload", icon: ImagePlus },
    { href: "/selection", label: "Selected", icon: CheckSquare, badge: selected.size },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: LayoutDashboard }] : [{ href: "/account", label: "Account", icon: UserRound }]),
  ];
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-champagne/25 bg-ivory/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="font-script text-3xl text-rose" aria-label="Wedding website">Neha&apos;s Wedding</Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Photo album">
            {items.map(({ href, label, icon: Icon, badge }) => (
              <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
                className={cn("relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
                  active(href) ? "bg-blush/50 text-gold-deep" : "text-cocoa/80 hover:text-gold-deep")}>
                <Icon className="size-4" /> {label}
                {badge ? <span className="rounded-full bg-gold px-1.5 text-[0.7rem] tabular-nums text-cream">{badge}</span> : null}
              </Link>
            ))}
          </nav>
          <Link href="/account" className="ml-auto inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-champagne to-gold font-display text-lg font-semibold text-cream md:ml-2"
            aria-label="Your account" title={name}>
            {(name || "?").trim().charAt(0).toUpperCase()}
          </Link>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-champagne/30 bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Photo album">
        <ul className="grid grid-cols-5">
          {items.map(({ href, label, icon: Icon, badge }) => (
            <li key={href}>
              <Link href={href} aria-current={active(href) ? "page" : undefined}
                className={cn("relative flex h-[4.25rem] flex-col items-center justify-center gap-1 text-[0.7rem] font-medium",
                  active(href) ? "text-gold-deep" : "text-taupe")}>
                <Icon className="size-5" />
                {label}
                {badge ? <span className="absolute right-[22%] top-2 min-w-5 rounded-full bg-gold px-1 text-center text-[0.65rem] tabular-nums text-cream">{badge}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
