"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { submitRsvp, type RsvpState } from "./actions";
import { cn } from "@/lib/utils";

const field = "mt-1.5 block h-12 w-full rounded-xl border border-input bg-cream px-4 text-base text-cocoa outline-none transition focus:border-gold focus:ring-4 focus:ring-champagne/25 aria-invalid:border-destructive";

export function RsvpForm({ events }: { events: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<RsvpState, FormData>(submitRsvp, {});
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const err = (k: string) => state.fieldErrors?.[k];

  if (state.ok) {
    return (
      <div className="card-frame paper p-10 text-center" role="status">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold text-cream"><Check className="size-7" /></span>
        <p className="mt-5 font-display text-3xl">Thank you!</p>
        <p className="mt-2 text-taupe">Your response has been received. We can&apos;t wait to celebrate with you.</p>
      </div>
    );
  }

  return (
    <form action={action} className="card-frame paper space-y-6 p-6 sm:p-10" noValidate>
      <div className="relative z-10 grid gap-6 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Your name *</span>
          <input name="name" required autoComplete="name" className={field} aria-invalid={Boolean(err("name"))} />
          {err("name") && <span className="mt-1 block text-sm text-destructive">{err("name")}</span>}
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" autoComplete="email" className={field} aria-invalid={Boolean(err("email"))} />
          {err("email") && <span className="mt-1 block text-sm text-destructive">{err("email")}</span>}
        </label>
        <label className="block">
          <span className="text-sm font-medium">Phone</span>
          <input name="phone" type="tel" autoComplete="tel" className={field} aria-invalid={Boolean(err("phone"))} />
          {err("phone") && <span className="mt-1 block text-sm text-destructive">{err("phone")}</span>}
        </label>
      </div>

      <fieldset className="relative z-10">
        <legend className="text-sm font-medium">Will you attend? *</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[["yes", "Joyfully accepts"], ["no", "Regretfully declines"]].map(([v, label]) => (
            <label key={v} className={cn("flex h-14 cursor-pointer items-center justify-center rounded-xl border text-center font-medium transition",
              attending === v ? "border-gold bg-gold text-cream" : "border-input bg-cream hover:border-gold")}>
              <input type="radio" name="attending" value={v} className="sr-only" onChange={() => setAttending(v as "yes" | "no")} />
              {label}
            </label>
          ))}
        </div>
        {err("attending") && <span className="mt-1 block text-sm text-destructive">{err("attending")}</span>}
      </fieldset>

      {attending === "yes" && (
        <div className="relative z-10 grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Number of guests (including you)</span>
            <select name="guests" defaultValue="1" className={field}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          {events.length > 0 && (
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium">Which events will you attend?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {events.map((e) => (
                  <label key={e.id} className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border border-input bg-cream px-4 has-[:checked]:border-gold has-[:checked]:bg-blush/30">
                    <input type="checkbox" name="events" value={e.id} defaultChecked className="size-4 accent-[#a9813f]" />
                    {e.title}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}

      <label className="relative z-10 block">
        <span className="text-sm font-medium">A message for the couple</span>
        <textarea name="message" rows={4} maxLength={1000} className={cn(field, "h-auto py-3")} />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />

      {state.error && <p className="relative z-10 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="relative z-10 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-medium text-cream transition hover:bg-gold-deep disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" />} Send response
      </button>
    </form>
  );
}
