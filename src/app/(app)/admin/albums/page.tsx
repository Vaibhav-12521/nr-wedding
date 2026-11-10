import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Globe, Lock, Users } from "lucide-react";
import { Panel } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth";
import { getAlbums, getEventOptions } from "@/lib/app-data";
import { AlbumForm } from "./album-form";
import { SuggestedAlbumsButton } from "./suggested-button";

export const metadata: Metadata = { title: "Albums · Admin" };

const VIS = { public: [Globe, "Public listing"], members: [Users, "All guests"], restricted: [Lock, "Chosen people"] } as const;

export default async function AdminAlbumsPage() {
  const session = await requireAdmin();
  const [albums, events] = await Promise.all([getAlbums(session), getEventOptions(session)]);
  return (
    <div className="space-y-6">
      <Panel title="Albums" description="Organise photos by celebration. Click an album to edit it, manage who can see it, or delete it."
        actions={<SuggestedAlbumsButton />}>
        {albums.length ? (
          <ul className="divide-y divide-champagne/30">
            {albums.map((a) => {
              const [Icon, label] = VIS[a.visibility];
              return (
                <li key={a.id}>
                  <Link href={`/admin/albums/${a.id}`} className="flex items-center gap-4 py-3 hover:bg-blush/20 sm:px-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {a.coverUrl ? <img src={a.coverUrl} alt="" className="size-14 rounded-xl object-cover" /> : <div className="size-14 rounded-xl bg-beige" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.name}</p>
                      <p className="flex items-center gap-1.5 text-sm text-taupe"><Icon className="size-3.5" /> {label} · {a.photoCount} photos
                        {!a.allow_uploads && " · uploads off"}{!a.allow_downloads && " · downloads off"}</p>
                    </div>
                    <ChevronRight className="size-4 text-taupe" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-taupe">No albums yet. Create one below, or add the suggested set with one click.</p>
        )}
      </Panel>
      <Panel title="New album">
        <AlbumForm events={events} />
      </Panel>
    </div>
  );
}
