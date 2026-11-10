"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { inputCls, textareaCls } from "@/components/admin/admin-ui";
import { uploadSiteImage } from "@/app/(app)/admin/actions";
import { env, SITE_BUCKET } from "@/lib/env";

type FieldDef = { key: string; label: string; type?: "text" | "textarea" | "select"; options?: [string, string][]; required?: boolean };

export function ListEditor<T extends Record<string, string | undefined>>({ name, fields, initial, addLabel, empty }: {
  name: string; fields: FieldDef[]; initial: T[]; addLabel: string; empty: T;
}) {
  const [items, setItems] = useState<T[]>(initial);
  const update = (i: number, key: string, value: string) => setItems((l) => l.map((x, j) => (j === i ? { ...x, [key]: value } : x)));
  const move = (i: number, d: number) => setItems((l) => {
    const n = [...l];
    const [x] = n.splice(i, 1);
    n.splice(i + d, 0, x);
    return n;
  });
  const clean = items
    .map((it) => Object.fromEntries(Object.entries(it).map(([k, v]) => [k, (v ?? "").trim()]).filter(([, v]) => v)))
    .filter((it) => fields.filter((f) => f.required).every((f) => it[f.key]));

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(clean)} />
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-champagne/40 bg-ivory/60 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className={f.type === "textarea" ? "block sm:col-span-2" : "block"}>
                <span className="text-xs font-medium text-taupe">{f.label}{f.required && " *"}</span>
                {f.type === "textarea" ? (
                  <textarea value={it[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} rows={3} className={textareaCls} />
                ) : f.type === "select" ? (
                  <select value={it[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} className={inputCls}>
                    {f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : (
                  <input value={it[f.key] ?? ""} onChange={(e) => update(i, f.key, e.target.value)} className={inputCls} />
                )}
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-1">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
            <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
            <button type="button" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} className="inline-flex size-8 items-center justify-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Remove"><Trash2 className="size-4" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setItems((l) => [...l, { ...empty }])}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-dashed border-gold/60 px-4 text-sm font-medium text-gold-deep hover:bg-blush/20">
        <Plus className="size-4" /> {addLabel}
      </button>
    </div>
  );
}

const publicUrl = (path: string) => `${env.supabaseUrl}/storage/v1/object/public/${SITE_BUCKET}/${path}`;

export function ImageField({ name, initial, folder, label, portrait }: { name: string; initial: string | null; folder: "hero" | "events" | "couple"; label: string; portrait?: boolean }) {
  const [path, setPath] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const upload = async (file: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    const r = await uploadSiteImage(fd);
    setBusy(false);
    if (r.error || !r.path) toast.error(r.error ?? "Upload failed");
    else { setPath(r.path); toast.success("Image uploaded - remember to save"); }
  };
  return (
    <div>
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={path} />
      <div className="mt-1.5 flex items-center gap-3">
        <div className={`relative overflow-hidden border border-champagne/40 bg-beige ${portrait ? "aspect-[3/4] w-28 rounded-t-full" : "aspect-[16/9] w-48 rounded-xl"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {path && <img src={publicUrl(path)} alt="" className="h-full w-full object-cover" />}
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-cream/70"><Loader2 className="size-5 animate-spin text-gold" /></div>}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold/50 px-3 text-sm font-medium text-gold-deep"><ImagePlus className="size-4" /> {path ? "Replace" : "Upload"}</button>
          {path && <button type="button" onClick={() => setPath("")} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-taupe hover:bg-muted"><X className="size-4" /> Remove</button>}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}

export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600_000);
  return d.toISOString().slice(0, 16);
}
