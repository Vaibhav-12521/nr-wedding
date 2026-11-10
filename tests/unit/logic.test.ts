import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";

vi.mock("server-only", () => ({}));

const { processPhoto, ImageError } = await import("@/lib/images");
const { parseOriginalPath, paths } = await import("@/lib/storage");
const { parseFilters } = await import("@/lib/photos");
const { zipParts } = await import("@/components/photos/zip-download");
const { slugify, eventDateLabel, directionsUrl } = await import("@/lib/format");

const img = (format: "jpeg" | "png" | "webp", w = 1200, h = 800, orientation?: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 160, b: 110 } } })
    .withMetadata(orientation ? { orientation } : {})
    .toFormat(format)
    .toBuffer();

describe("upload validation (processPhoto)", () => {
  it.each(["jpeg", "png", "webp"] as const)("accepts a real %s and makes small webp previews", async (f) => {
    const out = await processPhoto(await img(f));
    expect(out.mime).toBe(`image/${f}`);
    expect([out.width, out.height]).toEqual([1200, 800]);
    const t = await sharp(out.thumb).metadata();
    const p = await sharp(out.preview).metadata();
    expect(t.format).toBe("webp");
    expect(Math.max(t.width!, t.height!)).toBe(600);
    expect(Math.max(p.width!, p.height!)).toBe(1200);
  });

  it("rejects files that only pretend to be images", async () => {
    await expect(processPhoto(Buffer.from("<script>alert(1)</script>"))).rejects.toBeInstanceOf(ImageError);
    await expect(processPhoto(Buffer.from("GIF89a....."))).rejects.toBeInstanceOf(ImageError);
  });

  it("rejects a genuine but unsupported format (GIF)", async () => {
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#fff" } }).gif().toBuffer();
    await expect(processPhoto(gif)).rejects.toThrow(/JPG, PNG and WebP/);
  });

  it("respects EXIF rotation (portrait phone photos)", async () => {
    const out = await processPhoto(await img("jpeg", 1200, 800, 6));
    expect([out.width, out.height]).toEqual([800, 1200]);
    const p = await sharp(out.preview).metadata();
    expect(p.height).toBeGreaterThan(p.width!);
    expect(p.exif).toBeUndefined();
  });
});

describe("storage paths", () => {
  const me = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  const photo = "33333333-3333-4333-8333-333333333333";

  it("only lets you finalise your own uploads", () => {
    expect(parseOriginalPath(paths.original(me, photo, "jpg"), me)).toEqual({ photoId: photo, ext: "jpg" });
    expect(parseOriginalPath(paths.original(other, photo, "jpg"), me)).toBeNull();
  });

  it("rejects path tricks", () => {
    for (const p of [`u/${me}/../${other}/${photo}.jpg`, `u/${me}/${photo}.jpg/../../x`, `d/${photo}/thumb.webp`, `u/${me}/${photo}.gif`, ""]) {
      expect(parseOriginalPath(p, me)).toBeNull();
    }
  });
});

describe("gallery filters", () => {
  it("parses valid filters and drops junk", () => {
    const f = parseFilters({ view: "favourites", sort: "oldest", page: "3", q: "  haldi ", date: "2027-02-15", album: "not-a-uuid" });
    expect(f).toMatchObject({ view: "favourites", sort: "oldest", page: 3, q: "haldi", date: "2027-02-15" });
    expect(parseFilters({ view: "hacker", page: "-1" })).toMatchObject({ view: "all", page: 0, sort: "newest" });
  });
});

describe("ZIP splitting", () => {
  it("keeps parts under the photo count and size limits", () => {
    const photos = Array.from({ length: 1201 }, (_, i) => ({ id: String(i), size: 5 * 1024 * 1024 }));
    const parts = zipParts(photos, 500, 2 * 1024 ** 3);
    expect(parts.map((p) => p.length)).toEqual([409, 409, 383]);
    expect(parts.flat()).toHaveLength(1201);
    const small = zipParts(photos.slice(0, 10), 500, 2 * 1024 ** 3);
    expect(small).toHaveLength(1);
  });
});

describe("formatting", () => {
  it("slugs album names", () => {
    expect(slugify("Wedding Day – 15 February")).toBe("wedding-day-15-february");
    expect(slugify("Bride's Collection")).toBe("bride-s-collection");
    expect(slugify("!!!")).toBe("album");
  });

  it("shows the full date (with weekday) once the year is known", () => {
    expect(eventDateLabel({ starts_at: null, date_label: "31 January 2027" })).toBe("Sunday, 31 January 2027");
    expect(eventDateLabel({ starts_at: null, date_label: "15 February 2027" })).toBe("Monday, 15 February 2027");
  });

  it("never invents a year for undated events", () => {
    expect(eventDateLabel({ starts_at: null, date_label: "31 January" })).toBe("31 January · year to be confirmed");
    expect(eventDateLabel({ starts_at: null, date_label: null })).toBe("Date to be announced");
  });

  it("builds directions links", () => {
    expect(directionsUrl(null, "MG Road, Lucknow", "The Palace")).toContain("destination=The%20Palace%2C%20MG%20Road%2C%20Lucknow");
    expect(directionsUrl("https://maps.app.goo.gl/x", "a")).toBe("https://maps.app.goo.gl/x");
    expect(directionsUrl(null, null)).toBeNull();
  });
});
