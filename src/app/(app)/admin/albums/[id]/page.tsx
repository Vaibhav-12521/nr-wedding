import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { Panel } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth";
import { getEventOptions } from "@/lib/app-data";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Album } from "@/lib/types";
import { AlbumForm } from "../album-form";
import { AlbumAccess, DeleteAlbum } from "./album-access";

export const metadata: Metadata = { title: "Edit album · Admin" };

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const session = await requireAdmin();
  const { data: album } = await session.supabase.from("albums").select("*").eq("id", id).maybeSingle<Album>();
  if (!album) notFound();

  const svc = createAdminClient();
  const [events, { data: perms }, { data: people }, { count }] = await Promise.all([
    getEventOptions(session),
    session.supabase.from("album_permissions").select("user_id, can_view, can_upload, can_download").eq("album_id", id),
    svc.from("profiles").select("id, full_name, email").eq("is_active", true).order("full_name").limit(1000),
    session.supabase.from("photos").select("id", { count: "exact", head: true }).eq("album_id", id),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/albums" className="inline-flex items-center gap-1 text-sm text-taupe hover:text-gold-deep"><ChevronLeft className="size-4" /> All albums</Link>
      <Panel title={album.name} description={`${count ?? 0} photos · /albums/${album.slug}`}
        actions={<Link href={`/albums/${album.slug}`} className="text-sm font-medium text-gold-deep underline-offset-4 hover:underline">Open album →</Link>}>
        <AlbumForm album={album} events={events} />
      </Panel>
      <Panel title="Who can access this album"
        description={album.visibility === "restricted"
          ? "Only the people listed here (and admins) can see this album. A link to it won't work for anyone else."
          : "This album is open to all invited guests. You can still give specific people upload rights or remove their download rights below."}>
        <AlbumAccess albumId={album.id} restricted={album.visibility === "restricted"} people={people ?? []} perms={perms ?? []} />
      </Panel>
      <Panel title="Delete album" description="Removes the album and every photo in it, including original files. This can't be undone.">
        <DeleteAlbum id={album.id} name={album.name} count={count ?? 0} />
      </Panel>
    </div>
  );
}
