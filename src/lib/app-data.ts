import "server-only";
import type { Session } from "@/lib/auth";
import { signMany } from "@/lib/storage";
import type { Album } from "@/lib/types";

export type AlbumWithMeta = Album & { photoCount: number; coverUrl: string | null; canUpload: boolean };

export async function getAlbums(session: Session): Promise<AlbumWithMeta[]> {
  const { supabase } = session;
  const { data: albums, error } = await supabase
    .from("albums").select("*").order("sort_order").order("created_at");
  if (error) throw new Error(error.message);
  const list = (albums ?? []) as Album[];
  if (!list.length) return [];

  const [counts, rights, covers] = await Promise.all([
    Promise.all(list.map((a) => supabase.from("photos").select("id", { count: "exact", head: true }).eq("album_id", a.id))),
    Promise.all(list.map((a) => supabase.rpc("can_upload_album", { p_album: a.id }))),
    Promise.all(list.map((a) =>
      a.cover_photo_id
        ? supabase.from("photos").select("thumbnail_path").eq("id", a.cover_photo_id).maybeSingle()
        : supabase.from("photos").select("thumbnail_path").eq("album_id", a.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    )),
  ]);
  const paths = covers.map((c) => (c.data as { thumbnail_path?: string } | null)?.thumbnail_path ?? "");
  const urls = await signMany(paths.filter(Boolean));
  return list.map((a, i) => ({
    ...a,
    photoCount: counts[i].count ?? 0,
    canUpload: rights[i].data === true,
    coverUrl: paths[i] ? urls.get(paths[i]) ?? null : null,
  }));
}

export async function getUploaders(session: Session) {
  const { data } = await session.supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name");
  return (data ?? []).filter((p) => p.full_name) as { id: string; full_name: string }[];
}

export async function getEventOptions(session: Session) {
  const { data } = await session.supabase.from("wedding_events").select("id, title").order("sort_order");
  return (data ?? []) as { id: string; title: string }[];
}
