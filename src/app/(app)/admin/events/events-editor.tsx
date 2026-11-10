"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { ActionForm, inputCls, L, runAction, Submit, textareaCls, Toggle } from "@/components/admin/admin-ui";
import { ImageField, toLocalInput } from "@/components/admin/editors";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteEvent, saveEvent } from "../actions";
import { eventDateLabel } from "@/lib/format";
import type { WeddingEvent } from "@/lib/types";

function EventForm({ e, onDone }: { e?: WeddingEvent; onDone?: () => void }) {
  const router = useRouter();
  return (
    <ActionForm action={saveEvent} resetOnSuccess={!e} onSuccess={() => { router.refresh(); onDone?.(); }} className="grid gap-4 sm:grid-cols-2">
      {(pending) => (
        <>
          {e && <input type="hidden" name="id" value={e.id} />}
          <L label="Title"><input name="title" required defaultValue={e?.title} className={inputCls} /></L>
          <L label="Date label" hint="Shown until an exact date is set, e.g. “31 January”."><input name="date_label" defaultValue={e?.date_label ?? ""} className={inputCls} /></L>
          <L label="Starts (IST)"><input type="datetime-local" name="starts_at" defaultValue={toLocalInput(e?.starts_at ?? null)} className={inputCls} /></L>
          <L label="Ends (IST)"><input type="datetime-local" name="ends_at" defaultValue={toLocalInput(e?.ends_at ?? null)} className={inputCls} /></L>
          <L label="Venue name"><input name="venue_name" defaultValue={e?.venue_name ?? ""} className={inputCls} /></L>
          <L label="Address"><input name="address" defaultValue={e?.address ?? ""} className={inputCls} /></L>
          <L label="Google Maps link" hint="Optional - otherwise directions use the address."><input name="maps_url" type="url" defaultValue={e?.maps_url ?? ""} className={inputCls} /></L>
          <L label="Dress code"><input name="dress_code" defaultValue={e?.dress_code ?? ""} className={inputCls} /></L>
          <L label="Description" className="sm:col-span-2"><textarea name="description" defaultValue={e?.description ?? ""} rows={3} className={textareaCls} /></L>
          <div className="sm:col-span-2"><ImageField name="image_path" folder="events" initial={e?.image_path ?? null} label="Event photograph" /></div>
          <L label="Order" hint="Lower numbers come first."><input type="number" name="sort_order" min={0} max={999} defaultValue={e?.sort_order ?? 10} className={inputCls} /></L>
          <Toggle name="is_published" label="Show on the website" defaultChecked={e?.is_published ?? true} />
          <div className="sm:col-span-2"><Submit pending={pending}>{e ? "Save event" : "Add event"}</Submit></div>
        </>
      )}
    </ActionForm>
  );
}

export function EventsEditor({ events }: { events: WeddingEvent[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<WeddingEvent | null>(null);
  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div key={e.id} className="rounded-2xl border border-champagne/40 bg-cream">
          <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}
            className="flex w-full items-center gap-3 p-4 text-left">
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl">{e.title}{!e.is_published && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-sans text-xs text-taupe">Hidden</span>}</p>
              <p className="text-sm text-taupe">{eventDateLabel(e)}{e.venue_name ? ` · ${e.venue_name}` : ""}</p>
            </div>
            <ChevronDown className={`size-5 text-gold transition ${open === e.id ? "rotate-180" : ""}`} />
          </button>
          {open === e.id && (
            <div className="border-t border-champagne/30 p-4">
              <EventForm e={e} />
              <button type="button" onClick={() => setToDelete(e)} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 className="size-4" /> Delete event
              </button>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="rounded-2xl border border-gold/50 bg-cream p-4"><EventForm onDone={() => setAdding(false)} /></div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-gold/60 px-5 font-medium text-gold-deep hover:bg-blush/20">
          <Plus className="size-4" /> Add an event
        </button>
      )}

      <ConfirmDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)} title={`Delete “${toDelete?.title}”?`}
        description="The event will be removed from the website. Albums linked to it are kept." confirmLabel="Delete"
        onConfirm={async () => { if (toDelete && (await runAction(deleteEvent(toDelete.id), "Event deleted"))) router.refresh(); }} />
    </div>
  );
}
