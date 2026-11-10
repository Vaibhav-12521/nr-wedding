import Link from "next/link";
import { ArrowDown, Camera, Heart } from "lucide-react";
import { Countdown } from "@/components/site/countdown";
import { InvitationIntro } from "@/components/site/invitation-intro";
import { DOORS_SCRIPT } from "@/lib/doors";
import { ShareButtons } from "@/components/site/share-buttons";
import { Reveal } from "@/components/site/reveal";
import { FadeIn } from "@/components/site/fade-in";
import { EventCard } from "@/components/site/event-card";
import { PublicGallery } from "@/components/gallery/public-gallery";
import { CoupleSection } from "@/components/site/couple";
import { FeaturedSlideshow } from "@/components/site/featured-slideshow";
import { WishCard } from "@/components/site/wish-card";
import { Jharokha, Mandala, Ornament, PatternBand, SectionHeading } from "@/components/decor";
import { Toran } from "@/components/site/toran";
import { AmbientPetals } from "@/components/site/petals";
import { Bokeh, Diya } from "@/components/site/diya";
import { coupleNames, getEvents, getWedding, siteImageUrl } from "@/lib/wedding";
import { getFeaturedPhotos, getPublicPhotos, getWishes } from "@/lib/public-gallery";
import { env } from "@/lib/env";
import { eventDayParts, formatDate } from "@/lib/format";

export default async function Home() {
  const [wedding, events, gallery, featured, wishes] = await Promise.all([
    getWedding(), getEvents(), getPublicPhotos(0, 8), getFeaturedPhotos(), getWishes(3),
  ]);
  const names = coupleNames(wedding);
  const weddingEvent = events.find((e) => /wedding/i.test(e.title)) ?? events.at(-1);
  const dateLine = formatDate(wedding.wedding_date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    ?? (weddingEvent?.date_label ? `${weddingEvent.date_label}` : null);
  const hero = siteImageUrl(wedding.hero_image_path);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DOORS_SCRIPT }} />
      <InvitationIntro bride={wedding.bride_name} groom={wedding.groom_name} dateLine={dateLine}
        bridePhoto={siteImageUrl(wedding.bride_photo_path)} groomPhoto={siteImageUrl(wedding.groom_photo_path)} />

      <section className="relative overflow-hidden px-4 pb-20 pt-28 text-center sm:pt-32">
        {hero ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#3a0d16]/60 via-ivory/70 to-ivory" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f3ddd6_0%,#faf1ea_42%,#f3e6d2_100%)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(185,114,124,0.32),transparent_55%)]" />
            <Bokeh />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#f3e6d2] to-transparent" />
          </div>
        )}
        <Toran className="absolute inset-x-0 top-16 z-10" count={40} />
        <Mandala className="parallax-slow pointer-events-none absolute left-[calc(50%-70vmin)] top-[calc(44%-70vmin)] size-[140vmin] opacity-[0.08]" />
        <AmbientPetals />

        <div className="relative z-10 mx-auto max-w-4xl">
          <FadeIn>
            <Jharokha className="mx-auto mt-10 w-full max-w-[34rem] px-6 pb-12 pt-20 sm:px-12 sm:pb-16 sm:pt-24">
              <p className="text-[0.68rem] uppercase tracking-[0.45em] text-taupe sm:text-xs">Together with their families</p>
              <p className="mt-5 font-script text-4xl text-rose sm:text-5xl">The Wedding of</p>
              <h1 className="mt-3 font-display font-medium leading-[0.9]">
                <span className="foil block text-6xl sm:text-8xl">{wedding.bride_name}</span>
                {wedding.groom_name && (
                  <>
                    <span className="my-1 block font-script text-4xl text-rose sm:text-5xl">&amp;</span>
                    <span className="foil block text-6xl sm:text-8xl">{wedding.groom_name}</span>
                  </>
                )}
              </h1>
              <Ornament className="mt-7" />
              <p className="mt-5 font-display text-lg italic text-cocoa/80 sm:text-xl">{wedding.tagline}</p>
            </Jharokha>
          </FadeIn>

          <FadeIn delay={0.25}>
            <p className="mt-12 font-script text-3xl text-rose sm:text-4xl">Save the Dates</p>
            <ol className="mx-auto mt-5 flex max-w-2xl flex-wrap items-stretch justify-center gap-3 sm:gap-0">
              {events.slice(0, 3).map((e, i) => {
                const d = eventDayParts(e);
                return (
                  <li key={e.id} className="flex items-stretch">
                    {i > 0 && <span aria-hidden className="mx-4 hidden h-px w-10 self-center bg-gradient-to-r from-transparent via-champagne to-transparent sm:block" />}
                    <div className="flex w-40 flex-col justify-between gap-2 rounded-2xl border border-champagne/60 bg-cream/80 px-4 py-4 shadow-[0_12px_30px_-18px_rgba(138,106,49,0.6)] backdrop-blur">
                      {d ? (
                        <div>
                          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-taupe">{d.weekday}</p>
                          <p className="font-display text-5xl font-semibold leading-none text-gold-deep">{d.day}</p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-cocoa">{d.month} {d.year}</p>
                        </div>
                      ) : (
                        <p className="font-display text-xl text-gold-deep">To be announced</p>
                      )}
                      <p className="border-t border-champagne/40 pt-2 font-display text-[0.95rem] leading-tight">{e.title}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {(wedding.venue_name || wedding.location) && (
              <p className="mt-5 text-taupe">{[wedding.venue_name, wedding.location].filter(Boolean).join(" · ")}</p>
            )}
          </FadeIn>

          <FadeIn delay={0.4}>
            {wedding.wedding_date && (
              <>
                <p className="mt-12 text-[0.68rem] uppercase tracking-[0.22em] text-taupe sm:text-xs sm:tracking-[0.4em]">Counting down to the wedding day</p>
                <Countdown target={wedding.wedding_date} className="mt-4" />
              </>
            )}
            <div className="mt-10 flex flex-col items-center gap-5">
              <a href="#welcome" className="btn-gold inline-flex h-12 items-center gap-2 rounded-full px-8 font-medium tracking-wide text-cream">
                Explore the Wedding <ArrowDown className="size-4" />
              </a>
              <ShareButtons text={`You're invited to ${names}'s wedding! ${wedding.tagline}`} url={env.siteUrl} />
            </div>
          </FadeIn>
        </div>
        <div className="relative z-10 mx-auto mt-14 flex max-w-3xl items-end justify-center gap-4 sm:gap-10" aria-hidden>
          {[0, 0.5, 0.2, 0.8, 0.35].map((d, i) => (
            <Diya key={i} delay={d} className={i === 2 ? "size-20 sm:size-24" : i % 4 === 0 ? "size-12 sm:size-16" : "size-16 sm:size-20"} />
          ))}
        </div>
      </section>
      <PatternBand className="bg-ivory" />

      <section id="welcome" className="scroll-mt-16 px-4 py-24 sm:py-32">
        <Reveal>
          <SectionHeading eyebrow="Welcome" title="With joy in our hearts"
            intro={wedding.story_intro || "Our families warmly invite you to share in the celebrations as two hearts and two families become one."} />
        </Reveal>
        <div className="mt-16"><CoupleSection w={wedding} /></div>
        <Reveal delay={0.2} className="mt-12 text-center">
          <Link href="/story" className="inline-flex items-center gap-2 font-medium text-gold-deep underline-offset-8 hover:underline">
            <Heart className="size-4" /> Read our story
          </Link>
        </Reveal>
      </section>

      <PatternBand />
      <section className="paper border-y border-champagne/25 px-4 py-24 sm:py-32">
        <Reveal><SectionHeading eyebrow="Celebrations" title="Wedding Events" /></Reveal>
        <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-2">
          {events.slice(0, 4).map((e, i) => (
            <Reveal key={e.id} delay={i * 0.12}><EventCard event={e} index={i} compact /></Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/events" className="font-medium text-gold-deep underline-offset-8 hover:underline">All event details →</Link>
        </div>
      </section>

      <section className="px-4 py-24 sm:py-32">
        <Reveal><SectionHeading eyebrow="Moments" title="Gallery" /></Reveal>
        <div className="mx-auto mt-14 max-w-6xl">
          {featured.length > 0 && <div className="mb-14"><FeaturedSlideshow photos={featured} /></div>}
          {gallery.photos.length ? (
            <>
              <PublicGallery photos={gallery.photos} />
              <div className="mt-10 text-center">
                <Link href="/gallery" className="font-medium text-gold-deep underline-offset-8 hover:underline">View the full gallery →</Link>
              </div>
            </>
          ) : (
            <div className="card-frame paper mx-auto max-w-xl p-10 text-center">
              <Camera className="mx-auto size-8 text-gold" />
              <p className="mt-4 font-display text-2xl">Photos are on their way</p>
              <p className="mt-2 text-taupe">Selected moments will appear here after the celebrations. Family and friends can sign in to share and download every photo.</p>
              <Link href="/login" className="mt-6 inline-flex h-11 items-center rounded-full border border-gold/50 px-6 font-medium text-gold-deep hover:bg-blush/30">Guest sign in</Link>
            </div>
          )}
        </div>
      </section>

      <section className="paper border-t border-champagne/25 px-4 py-24">
        <Reveal><SectionHeading eyebrow="Blessings" title="Wishes for the Couple" /></Reveal>
        {wishes.length ? (
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {wishes.map((w, i) => <Reveal key={w.id} delay={i * 0.1}><WishCard wish={w} /></Reveal>)}
          </div>
        ) : (
          <p className="mt-8 text-center text-taupe">Be the first to share your blessings.</p>
        )}
        <div className="mt-10 text-center">
          <Link href="/wishes" className="inline-flex h-11 items-center rounded-full border border-gold/50 px-6 font-medium text-gold-deep hover:bg-blush/30">Read &amp; share blessings</Link>
        </div>
      </section>

      {wedding.rsvp_enabled && (
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#4a0f1b,#6d1a28_50%,#4a0f1b)] px-4 py-24 text-center text-ivory">
          <Mandala className="pointer-events-none absolute -right-32 -top-32 size-[28rem] text-[#e2c27c] opacity-[0.12]" />
          <Mandala className="pointer-events-none absolute -bottom-40 -left-32 size-[28rem] text-[#e2c27c] opacity-[0.12]" />
          <Reveal>
            <p className="font-script text-4xl text-[#f2c9cf] sm:text-5xl">Will you join us?</p>
            <h2 className="mt-2 text-4xl font-medium text-[#f6e2a8] sm:text-6xl">Kindly RSVP</h2>
            <Ornament className="mt-6 text-[#e2c27c]" />
            {wedding.rsvp_deadline && <p className="mt-5 text-[#f1d899]/85">Please reply by {formatDate(wedding.rsvp_deadline)}</p>}
            <Link href="/rsvp" className="mt-8 inline-flex h-12 items-center rounded-full bg-gradient-to-r from-[#d4ac5c] via-[#f1d899] to-[#d4ac5c] px-9 font-semibold text-[#4a0f1b] shadow-lg transition hover:brightness-105">
              Respond now
            </Link>
          </Reveal>
        </section>
      )}
    </>
  );
}
