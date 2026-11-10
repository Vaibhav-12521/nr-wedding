"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check, CheckSquare, Download, Globe, Heart, ImagePlus, Loader2, Search, SlidersHorizontal, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Lightbox } from "@/components/gallery/lightbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SelectionBar } from "@/components/photos/selection-bar";
import { useSelection } from "@/components/photos/selection-context";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/types";
import type { PhotoFilters } from "@/lib/photos";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };
type Props = {
  initial: { photos: GalleryPhoto[]; total: number; hasMore: boolean };
  filters: PhotoFilters;
  locked?: Partial<PhotoFilters>;
  albums: Option[];
  events: Option[];
  uploaders: Option[];
  uploadHref?: string | null;
  showViews?: boolean;
};

const VIEWS: { key: PhotoFilters["view"]; label: string }[] = [
  { key: "all", label: "All Photos" },
  { key: "latest", label: "Latest Uploads" },
  { key: "favourites", label: "Favourites" },
  { key: "mine", label: "My Uploads" },
  { key: "selected", label: "Selected" },
];

function toQuery(f: Partial<PhotoFilters>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === "") continue;
    if ((k === "view" && v === "all") || (k === "sort" && v === "newest") || (k === "page" && v === 0)) continue;
    q.set(k, String(v));
  }
  return q.toString();
}

const selectClass = "h-11 w-full rounded-xl border border-input bg-cream px-3 text-sm text-cocoa outline-none focus:border-gold focus:ring-4 focus:ring-champagne/25";

export function PhotoBrowser({ initial, filters: initialFilters, locked = {}, albums, events, uploaders, uploadHref, showViews = true }: Props) {
  const [filters, setFilters] = useState<PhotoFilters>({ ...initialFilters, ...locked, page: 0 });
  const [photos, setPhotos] = useState(initial.photos);
  const [total, setTotal] = useState(initial.total);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(initialFilters.q ?? "");
  const [toDelete, setToDelete] = useState<GalleryPhoto | null>(null);
  const { selected, isSelected, toggle } = useSelection();
  const request = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const load = useCallback(async (f: PhotoFilters, p: number) => {
    const id = ++request.current;
    setLoading(true);
    setError(false);
    try {
      const r = await fetch(`/api/photos?${toQuery({ ...f, page: p })}`, { cache: "no-store" });
      if (!r.ok) throw new Error();
      const data = (await r.json()) as typeof initial;
      if (id !== request.current) return;
      setPhotos((prev) => (p === 0 ? data.photos : [...prev, ...data.photos.filter((x) => !prev.some((y) => y.id === x.id))]));
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(p);
    } catch {
      if (id === request.current) setError(true);
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const shown: Partial<PhotoFilters> = { ...filters };
    for (const k of Object.keys(locked) as (keyof PhotoFilters)[]) delete shown[k];
    const qs = toQuery(shown);
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    load(filters, 0);
  }, [filters, load, locked]);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q ?? "") === search.trim() ? f : { ...f, q: search.trim() || undefined }), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && !error) load(filters, page + 1);
  }, [hasMore, loading, error, load, filters, page]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  const update = (patch: Partial<PhotoFilters>) => setFilters((f) => ({ ...f, ...patch, page: 0 }));
  const activeFilterCount = (["album", "event", "uploader", "date"] as const).filter((k) => filters[k] && !(k in locked)).length + (filters.sort !== "newest" ? 1 : 0);

  const toggleFavourite = async (p: GalleryPhoto) => {
    const on = !p.favourite;
    setPhotos((list) => list.map((x) => (x.id === p.id ? { ...x, favourite: on } : x)));
    const r = await fetch("/api/favourites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [p.id], on }) }).catch(() => null);
    if (!r?.ok) {
      setPhotos((list) => list.map((x) => (x.id === p.id ? { ...x, favourite: !on } : x)));
      toast.error("Couldn't update favourites.");
    }
  };

  const requestPublic = async (p: GalleryPhoto) => {
    const r = await fetch(`/api/photos/${p.id}/request-public`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (r.ok) {
      setPhotos((list) => list.map((x) => (x.id === p.id ? { ...x, approval: "pending" } : x)));
      toast.success("Sent to the family for approval");
    } else toast.error((await r.json().catch(() => ({}))).error ?? "Couldn't submit this photo.");
  };

  const remove = async (p: GalleryPhoto) => {
    const r = await fetch(`/api/photos/${p.id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error((await r.json().catch(() => ({}))).error ?? "Couldn't delete this photo.");
      return;
    }
    const next = photos.filter((x) => x.id !== p.id);
    setPhotos(next);
    setIndex((i) => (i === null || !next.length ? null : Math.min(i, next.length - 1)));
    setTotal((t) => t - 1);
    toast.success("Photo deleted");
  };

  const visibleIds = useMemo(() => photos.map((p) => p.id), [photos]);
  const albumOptions = albums.filter(() => !("album" in locked));

  return (
    <div className="pb-40 md:pb-28">
      <div className="sticky top-16 z-20 -mx-4 border-b border-champagne/25 bg-ivory/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {showViews && (
          <div role="tablist" aria-label="Photo views" className="-mx-1 flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none]">
            {VIEWS.map((v) => (
              <button key={v.key} role="tab" type="button" aria-selected={filters.view === v.key} onClick={() => update({ view: v.key })}
                className={cn("h-9 shrink-0 rounded-full px-4 text-sm font-medium transition",
                  filters.view === v.key ? "bg-gold text-cream" : "bg-cream text-cocoa/80 ring-1 ring-champagne/40 hover:ring-gold")}>
                {v.label}{v.key === "selected" && selected.size > 0 && <span className="ml-1.5 tabular-nums opacity-80">{selected.size}</span>}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search photos</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-taupe" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or title" type="search"
              className="h-11 w-full rounded-full border border-input bg-cream pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-4 focus:ring-champagne/25" />
          </label>
          <button type="button" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}
            className={cn("relative inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium",
              showFilters ? "border-gold bg-blush/30 text-gold-deep" : "border-input bg-cream text-cocoa")}>
            <SlidersHorizontal className="size-4" /><span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-rose text-[0.7rem] text-white">{activeFilterCount}</span>}
          </button>
          <button type="button" onClick={() => setSelectMode((v) => !v)} aria-pressed={selectMode}
            className={cn("inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium md:hidden",
              selectMode ? "border-gold bg-gold text-cream" : "border-input bg-cream text-cocoa")}>
            <CheckSquare className="size-4" /> {selectMode ? "Done" : "Select"}
          </button>
          {uploadHref && (
            <Link href={uploadHref} className="hidden h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-medium text-cream hover:bg-gold-deep md:inline-flex">
              <ImagePlus className="size-4" /> Upload
            </Link>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {albumOptions.length > 0 && (
              <label className="block text-xs font-medium text-taupe">Album
                <select className={selectClass} value={filters.album ?? ""} onChange={(e) => update({ album: e.target.value || undefined })}>
                  <option value="">All albums</option>
                  {albumOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
            )}
            {events.length > 0 && !("event" in locked) && (
              <label className="block text-xs font-medium text-taupe">Wedding event
                <select className={selectClass} value={filters.event ?? ""} onChange={(e) => update({ event: e.target.value || undefined })}>
                  <option value="">All events</option>
                  {events.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
            )}
            <label className="block text-xs font-medium text-taupe">Uploaded by
              <select className={selectClass} value={filters.uploader ?? ""} onChange={(e) => update({ uploader: e.target.value || undefined })}>
                <option value="">Everyone</option>
                {uploaders.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-taupe">Upload date
              <input type="date" className={selectClass} value={filters.date ?? ""} onChange={(e) => update({ date: e.target.value || undefined })} />
            </label>
            <label className="block text-xs font-medium text-taupe">Sort
              <select className={selectClass} value={filters.sort} onChange={(e) => update({ sort: e.target.value as PhotoFilters["sort"] })}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">File name</option>
              </select>
            </label>
            {activeFilterCount > 0 && (
              <button type="button" onClick={() => update({ album: locked.album, event: undefined, uploader: undefined, date: undefined, sort: "newest" })}
                className="col-span-full justify-self-start text-sm font-medium text-gold-deep underline underline-offset-4">Clear filters</button>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-taupe" aria-live="polite">
        {loading && page === 0 ? "Loading…" : `${total} photo${total === 1 ? "" : "s"}`}
      </p>

      {loading && page === 0 && photos.length === 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i}><div className="aspect-square animate-pulse rounded-xl bg-beige" /><div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-beige" /></li>
          ))}
        </ul>
      ) : photos.length === 0 ? (
        <div className="card-frame paper mx-auto mt-10 max-w-lg p-10 text-center">
          <p className="relative z-10 font-display text-2xl">{filters.view === "favourites" ? "No favourites yet" : filters.view === "selected" ? "Nothing selected" : filters.view === "mine" ? "You haven't uploaded any photos yet" : "No photos here yet"}</p>
          <p className="relative z-10 mt-2 text-taupe">
            {filters.view === "favourites" ? "Tap the heart on any photo to keep it here." : filters.view === "selected" ? "Tick photos to collect them here, then download them together." : "Try another filter, or add some photos."}
          </p>
          {uploadHref && filters.view !== "favourites" && filters.view !== "selected" && (
            <Link href={uploadHref} className="relative z-10 mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gold px-6 font-medium text-cream hover:bg-gold-deep"><ImagePlus className="size-4" /> Upload photos</Link>
          )}
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p, i) => {
            const sel = isSelected(p.id);
            return (
              <li key={p.id} className="group">
                <div className={cn("relative aspect-square overflow-hidden rounded-xl bg-beige ring-offset-2 ring-offset-ivory transition", sel && "ring-[3px] ring-gold")}>
                  <button type="button" className="absolute inset-0 outline-none focus-visible:ring-4 focus-visible:ring-champagne"
                    onClick={() => (selectMode ? toggle(p.id) : setIndex(i))}
                    aria-label={selectMode ? `${sel ? "Deselect" : "Select"} ${p.title ?? p.filename}` : `Open ${p.title ?? p.filename}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumbUrl} alt="" loading="lazy" decoding="async"
                      className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]", sel && "scale-[0.97]")} />
                  </button>
                  <button type="button" onClick={() => toggle(p.id)} aria-pressed={sel} aria-label={sel ? "Deselect photo" : "Select photo"}
                    className={cn("absolute left-2 top-2 flex size-8 items-center justify-center rounded-full border-2 shadow transition",
                      sel ? "border-gold bg-gold text-cream" : "border-white/90 bg-black/20 text-transparent backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
                      (selectMode || selected.size > 0) && "md:opacity-100")}>
                    <Check className="size-4" strokeWidth={3} />
                  </button>
                  <button type="button" onClick={() => toggleFavourite(p)} aria-pressed={p.favourite} aria-label={p.favourite ? "Remove from favourites" : "Add to favourites"}
                    className={cn("absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition",
                      p.favourite ? "text-rose opacity-100" : "text-white md:opacity-0 md:group-hover:opacity-100")}>
                    <Heart className={cn("size-4", p.favourite && "fill-current")} />
                  </button>
                  {p.visibility === "public" && <span className="absolute bottom-2 left-2 rounded-full bg-black/35 p-1 text-white backdrop-blur-sm" title="In the public gallery"><Globe className="size-3.5" /></span>}
                </div>
                <div className="mt-1.5 flex items-start gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8rem] font-medium text-cocoa">{p.title || p.filename}</p>
                    <p className="truncate text-[0.72rem] text-taupe">{p.uploaderName ?? "Guest"} · {formatDate(p.createdAt, { day: "numeric", month: "short" })}</p>
                  </div>
                  <a href={`/api/photos/${p.id}/download`} className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-taupe hover:bg-blush/40 hover:text-gold-deep" aria-label={`Download ${p.filename}`}>
                    <Download className="size-4" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div ref={sentinel} className="h-px" />
      {loading && page > 0 && <p className="mt-6 flex justify-center text-taupe"><Loader2 className="size-5 animate-spin" /></p>}
      {error && (
        <p className="mt-6 text-center text-sm text-destructive">
          Couldn&apos;t load photos. <button type="button" className="underline" onClick={() => load(filters, photos.length ? page + 1 : 0)}>Try again</button>
        </p>
      )}

      <SelectionBar visibleIds={selectMode || selected.size > 0 ? visibleIds : []}
        onFavourited={(ids) => setPhotos((list) => list.map((x) => (ids.includes(x.id) ? { ...x, favourite: true } : x)))} />

      <Lightbox
        photos={photos}
        index={index}
        onIndexChange={setIndex}
        onNearEnd={loadMore}
        actions={(p) => (
          <>
            <button type="button" onClick={() => toggle(p.id)} aria-pressed={isSelected(p.id)}
              className={cn("inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10", isSelected(p.id) && "bg-gold text-cream hover:bg-gold")}
              aria-label={isSelected(p.id) ? "Deselect" : "Select"}>
              <CheckSquare className="size-5" />
            </button>
            <button type="button" onClick={() => toggleFavourite(p)} aria-pressed={p.favourite}
              className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10" aria-label={p.favourite ? "Remove from favourites" : "Add to favourites"}>
              <Heart className={cn("size-5", p.favourite && "fill-rose text-rose")} />
            </button>
            <a href={`/api/photos/${p.id}/download`} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Download original">
              <Download className="size-5" />
            </a>
          </>
        )}
        info={(p) => (
          <div className="space-y-5">
            <dl className="space-y-3">
              <div><dt className="text-ivory/50">File</dt><dd className="break-all">{p.filename}</dd></div>
              {p.title && <div><dt className="text-ivory/50">Title</dt><dd>{p.title}</dd></div>}
              <div><dt className="text-ivory/50">Album</dt><dd>{p.albumName}</dd></div>
              <div><dt className="text-ivory/50">Uploaded by</dt><dd>{p.uploaderName ?? "Guest"}</dd></div>
              <div><dt className="text-ivory/50">Uploaded</dt><dd>{formatDateTime(p.createdAt)}</dd></div>
              <div><dt className="text-ivory/50">Original</dt><dd>{formatBytes(p.size)}{p.width && p.height ? ` · ${p.width} × ${p.height}` : ""}</dd></div>
              <div><dt className="text-ivory/50">Public gallery</dt><dd>
                {p.visibility === "public" ? "Shown publicly" : p.approval === "pending" ? "Waiting for approval" : p.approval === "rejected" ? "Not approved" : "Private"}
              </dd></div>
            </dl>
            {p.canDelete && (
              <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                {p.visibility !== "public" && p.approval !== "pending" && (
                  <button type="button" onClick={() => requestPublic(p)} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm hover:bg-white/20">
                    <Globe className="size-4" /> Suggest for public gallery
                  </button>
                )}
                <button type="button" onClick={() => setToDelete(p)} className="inline-flex h-10 items-center gap-2 rounded-full bg-red-500/15 px-4 text-sm text-red-200 hover:bg-red-500/25">
                  <Trash2 className="size-4" /> Delete photo
                </button>
              </div>
            )}
          </div>
        )}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this photo?"
        description={<>“{toDelete?.title || toDelete?.filename}” will be permanently removed for everyone, including the original file. This can&apos;t be undone.</>}
        confirmLabel="Delete"
        onConfirm={() => toDelete && remove(toDelete)}
      />
    </div>
  );
}
