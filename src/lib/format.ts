const TZ = process.env.NEXT_PUBLIC_WEDDING_TIMEZONE || "Asia/Kolkata";

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...opts }).format(new Date(iso));
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export function labelDate(label: string | null | undefined): Date | null {
  const m = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i.exec(label?.trim() ?? "");
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  if (month < 0) return null;
  const iso = `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}T12:00:00+05:30`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function eventDateLabel(e: { starts_at: string | null; date_label: string | null }) {
  const full: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  if (e.starts_at) return formatDate(e.starts_at, full);
  const d = labelDate(e.date_label);
  if (d) return formatDate(d.toISOString(), full);
  return e.date_label ? `${e.date_label} · year to be confirmed` : "Date to be announced";
}

export function eventDayParts(e: { starts_at: string | null; date_label: string | null }) {
  const iso = e.starts_at ?? labelDate(e.date_label)?.toISOString();
  if (!iso) return null;
  return {
    day: formatDate(iso, { day: "2-digit" })!,
    month: formatDate(iso, { month: "short" })!,
    year: formatDate(iso, { year: "numeric" })!,
    weekday: formatDate(iso, { weekday: "long" })!,
  };
}

export function directionsUrl(mapsUrl: string | null, address: string | null, venue?: string | null) {
  if (mapsUrl) return mapsUrl;
  const q = [venue, address].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : null;
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "album";
}
