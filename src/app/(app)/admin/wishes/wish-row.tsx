"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { runAction } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteWish, setWishStatus } from "../actions";
import { formatDateTime } from "@/lib/format";

export function WishRow({ wish }: { wish: { id: string; name: string; message: string; status: string; created_at: string } }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const act = async (p: ReturnType<typeof deleteWish>, msg: string) => { if (await runAction(p, msg)) router.refresh(); };
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-line font-display text-lg leading-snug">“{wish.message}”</p>
        <p className="mt-1 text-sm text-taupe">- {wish.name} · {formatDateTime(wish.created_at)}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {wish.status === "pending" ? (
          <button type="button" onClick={() => act(setWishStatus(wish.id, "approved"), "Now on the website")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-sm font-medium text-white"><Check className="size-4" /> Approve</button>
        ) : (
          <button type="button" onClick={() => act(setWishStatus(wish.id, "rejected"), "Hidden from the website")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input px-4 text-sm font-medium"><EyeOff className="size-4" /> Hide</button>
        )}
        <button type="button" onClick={() => setConfirm(true)} className="inline-flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Delete">
          <Trash2 className="size-4" />
        </button>
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Delete this blessing?" description={`From ${wish.name}. This can't be undone.`}
        confirmLabel="Delete" onConfirm={() => act(deleteWish(wish.id), "Deleted")} />
    </li>
  );
}
