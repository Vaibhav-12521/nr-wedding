import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Panel } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { DeleteRsvpButton } from "./delete-button";

export const metadata: Metadata = { title: "RSVPs · Admin" };

export default async function RsvpsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: rsvps }, { data: events }] = await Promise.all([
    supabase.from("rsvps").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("wedding_events").select("id, title"),
  ]);
  const title = new Map((events ?? []).map((e) => [e.id, e.title]));
  const yes = (rsvps ?? []).filter((r) => r.attending);
  const guests = yes.reduce((s, r) => s + r.guests_count, 0);

  return (
    <Panel title="RSVPs" description={`${rsvps?.length ?? 0} responses · ${yes.length} attending · ${guests} guests in total`}
      actions={
        <a href="/api/admin/rsvps" className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/50 px-4 text-sm font-medium text-gold-deep hover:bg-blush/30">
          <Download className="size-4" /> Export CSV
        </a>
      }>
      {rsvps?.length ? (
        <div className="-mx-5 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-taupe">
              <tr><th className="px-5 py-2 sm:px-2">Guest</th><th className="px-2">Reply</th><th className="px-2">Guests</th><th className="px-2">Events</th><th className="px-2">Message</th><th className="px-2">Received</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-champagne/30 align-top">
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 sm:px-2"><p className="font-medium">{r.name}</p><p className="text-taupe">{[r.email, r.phone].filter(Boolean).join(" · ")}</p></td>
                  <td className="px-2 py-3">{r.attending ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">Attending</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-taupe">Declined</span>}</td>
                  <td className="px-2 py-3 tabular-nums">{r.guests_count}</td>
                  <td className="px-2 py-3 text-taupe">{(r.event_ids as string[]).map((id) => title.get(id)).filter(Boolean).join(", ") || "-"}</td>
                  <td className="max-w-xs px-2 py-3 text-taupe">{r.message || "-"}</td>
                  <td className="px-2 py-3 text-taupe">{formatDateTime(r.created_at)}</td>
                  <td className="px-2 py-3"><DeleteRsvpButton id={r.id} name={r.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-taupe">No responses yet.</p>
      )}
    </Panel>
  );
}
