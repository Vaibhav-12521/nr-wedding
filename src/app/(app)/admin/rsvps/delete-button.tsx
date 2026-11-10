"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { runAction } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteRsvp } from "../actions";

export function DeleteRsvpButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10" aria-label={`Delete RSVP from ${name}`}>
        <Trash2 className="size-4" />
      </button>
      <ConfirmDialog open={open} onOpenChange={setOpen} title="Delete this RSVP?" description={`${name}'s response will be removed.`} confirmLabel="Delete"
        onConfirm={async () => { if (await runAction(deleteRsvp(id), "RSVP deleted")) router.refresh(); }} />
    </>
  );
}
