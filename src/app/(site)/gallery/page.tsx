import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { PublicGallery } from "@/components/gallery/public-gallery";
import { getPublicPhotos } from "@/lib/public-gallery";
import { isDemoPhoto } from "@/lib/demo";

export const metadata: Metadata = { title: "Gallery" };
const PER_PAGE = 40;

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(0, Number((await searchParams).page ?? 0) || 0);
  const { photos, total } = await getPublicPhotos(page, PER_PAGE);
  const pages = Math.ceil(total / PER_PAGE);

  return (
    <>
      <PageHero eyebrow="Moments" title="Gallery" intro="A selection of moments, chosen by the family to share with everyone." />
      <section className="mx-auto max-w-6xl px-4 py-16">
        {photos.some((p) => isDemoPhoto(p.id)) && (
          <p className="mx-auto mb-8 max-w-xl rounded-full border border-champagne/50 bg-cream px-5 py-2 text-center text-sm text-taupe">
            These are demo images. The family&apos;s real photos will appear here.
          </p>
        )}
        {photos.length ? (
          <PublicGallery photos={photos} />
        ) : (
          <div className="card-frame paper mx-auto max-w-xl p-10 text-center">
            <p className="font-display text-2xl">No public photos yet</p>
            <p className="mt-2 text-taupe">Photos appear here once the family has approved them for the public gallery.</p>
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Gallery pages">
            {page > 0 && (
              <Link href={`/gallery?page=${page - 1}`} className="inline-flex h-11 items-center gap-1 rounded-full border border-champagne/60 px-5 hover:border-gold">
                <ChevronLeft className="size-4" /> Newer
              </Link>
            )}
            <span className="text-sm text-taupe">Page {page + 1} of {pages}</span>
            {page + 1 < pages && (
              <Link href={`/gallery?page=${page + 1}`} className="inline-flex h-11 items-center gap-1 rounded-full border border-champagne/60 px-5 hover:border-gold">
                Older <ChevronRight className="size-4" />
              </Link>
            )}
          </nav>
        )}

        <div className="mx-auto mt-16 flex max-w-xl items-start gap-4 rounded-2xl border border-champagne/40 bg-cream p-6">
          <Lock className="mt-1 size-5 shrink-0 text-gold" />
          <p className="text-taupe">
            The full collection - every album, original-quality downloads and uploads - is private to invited family and friends.{" "}
            <Link href="/login" className="font-medium text-gold-deep underline underline-offset-4">Sign in to the photo album</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
