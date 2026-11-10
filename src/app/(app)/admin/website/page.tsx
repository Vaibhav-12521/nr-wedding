import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { signMany } from "@/lib/storage";
import { WebsitePhotos } from "./website-photos";

export const metadata: Metadata = { title: "Website photos · Admin" };

export default async function WebsitePhotosPage() {
  const { supabase } = await requireAdmin();
  const cols = "id, original_filename, title, visibility, approval_status, thumbnail_path, album:albums!photos_album_id_fkey(name)";
  const [{ data: featured }, { data: recent }, { data: albums }] = await Promise.all([
    supabase.from("photos").select(cols).eq("is_featured", true).order("featured_order").limit(200),
    supabase.from("photos").select(cols).eq("is_featured", false).order("created_at", { ascending: false }).limit(60),
    supabase.from("albums").select("id, name, slug").order("sort_order"),
  ]);
  const urls = await signMany([...(featured ?? []), ...(recent ?? [])].map((p) => p.thumbnail_path));
  const shape = (p: NonNullable<typeof featured>[number]) => ({
    id: p.id,
    name: p.title || p.original_filename,
    isPublic: p.visibility === "public",
    album: (p.album as unknown as { name?: string } | null)?.name ?? "",
    thumbUrl: urls.get(p.thumbnail_path) ?? "",
  });
  return <WebsitePhotos featured={(featured ?? []).map(shape)} recent={(recent ?? []).map(shape)} albums={albums ?? []} />;
}
