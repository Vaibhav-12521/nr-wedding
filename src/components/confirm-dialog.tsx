"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<unknown> | unknown;
};

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", destructive = true, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent className="z-[70] bg-cream sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-taupe">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={destructive ? "bg-destructive text-white hover:bg-destructive/90" : "bg-gold text-cream hover:bg-gold-deep"}
            onClick={async () => {
              setBusy(true);
              try { await onConfirm(); onOpenChange(false); } finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
