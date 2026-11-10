export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export const PHOTO_BUCKET = "photos";
export const SITE_BUCKET = "site";

export const LIMITS = {
  maxPhotoBytes: 50 * 1024 * 1024,
  maxFilesPerBatch: 100,
  zipMaxPhotos: 500,
  zipMaxBytes: 2 * 1024 * 1024 * 1024,
  pageSize: 60,
  signedUrlSeconds: 60 * 60,
  downloadUrlSeconds: 5 * 60,
};

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedType = (typeof ALLOWED_TYPES)[number];
export const EXT_FOR: Record<AllowedType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
