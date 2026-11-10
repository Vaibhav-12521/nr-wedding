"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  ["/admin", "Overview"],
  ["/admin/photos", "Photos & approvals"],
  ["/admin/website", "Website photos"],
  ["/admin/wishes", "Blessings"],
  ["/admin/albums", "Albums"],
  ["/admin/guests", "Guests"],
  ["/admin/team", "Admins"],
  ["/admin/wedding", "Wedding details"],
  ["/admin/events", "Events"],
  ["/admin/rsvps", "RSVPs"],
  ["/admin/activity", "Activity"],
] as const;

export function AdminNav({ pending, wishes }: { pending: number; wishes: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex gap-1.5 pb-1">
        {LINKS.map(([href, label]) => {
          const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium transition",
                  active ? "bg-cocoa text-ivory" : "bg-cream text-cocoa/80 ring-1 ring-champagne/40 hover:ring-gold")}>
                {label}
                {href === "/admin/photos" && pending > 0 && <span className="rounded-full bg-rose px-1.5 text-[0.7rem] text-white">{pending}</span>}
                {href === "/admin/wishes" && wishes > 0 && <span className="rounded-full bg-rose px-1.5 text-[0.7rem] text-white">{wishes}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
