import "server-only";
import { z } from "zod";
import type { Session } from "@/lib/auth";
import { LIMITS } from "@/lib/env";
import { signMany } from "@/lib/storage";
import type { ApprovalStatus, GalleryPhoto, PhotoVisibility } from "@/lib/types";

export const filtersSchema = z.object({
  view: z.enum(["all", "latest", "favourites", "mine", "selected"]).catch("all"),
  album: z.string().uuid().optional().catch(undefined),
  event: z.string().uuid().optional().catch(undefined),
  uploader: z.string().uuid().optional().catch(undefined),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  q: z.string().trim().max(80).optional().catch(undefined),
  sort: z.enum(["newest", "oldest", "name"]).catch("newest"),
  page: z.coerce.number().int().min(0).max(10_000).catch(0),
});
export type PhotoFilters = z.infer<typeof filtersSchema>;

export function parseFilters(params: URLSearchParams | Record<string, string | string[] | undefined>): PhotoFilters {
  const raw: Record<string, string> = {};
  const entries = params instanceof URLSearchParams ? [...params.entries()] : Object.entries(params);
  for (const [k, v] of entries) {
    const value = Array.isArray(v) ? v[0] : v;
    if (value) raw[k] = value;
  }
  const r = filtersSchema.safeParse(raw);
  return r.success ? r.data : filtersSchema.parse({});
}

type Row = {
  id: string; title: string | null; original_filename: string; width: number | null; height: number | null;
  file_size: number; created_at: string; album_id: string; uploaded_by: string | null;
  visibility: PhotoVisibility; approval_status: ApprovalStatus; thumbnail_path: string; preview_path: string;
  album: { name: string; event_id: string | null } | null;
  uploader: { full_name: string } | null;
};

const SELECT = `id, title, original_filename, width, height, file_size, created_at, album_id, uploaded_by,
  visibility, approval_status, thumbnail_path, preview_path,
  album:albums!photos_album_id_fkey!inner(name, event_id),
  uploader:profiles!photos_uploaded_by_fkey(full_name)`;

export async function listPhotos(session: Session, f: PhotoFilters) {
  const { supabase, userId, profile } = session;
  let select = SELECT;
  if (f.view === "favourites") select += ", fav:photo_favourites!inner(user_id)";
  if (f.view === "selected") select += ", sel:photo_selections!inner(user_id)";

  let q = supabase.from("photos").select(select, { count: "exact" });
  if (f.view === "favourites") q = q.eq("fav.user_id", userId);
  if (f.view === "selected") q = q.eq("sel.user_id", userId);
  if (f.view === "mine") q = q.eq("uploaded_by", userId);
  if (f.view === "latest") q = q.gte("created_at", new Date(Date.now() - 2 * 86400_000).toISOString());
  if (f.album) q = q.eq("album_id", f.album);
  if (f.event) q = q.eq("album.event_id", f.event);
  if (f.uploader) q = q.eq("uploaded_by", f.uploader);
  if (f.date) {
    const start = new Date(`${f.date}T00:00:00+05:30`);
    q = q.gte("created_at", start.toISOString()).lt("created_at", new Date(start.getTime() + 86400_000).toISOString());
  }
  if (f.q) {
    const term = f.q.replace(/[%,()*\\]/g, " ").trim();
    if (term) q = q.or(`title.ilike.%${term}%,original_filename.ilike.%${term}%`);
  }
  const asc = f.sort === "oldest";
  q = f.sort === "name"
    ? q.order("original_filename", { ascending: true }).order("id")
    : q.order("created_at", { ascending: asc }).order("id", { ascending: asc });

  const from = f.page * LIMITS.pageSize;
  const { data, count, error } = await q.range(from, from + LIMITS.pageSize - 1);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Row[];

  const [urls, favs] = await Promise.all([
    signMany(rows.flatMap((r) => [r.thumbnail_path, r.preview_path])),
    rows.length
      ? supabase.from("photo_favourites").select("photo_id").eq("user_id", userId).in("photo_id", rows.map((r) => r.id))
      : Promise.resolve({ data: [] as { photo_id: string }[] }),
  ]);
  const favSet = new Set((favs.data ?? []).map((x) => x.photo_id));

  const photos: GalleryPhoto[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    filename: r.original_filename,
    width: r.width,
    height: r.height,
    size: r.file_size,
    createdAt: r.created_at,
    albumId: r.album_id,
    albumName: r.album?.name ?? null,
    uploaderId: r.uploaded_by,
    uploaderName: r.uploader?.full_name || null,
    visibility: r.visibility,
    approval: r.approval_status,
    thumbUrl: urls.get(r.thumbnail_path) ?? "",
    previewUrl: urls.get(r.preview_path) ?? "",
    favourite: favSet.has(r.id),
    canDelete: profile.role === "admin" || r.uploaded_by === userId,
  }));
  return { photos, total: count ?? photos.length, hasMore: from + rows.length < (count ?? 0) };
}
