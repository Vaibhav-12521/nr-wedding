import type { Metadata } from "next";
import { PhotoBrowser } from "@/components/photos/photo-browser";
import { requireMember } from "@/lib/auth";
import { getAlbums, getEventOptions, getUploaders } from "@/lib/app-data";
import { listPhotos, parseFilters } from "@/lib/photos";

export const metadata: Metadata = { title: "Photos" };

export default async function PhotosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireMember("/photos");
  const filters = parseFilters(await searchParams);
  const [initial, albums, uploaders, events] = await Promise.all([
    listPhotos(session, { ...filters, page: 0 }),
    getAlbums(session),
    getUploaders(session),
    getEventOptions(session),
  ]);
  const name = session.profile.full_name.split(" ")[0];
  return (
    <>
      <div className="pt-4">
        <p className="font-script text-3xl text-rose">{name ? `Hello, ${name}` : "Welcome"}</p>
        <h1 className="text-4xl font-medium sm:text-5xl">Wedding Photos</h1>
      </div>
      <PhotoBrowser
        initial={initial}
        filters={filters}
        albums={albums.map((a) => ({ id: a.id, name: a.name }))}
        uploaders={uploaders.map((u) => ({ id: u.id, name: u.full_name }))}
        events={events.map((e) => ({ id: e.id, name: e.title }))}
        uploadHref={albums.some((a) => a.canUpload) ? "/upload" : null}
      />
    </>
  );
}
