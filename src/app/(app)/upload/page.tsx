import type { Metadata } from "next";
import { Uploader } from "@/components/photos/uploader";
import { requireMember } from "@/lib/auth";
import { getAlbums } from "@/lib/app-data";

export const metadata: Metadata = { title: "Upload photos" };

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ album?: string }> }) {
  const session = await requireMember("/upload");
  const [{ album }, albums] = await Promise.all([searchParams, getAlbums(session)]);
  const allowed = albums.filter((a) => a.canUpload).map((a) => ({ id: a.id, name: a.name, slug: a.slug }));
  return (
    <>
      <div className="mx-auto max-w-4xl pt-4">
        <p className="font-script text-3xl text-rose">Share your moments</p>
        <h1 className="text-4xl font-medium sm:text-5xl">Upload Photos</h1>
        <p className="mt-2 text-taupe">Your photos are shared with invited family and friends only. Nothing is shown publicly unless the family approves it.</p>
      </div>
      <div className="mt-8">
        <Uploader albums={allowed} defaultAlbum={album} />
      </div>
    </>
  );
}
