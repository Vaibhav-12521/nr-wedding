"use client";

import { useRouter } from "next/navigation";
import { ActionForm, inputCls, L, Submit, textareaCls, Toggle } from "@/components/admin/admin-ui";
import { saveAlbum } from "../actions";
import type { Album } from "@/lib/types";

export function AlbumForm({ album, events, onDone }: { album?: Album; events: { id: string; title: string }[]; onDone?: () => void }) {
  const router = useRouter();
  return (
    <ActionForm action={saveAlbum} resetOnSuccess={!album} onSuccess={() => { router.refresh(); onDone?.(); }} className="grid gap-4 sm:grid-cols-2">
      {(pending) => (
        <>
          {album && <input type="hidden" name="id" value={album.id} />}
          <L label="Album name"><input name="name" required maxLength={80} defaultValue={album?.name} className={inputCls} /></L>
          <L label="Wedding event" hint="Lets guests filter photos by event.">
            <select name="event_id" defaultValue={album?.event_id ?? ""} className={inputCls}>
              <option value="">- None -</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </L>
          <L label="Description" className="sm:col-span-2"><textarea name="description" maxLength={500} defaultValue={album?.description ?? ""} className={textareaCls} rows={2} /></L>
          <L label="Who can see it" className="sm:col-span-2">
            <select name="visibility" defaultValue={album?.visibility ?? "members"} className={inputCls}>
              <option value="members">All invited guests</option>
              <option value="restricted">Only people I choose</option>
              <option value="public">All guests, and listed on the public site (only approved photos are ever public)</option>
            </select>
          </L>
          <Toggle name="allow_uploads" label="Guests can upload" defaultChecked={album?.allow_uploads ?? true}
            hint="For 'only people I choose' albums, upload rights are set per person." />
          <Toggle name="allow_downloads" label="Guests can download originals" defaultChecked={album?.allow_downloads ?? true} />
          <div className="sm:col-span-2"><Submit pending={pending}>{album ? "Save album" : "Create album"}</Submit></div>
        </>
      )}
    </ActionForm>
  );
}
