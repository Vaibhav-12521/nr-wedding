import { apiAdmin } from "@/lib/auth";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  const auth = await apiAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth.session;
  const [{ data: rsvps }, { data: events }] = await Promise.all([
    supabase.from("rsvps").select("*").order("created_at").limit(5000),
    supabase.from("wedding_events").select("id, title"),
  ]);
  const title = new Map((events ?? []).map((e) => [e.id, e.title]));
  const lines = [
    ["Name", "Email", "Phone", "Attending", "Guests", "Events", "Message", "Received"].map(cell).join(","),
    ...(rsvps ?? []).map((r) => [
      r.name, r.email, r.phone, r.attending ? "Yes" : "No", r.guests_count,
      (r.event_ids as string[]).map((id) => title.get(id)).filter(Boolean).join("; "), r.message, r.created_at,
    ].map(cell).join(",")),
  ];
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rsvps-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
