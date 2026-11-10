import type { Metadata } from "next";
import { Panel } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/auth";
import type { WeddingEvent } from "@/lib/types";
import { EventsEditor } from "./events-editor";

export const metadata: Metadata = { title: "Events · Admin" };

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("wedding_events").select("*").order("sort_order").order("starts_at");
  return (
    <Panel title="Wedding events" description="Each event appears on the Events page, the invitation and the RSVP form.">
      <EventsEditor events={(data ?? []) as WeddingEvent[]} />
    </Panel>
  );
}
