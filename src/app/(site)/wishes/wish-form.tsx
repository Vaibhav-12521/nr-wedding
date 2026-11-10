"use client";

import { useActionState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { submitWish, type WishState } from "./actions";

const field = "mt-1.5 block w-full rounded-xl border border-input bg-cream px-4 text-base text-cocoa outline-none focus:border-gold focus:ring-4 focus:ring-champagne/25";

export function WishForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<WishState, FormData>(submitWish, {});
  if (state.ok) {
    return (
      <div className="card-frame paper p-8 text-center" role="status">
        <Heart className="relative z-10 mx-auto size-8 fill-rose text-rose" />
        <p className="relative z-10 mt-3 font-display text-2xl">Thank you for your blessing</p>
        <p className="relative z-10 mt-1 text-taupe">It will appear here once the family has seen it.</p>
      </div>
    );
  }
  return (
    <form action={action} className="card-frame paper space-y-4 p-6 sm:p-8">
      <label className="relative z-10 block">
        <span className="text-sm font-medium">Your name</span>
        <input name="name" defaultValue={name} required maxLength={80} className={`${field} h-12`} />
      </label>
      <label className="relative z-10 block">
        <span className="text-sm font-medium">Your blessing for the couple</span>
        <textarea name="message" required minLength={2} maxLength={600} rows={4} className={`${field} py-3`} />
      </label>
      {state.error && <p className="relative z-10 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="relative z-10 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold font-medium text-cream hover:bg-gold-deep disabled:opacity-60">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />} Send blessing
      </button>
    </form>
  );
}
