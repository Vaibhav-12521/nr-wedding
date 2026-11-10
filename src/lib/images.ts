import "server-only";
import sharp, { type Metadata } from "sharp";
import type { AllowedType } from "@/lib/env";

const FORMAT_TO_MIME: Record<string, AllowedType> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export type Processed = {
  mime: AllowedType;
  width: number;
  height: number;
  thumb: Buffer;
  preview: Buffer;
};

export async function processPhoto(original: Buffer): Promise<Processed> {
  let meta: Metadata;
  try {
    meta = await sharp(original, { failOn: "error" }).metadata();
  } catch {
    throw new ImageError("This file isn't a readable image.");
  }
  const mime = meta.format ? FORMAT_TO_MIME[meta.format] : undefined;
  if (!mime) throw new ImageError("Only JPG, PNG and WebP photos are supported.");
  if (!meta.width || !meta.height) throw new ImageError("This image has no dimensions.");
  if (meta.width * meta.height > 120_000_000) throw new ImageError("This image is too large to process.");

  const swap = (meta.orientation ?? 1) >= 5;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;

  const base = sharp(original, { failOn: "none" }).rotate();
  const [thumb, preview] = await Promise.all([
    base.clone().resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toBuffer(),
    base.clone().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer(),
  ]);
  return { mime, width, height, thumb, preview };
}

export class ImageError extends Error {}
