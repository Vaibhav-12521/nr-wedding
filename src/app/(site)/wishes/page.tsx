import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { WishCard } from "@/components/site/wish-card";
import { getSession } from "@/lib/auth";
import { getWishes } from "@/lib/public-gallery";
import { WishForm } from "./wish-form";

export const metadata: Metadata = { title: "Blessings" };
export const dynamic = "force-dynamic";

export default async function WishesPage() {
  const [wishes, session] = await Promise.all([getWishes(), getSession()]);
  const member = session?.profile.is_active;
  return (
    <>
      <PageHero eyebrow="Blessings" title="Wishes for the Couple" intro="Love, blessings and kind words from family and friends." />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_380px]">
        <div>
          {wishes.length ? (
            <div className="columns-1 gap-5 sm:columns-2 [&>*]:mb-5">
              {wishes.map((w, i) => <Reveal key={w.id} delay={(i % 4) * 0.08}><WishCard wish={w} /></Reveal>)}
            </div>
          ) : (
            <div className="card-frame paper p-10 text-center">
              <p className="relative z-10 font-display text-2xl">Be the first to send your blessings</p>
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {member ? (
            <WishForm name={session!.profile.full_name} />
          ) : (
            <div className="card-frame paper p-8 text-center">
              <p className="relative z-10 font-display text-2xl">Share your blessings</p>
              <p className="relative z-10 mt-2 text-taupe">Invited guests can sign in to leave a message for Neha &amp; Rudra.</p>
              <Link href="/login?next=/wishes" className="relative z-10 mt-5 inline-flex h-11 items-center rounded-full bg-gold px-6 font-medium text-cream hover:bg-gold-deep">Sign in</Link>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
