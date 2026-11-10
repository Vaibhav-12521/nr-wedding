import type { Metadata } from "next";
import Link from "next/link";
import { FolderHeart, Globe, Lock, Users } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { getAlbums } from "@/lib/app-data";

export const metadata: Metadata = { title: "Albums" };

const VIS = {
  public: { icon: Globe, label: "Public" },
  members: { icon: Users, label: "All guests" },
  restricted: { icon: Lock, label: "Private" },
} as const;

export default async function AlbumsPage() {
  const session = await requireMember("/albums");
  const albums = await getAlbums(session);
  return (
    <div className="pb-28">
      <div className="pt-4">
        <p className="font-script text-3xl text-rose">Collections</p>
        <h1 className="text-4xl font-medium sm:text-5xl">Albums</h1>
      </div>
      {albums.length === 0 ? (
        <div className="card-frame paper mx-auto mt-10 max-w-lg p-10 text-center">
          <FolderHeart className="relative z-10 mx-auto size-8 text-gold" />
          <p className="relative z-10 mt-4 font-display text-2xl">No albums yet</p>
          <p className="relative z-10 mt-2 text-taupe">The family will create albums for each celebration soon.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => {
            const v = VIS[a.visibility];
            return (
              <li key={a.id}>
                <Link href={`/albums/${a.slug}`} className="group block overflow-hidden rounded-2xl border border-champagne/40 bg-cream shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-blush/60 via-cream to-beige">
                    {a.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    ) : (
                      <FolderHeart className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-gold/60" />
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-cream/90 px-2.5 py-1 text-xs font-medium text-cocoa">
                      <v.icon className="size-3.5" /> {v.label}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="text-2xl font-medium">{a.name}</h2>
                    <p className="mt-0.5 text-sm text-taupe">{a.photoCount} photo{a.photoCount === 1 ? "" : "s"}</p>
                    {a.description && <p className="mt-2 line-clamp-2 text-sm text-taupe">{a.description}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
