import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/server";
import { coupleNames, getWedding } from "@/lib/wedding";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured || !z.string().uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  const { data: e } = await createPublicClient().from("wedding_events").select("*").eq("id", id).eq("is_published", true).maybeSingle();
  if (!e?.starts_at) return new Response("This event's date hasn't been announced yet.", { status: 404 });
  const w = await getWedding();
  const end = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 3 * 3600_000).toISOString();
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Neha's Wedding//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@nehas-wedding`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.starts_at)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`${e.title} · ${coupleNames(w)}`)}`,
    e.venue_name || e.address ? `LOCATION:${esc([e.venue_name, e.address].filter(Boolean).join(", "))}` : "",
    e.description ? `DESCRIPTION:${esc(e.description)}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.title.replace(/[^\w -]/g, "").trim() || "event"}.ics"`,
    },
  });
}
