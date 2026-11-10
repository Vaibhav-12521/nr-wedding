import "server-only";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import { signMany } from "@/lib/storage";
import { DEMO_PHOTOS } from "@/lib/demo";

export type PublicPhoto = { id: string; title: string | null; width: number | null; height: number | null; thumbUrl: string; previewUrl: string; albumName: string | null };

export async function getPublicPhotos(page: number, perPage: number): Promise<{ photos: PublicPhoto[]; total: number }> {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { photos: DEMO_PHOTOS.slice(page * perPage, (page + 1) * perPage), total: DEMO_PHOTOS.length };
  }
  const from = page * perPage;
  const { data, count, error } = await createPublicClient()
    .from("photos")
    .select("id, title, width, height, thumbnail_path, preview_path, album:albums!photos_album_id_fkey(name)", { count: "exact" })
    .eq("visibility", "public")
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + perPage - 1);
  if (error) {
    console.error("public gallery", error);
    return { photos: [], total: 0 };
  }
  const urls = await signMany((data ?? []).flatMap((p) => [p.thumbnail_path, p.preview_path]));
  return {
    total: count ?? 0,
    photos: (data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      width: p.width,
      height: p.height,
      thumbUrl: urls.get(p.thumbnail_path) ?? "",
      previewUrl: urls.get(p.preview_path) ?? "",
      albumName: (p.album as unknown as { name?: string } | null)?.name ?? null,
    })),
  };
}

export async function getFeaturedPhotos(limit = 24): Promise<PublicPhoto[]> {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return DEMO_PHOTOS.slice(0, Math.min(limit, 8));
  const { data, error } = await createPublicClient()
    .from("photos")
    .select("id, title, width, height, thumbnail_path, preview_path, album:albums!photos_album_id_fkey(name)")
    .eq("is_featured", true)
    .order("featured_order")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data?.length) return [];
  const urls = await signMany(data.flatMap((p) => [p.thumbnail_path, p.preview_path]));
  return data.map((p) => ({
    id: p.id, title: p.title, width: p.width, height: p.height,
    thumbUrl: urls.get(p.thumbnail_path) ?? "", previewUrl: urls.get(p.preview_path) ?? "",
    albumName: (p.album as unknown as { name?: string } | null)?.name ?? null,
  }));
}

export async function getWishes(limit = 60) {
  if (!isSupabaseConfigured) return [];
  const { data } = await createPublicClient()
    .from("wishes").select("id, name, message, created_at").eq("status", "approved")
    .order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as import("@/lib/types").Wish[];
}
