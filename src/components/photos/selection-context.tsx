"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Ctx = {
  selected: Set<string>;
  ready: boolean;
  isSelected: (id: string) => boolean;
  set: (ids: string[], on: boolean) => void;
  toggle: (id: string) => void;
  clear: () => void;
};

const SelectionContext = createContext<Ctx | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const pending = useRef(Promise.resolve());

  useEffect(() => {
    fetch("/api/selection", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((d: { ids: string[] }) => setSelected(new Set(d.ids)))
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((init: RequestInit, rollback: () => void) => {
    pending.current = pending.current.then(async () => {
      const r = await fetch("/api/selection", { ...init, headers: { "Content-Type": "application/json" } }).catch(() => null);
      if (!r?.ok) {
        rollback();
        toast.error("Couldn't save your selection. Please check your connection.");
      }
    });
  }, []);

  const current = useRef(selected);
  const commit = useCallback((next: Set<string>) => {
    current.current = next;
    setSelected(next);
  }, []);
  useEffect(() => { current.current = selected; }, [selected]);

  const set = useCallback((ids: string[], on: boolean) => {
    if (!ids.length) return;
    const before = current.current;
    const next = new Set(before);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    commit(next);
    for (let i = 0; i < ids.length; i += 2000) {
      persist({ method: "POST", body: JSON.stringify({ ids: ids.slice(i, i + 2000), on }) }, () => commit(before));
    }
  }, [persist, commit]);

  const toggle = useCallback((id: string) => set([id], !current.current.has(id)), [set]);

  const clear = useCallback(() => {
    const before = current.current;
    commit(new Set());
    persist({ method: "DELETE" }, () => commit(before));
  }, [persist, commit]);

  const value = useMemo<Ctx>(() => ({
    selected, ready, isSelected: (id) => selected.has(id), set, toggle, clear,
  }), [selected, ready, set, toggle, clear]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used inside SelectionProvider");
  return ctx;
}
