"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/app/(app)/admin/actions";
import { cn } from "@/lib/utils";

export const inputCls = "mt-1.5 block h-11 w-full rounded-xl border border-input bg-cream px-3.5 text-[0.95rem] text-cocoa outline-none transition focus:border-gold focus:ring-4 focus:ring-champagne/25 disabled:opacity-60";
export const textareaCls = cn(inputCls, "h-auto min-h-24 py-2.5 leading-relaxed");

export function L({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-medium text-cocoa">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-taupe">{hint}</span>}
    </label>
  );
}

export function Toggle({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-input bg-cream px-3.5 py-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[#a9813f]" />
      <span><span className="text-sm font-medium">{label}</span>{hint && <span className="block text-xs text-taupe">{hint}</span>}</span>
    </label>
  );
}

export function Submit({ children, pending, className }: { children: React.ReactNode; pending: boolean; className?: string }) {
  return (
    <button type="submit" disabled={pending} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 font-medium text-cream transition hover:bg-gold-deep disabled:opacity-60", className)}>
      {pending && <Loader2 className="size-4 animate-spin" />}{children}
    </button>
  );
}

export function ActionForm({ action, children, className, resetOnSuccess, onSuccess }: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  children: (pending: boolean) => React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok) {
      toast.success(state.message ?? "Saved");
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return <form ref={ref} action={formAction} className={className}>{children(pending)}</form>;
}

export async function runAction(p: Promise<ActionResult>, success?: string) {
  const r = await p;
  if (r.error) toast.error(r.error);
  else toast.success(r.message ?? success ?? "Done");
  return !r.error;
}

export function Panel({ title, description, children, actions, className }: { title: string; description?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-champagne/40 bg-cream p-5 sm:p-6", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-taupe">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
