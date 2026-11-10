import manifest from "../../public/demo/manifest.json";
import type { PublicPhoto } from "@/lib/public-gallery";

export const DEMO_PHOTOS: PublicPhoto[] = manifest.map((m) => ({
  id: m.id,
  title: `${m.title} (demo)`,
  width: m.width,
  height: m.height,
  thumbUrl: `/demo/${m.id}-thumb.webp`,
  previewUrl: `/demo/${m.id}-preview.webp`,
  albumName: "Demo photos",
}));

export const isDemoPhoto = (id: string) => id.startsWith("demo-");
