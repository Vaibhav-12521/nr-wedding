import type { Metadata } from "next";
import { PhotoBrowser } from "@/components/photos/photo-browser";
import { requireMember } from "@/lib/auth";
import { getAlbums, getEventOptions, getUploaders } from "@/lib/app-data";
import { listPhotos, parseFilters } from "@/lib/photos";

export const metadata: Metadata = { title: "Selected photos" };

export default async function SelectionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireMember("/selection");
  const filters = { ...parseFilters(await searchParams), view: "selected" as const };
  const [initial, albums, uploaders, events] = await Promise.all([
    listPhotos(session, { ...filters, page: 0 }),
    getAlbums(session),
    getUploaders(session),
    getEventOptions(session),
  ]);
  return (
    <>
      <div className="pt-4">
        <p className="font-script text-3xl text-rose">Your collection</p>
        <h1 className="text-4xl font-medium sm:text-5xl">Selected Photos</h1>
        <p className="mt-2 max-w-2xl text-taupe">Photos you&apos;ve ticked anywhere in the album are gathered here - on every device you sign in on. Download them together as a ZIP.</p>
      </div>
      <PhotoBrowser
        initial={initial}
        filters={filters}
        locked={{ view: "selected" }}
        showViews={false}
        albums={albums.map((a) => ({ id: a.id, name: a.name }))}
        uploaders={uploaders.map((u) => ({ id: u.id, name: u.full_name }))}
        events={events.map((e) => ({ id: e.id, name: e.title }))}
      />
    </>
  );
}
