"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { inputCls, runAction } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteAlbum, setAlbumPermission } from "../../actions";

type Person = { id: string; full_name: string; email: string };
type Perm = { user_id: string; can_view: boolean; can_upload: boolean; can_download: boolean };

export function AlbumAccess({ albumId, restricted, people, perms }: { albumId: string; restricted: boolean; people: Person[]; perms: Perm[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState("");
  const byId = new Map(people.map((p) => [p.id, p]));
  const granted = new Set(perms.map((p) => p.user_id));

  const save = async (userId: string, next: Omit<Perm, "user_id"> | null) => {
    if (await runAction(setAlbumPermission(albumId, userId, next), next ? "Access updated" : "Access removed")) router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="text-sm font-medium">Add a person</span>
          <select value={adding} onChange={(e) => setAdding(e.target.value)} className={inputCls}>
            <option value="">Choose a guest…</option>
            {people.filter((p) => !granted.has(p.id)).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email} ({p.email})</option>)}
          </select>
        </label>
        <button type="button" disabled={!adding}
          onClick={async () => { await save(adding, { can_view: true, can_upload: restricted, can_download: true }); setAdding(""); }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 font-medium text-cream hover:bg-gold-deep disabled:opacity-50">
          <UserPlus className="size-4" /> Give access
        </button>
      </div>

      {perms.length ? (
        <ul className="divide-y divide-champagne/30 rounded-xl border border-champagne/30">
          {perms.map((p) => {
            const person = byId.get(p.user_id);
            return (
              <li key={p.user_id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{person?.full_name || person?.email || "Former guest"}</p>
                  <p className="truncate text-xs text-taupe">{person?.email}</p>
                </div>
                {(["can_view", "can_upload", "can_download"] as const).map((k) => (
                  <label key={k} className="inline-flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={p[k]} className="size-4 accent-[#a9813f]"
                      onChange={(e) => save(p.user_id, { can_view: p.can_view, can_upload: p.can_upload, can_download: p.can_download, [k]: e.target.checked })} />
                    {k === "can_view" ? "View" : k === "can_upload" ? "Upload" : "Download"}
                  </label>
                ))}
                <button type="button" onClick={() => save(p.user_id, null)} className="inline-flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Remove access">
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-taupe">{restricted ? "Nobody has been given access yet - only admins can see this album." : "No individual settings."}</p>
      )}
    </div>
  );
}

export function DeleteAlbum({ id, name, count }: { id: string; name: string; count: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-destructive/10 px-5 font-medium text-destructive hover:bg-destructive/20">
        <Trash2 className="size-4" /> Delete album
      </button>
      <ConfirmDialog open={open} onOpenChange={setOpen} title={`Delete “${name}”?`} confirmLabel="Delete album"
        description={<>This permanently deletes the album and its <strong>{count}</strong> photo{count === 1 ? "" : "s"} for everyone, including the original files.</>}
        onConfirm={async () => { if (await runAction(deleteAlbum(id))) router.push("/admin/albums"); }} />
    </>
  );
}
