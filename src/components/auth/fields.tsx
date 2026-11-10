import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "mt-1.5 block h-12 w-full rounded-xl border border-input bg-ivory/60 px-4 text-base text-cocoa outline-none transition placeholder:text-taupe/60 focus:border-gold focus:ring-4 focus:ring-champagne/25";

export function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-cocoa">{label}</span>
      <input {...props} className={cn(inputClass, props.className)} />
    </label>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-medium text-cream transition hover:bg-gold-deep disabled:opacity-60">
      {pending && <Loader2 className="size-4 animate-spin" />}{children}
    </button>
  );
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}</p>;
  if (message) return <p className="rounded-xl bg-blush/40 px-4 py-3 text-sm text-cocoa" role="status">{message}</p>;
  return null;
}
