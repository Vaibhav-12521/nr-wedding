import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PhotoBrowser } from "@/components/photos/photo-browser";
import { requireMember } from "@/lib/auth";
import { getUploaders } from "@/lib/app-data";
import { listPhotos, parseFilters } from "@/lib/photos";
import type { Album } from "@/lib/types";

export const metadata: Metadata = { title: "Album" };

export default async function AlbumPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const session = await requireMember(`/albums/${slug}`);
  const { data: album } = await session.supabase.from("albums").select("*").eq("slug", slug).maybeSingle<Album>();
  if (!album) notFound();
  const { data: canView } = await session.supabase.rpc("can_view_album", { p_album: album.id });
  if (!canView) notFound();

  const filters = { ...parseFilters(await searchParams), album: album.id };
  const [initial, uploaders, upload] = await Promise.all([
    listPhotos(session, { ...filters, page: 0 }),
    getUploaders(session),
    session.supabase.rpc("can_upload_album", { p_album: album.id }),
  ]);

  return (
    <>
      <div className="pt-4">
        <Link href="/albums" className="inline-flex items-center gap-1 text-sm text-taupe hover:text-gold-deep"><ChevronLeft className="size-4" /> Albums</Link>
        <h1 className="mt-1 text-4xl font-medium sm:text-5xl">{album.name}</h1>
        {album.description && <p className="mt-2 max-w-2xl text-taupe">{album.description}</p>}
      </div>
      <PhotoBrowser
        initial={initial}
        filters={filters}
        locked={{ album: album.id }}
        albums={[]}
        events={[]}
        uploaders={uploaders.map((u) => ({ id: u.id, name: u.full_name }))}
        uploadHref={upload.data ? `/upload?album=${album.id}` : null}
      />
    </>
  );
}
