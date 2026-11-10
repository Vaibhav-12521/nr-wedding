"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { ALLOWED_TYPES, LIMITS, env } from "@/lib/env";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "queued" | "uploading" | "processing" | "done" | "failed";
type Item = {
  key: string;
  file: File;
  preview: string;
  status: Status;
  progress: number;
  error?: string;
  final?: boolean;
  path?: string;
  uploadUrl?: string;
  tries: number;
};

const PARALLEL = 3;
const SIGN_BATCH = 20;
const MAX_TRIES = 4;

function putWithProgress(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    if (env.supabaseAnonKey) xhr.setRequestHeader("apikey", env.supabaseAnonKey);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(Object.assign(new Error(`storage ${xhr.status}`), { status: xhr.status })));
    xhr.onerror = () => reject(Object.assign(new Error("network"), { status: 0 }));
    xhr.send(file);
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Uploader({ albums, defaultAlbum, onUploaded, compact }: {
  albums: { id: string; name: string; slug: string }[];
  defaultAlbum?: string;
  onUploaded?: (ids: string[]) => void;
  compact?: boolean;
}) {
  const [albumId, setAlbumId] = useState(defaultAlbum && albums.some((a) => a.id === defaultAlbum) ? defaultAlbum : albums[0]?.id ?? "");
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const itemsRef = useRef(items);
  const input = useRef<HTMLInputElement>(null);
  const uploadedIds = useRef<string[]>([]);

  const patch = useCallback((key: string, p: Partial<Item>) => {
    setItems((list) => {
      const next = list.map((i) => (i.key === key ? { ...i, ...p } : i));
      itemsRef.current = next;
      return next;
    });
  }, []);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const add = (files: FileList | File[]) => {
    const next: Item[] = [];
    for (const file of Array.from(files)) {
      const base = { key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file, preview: URL.createObjectURL(file), progress: 0, tries: 0 };
      if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
        next.push({ ...base, status: "failed", final: true, error: "Only JPG, PNG and WebP photos are supported." });
      } else if (file.size > LIMITS.maxPhotoBytes) {
        next.push({ ...base, status: "failed", final: true, error: `Too large (${formatBytes(file.size)}). The limit is 50 MB.` });
      } else {
        next.push({ ...base, status: "queued" });
      }
    }
    setItems((list) => [...list, ...next]);
  };

  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  useEffect(() => {
    if (!running) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [running]);

  const signBatch = async (batch: Item[]) => {
    const r = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId, files: batch.map((i) => ({ name: i.file.name, size: i.file.size, type: i.file.type })) }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const final = r.status === 403 || r.status === 400;
      batch.forEach((i) => patch(i.key, { status: final ? "failed" : "queued", final, error: data.error ?? "Couldn't start the upload." }));
      if (!final) await sleep(r.status === 429 ? 20000 : 3000);
      return false;
    }
    (data.files as { path?: string; uploadUrl?: string; error?: string }[]).forEach((f, idx) => {
      const it = batch[idx];
      if (f.error) patch(it.key, { status: "failed", final: true, error: f.error });
      else { it.path = f.path; it.uploadUrl = f.uploadUrl; patch(it.key, { path: f.path, uploadUrl: f.uploadUrl }); }
    });
    return true;
  };

  const processOne = async (it: Item) => {
    for (let attempt = it.tries; attempt < MAX_TRIES; attempt++) {
      try {
        if (!it.uploadUrl) {
          const ok = await signBatch([it]);
          const fresh = itemsRef.current.find((x) => x.key === it.key);
          if (!ok || !it.uploadUrl || fresh?.final) return;
        }
        patch(it.key, { status: "uploading", error: undefined, tries: attempt });
        await putWithProgress(it.uploadUrl!, it.file, (p) => patch(it.key, { progress: p }));
        patch(it.key, { status: "processing", progress: 1 });
        const r = await fetch("/api/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId, path: it.path, filename: it.file.name }),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok) { patch(it.key, { status: "done" }); if (data.id) uploadedIds.current.push(data.id); return; }
        if (r.status >= 400 && r.status < 500 && r.status !== 409 && r.status !== 429) {
          patch(it.key, { status: "failed", final: true, error: data.error ?? "This photo was rejected." });
          return;
        }
        throw Object.assign(new Error(data.error ?? "server"), { status: r.status });
      } catch (e) {
        const status = (e as { status?: number }).status ?? 0;
        if (status === 400 || status === 403 || status === 409) { it.uploadUrl = undefined; it.path = undefined; }
        patch(it.key, { status: "uploading", progress: 0, error: `Connection problem - retrying (${attempt + 1}/${MAX_TRIES})…` });
        await sleep(1000 * 2 ** attempt);
      }
    }
    patch(it.key, { status: "failed", error: "Upload failed. Check your connection and retry." });
  };

  const start = async () => {
    if (!albumId) return toast.error("Choose an album first.");
    setRunning(true);
    uploadedIds.current = [];
    const queue = itemsRef.current.filter((i) => i.status === "queued").map((i) => ({ ...i }));
    for (let i = 0; i < queue.length; i += SIGN_BATCH) await signBatch(queue.slice(i, i + SIGN_BATCH));
    const todo = queue.filter((i) => !itemsRef.current.find((x) => x.key === i.key)?.final);
    let cursor = 0;
    await Promise.all(Array.from({ length: PARALLEL }, async () => {
      while (cursor < todo.length) await processOne(todo[cursor++]);
    }));
    setRunning(false);
    const done = itemsRef.current.filter((i) => i.status === "done").length;
    const failed = itemsRef.current.filter((i) => i.status === "failed").length;
    if (failed) toast.warning(`${done} uploaded, ${failed} failed`);
    else toast.success(`${done} photo${done === 1 ? "" : "s"} uploaded`);
    if (uploadedIds.current.length) onUploaded?.([...uploadedIds.current]);
  };

  const retryFailed = () => {
    setItems((list) => list.map((i) => (i.status === "failed" && !i.final ? { ...i, status: "queued", error: undefined, progress: 0, tries: 0 } : i)));
    setTimeout(start, 0);
  };

  const stats = useMemo(() => {
    const total = items.filter((i) => !i.final).reduce((s, i) => s + i.file.size, 0);
    const sent = items.filter((i) => !i.final).reduce((s, i) => s + i.file.size * (i.status === "done" || i.status === "processing" ? 1 : i.progress), 0);
    return {
      queued: items.filter((i) => i.status === "queued").length,
      done: items.filter((i) => i.status === "done").length,
      failed: items.filter((i) => i.status === "failed").length,
      retryable: items.filter((i) => i.status === "failed" && !i.final).length,
      pct: total ? Math.round((sent / total) * 100) : 0,
    };
  }, [items]);
  const album = albums.find((a) => a.id === albumId);

  if (!albums.length) {
    return (
      <div className="card-frame paper mx-auto mt-10 max-w-lg p-10 text-center">
        <p className="relative z-10 font-display text-2xl">No albums to upload to yet</p>
        <p className="relative z-10 mt-2 text-taupe">Ask the family to create an album or give you upload access.</p>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "mx-auto max-w-4xl pb-32"}>
      <label className="block max-w-sm">
        <span className="text-sm font-medium">Add photos to album</span>
        <select value={albumId} onChange={(e) => setAlbumId(e.target.value)} disabled={running}
          className="mt-1.5 h-12 w-full rounded-xl border border-input bg-cream px-4 text-base outline-none focus:border-gold focus:ring-4 focus:ring-champagne/25">
          {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); }}
        className={cn("mt-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition",
          dragging ? "border-gold bg-blush/30" : "border-champagne/60 bg-cream")}
      >
        <UploadCloud className="size-10 text-gold" />
        <p className="mt-3 font-display text-2xl">Drop photos here</p>
        <p className="mt-1 text-sm text-taupe">JPG, PNG or WebP · up to 50 MB each · original quality is kept</p>
        <button type="button" onClick={() => input.current?.click()} disabled={running}
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-gold px-6 font-medium text-cream hover:bg-gold-deep disabled:opacity-60">
          <ImagePlus className="size-5" /> Choose photos
        </button>
        <input ref={input} type="file" multiple accept={ALLOWED_TYPES.join(",")} className="sr-only"
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      </div>

      {items.length > 0 && (
        <>
          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mt-6 rounded-2xl border border-champagne/50 bg-cream/95 p-3 shadow-lg backdrop-blur md:bottom-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium" aria-live="polite">
                {stats.done} of {items.length} uploaded{stats.failed ? ` · ${stats.failed} failed` : ""}
              </p>
              <div className="ml-auto flex gap-2">
                {stats.retryable > 0 && !running && (
                  <button type="button" onClick={retryFailed} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-gold/50 px-4 text-sm font-medium text-gold-deep">
                    <RotateCcw className="size-4" /> Retry failed
                  </button>
                )}
                {stats.queued > 0 && (
                  <button type="button" onClick={start} disabled={running}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gold px-5 text-sm font-medium text-cream hover:bg-gold-deep disabled:opacity-60">
                    {running ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                    {running ? "Uploading…" : `Upload ${stats.queued} photo${stats.queued === 1 ? "" : "s"}`}
                  </button>
                )}
                {!running && stats.done > 0 && album && (
                  <Link href={`/albums/${album.slug}`} className="inline-flex h-10 items-center rounded-full bg-gold px-5 text-sm font-medium text-cream">View album</Link>
                )}
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-beige" role="progressbar" aria-valuenow={stats.pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-champagne to-gold transition-all" style={{ width: `${stats.pct}%` }} />
            </div>
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {items.map((i) => (
              <li key={i.key} className="flex items-center gap-3 rounded-2xl border border-champagne/40 bg-cream p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.preview} alt="" className="size-14 shrink-0 rounded-xl bg-beige object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.file.name}</p>
                  <p className={cn("truncate text-xs", i.status === "failed" ? "text-destructive" : "text-taupe")}>
                    {i.error ?? (i.status === "done" ? "Uploaded" : i.status === "processing" ? "Creating previews…" : i.status === "uploading" ? `${Math.round(i.progress * 100)}% of ${formatBytes(i.file.size)}` : formatBytes(i.file.size))}
                  </p>
                  {(i.status === "uploading" || i.status === "processing") && (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-beige">
                      <div className={cn("h-full rounded-full bg-gold transition-all", i.status === "processing" && "animate-pulse")} style={{ width: `${Math.max(4, i.progress * 100)}%` }} />
                    </div>
                  )}
                </div>
                {i.status === "done" ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  : i.status === "failed" ? <AlertCircle className="size-5 shrink-0 text-destructive" />
                  : i.status === "queued" && !running ? (
                    <button type="button" onClick={() => setItems((l) => l.filter((x) => x.key !== i.key))} className="inline-flex size-9 items-center justify-center rounded-full text-taupe hover:bg-muted" aria-label={`Remove ${i.file.name}`}>
                      <Trash2 className="size-4" />
                    </button>
                  ) : i.status !== "queued" ? <Loader2 className="size-5 shrink-0 animate-spin text-gold" /> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
