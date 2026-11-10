"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/auth/fields";
import { sendLoginCode, signInWithPassword, verifyLoginCode, type AuthState } from "../actions";
import { cn } from "@/lib/utils";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [mode, setMode] = useState<"password" | "code">("password");
  const [pwState, pwAction, pwPending] = useActionState<AuthState, FormData>(signInWithPassword, {});
  const [codeState, codeAction, codePending] = useActionState<AuthState, FormData>(sendLoginCode, {});
  const [verifyState, verifyAction, verifyPending] = useActionState<AuthState, FormData>(verifyLoginCode, {});
  const codeStep = verifyState.step === "code" || codeState.step === "code";
  const codeEmail = verifyState.email ?? codeState.email ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium">Welcome</h1>
        <p className="mt-1 text-taupe">Sign in to see, share and download the wedding photos.</p>
      </div>
      {notice && <FormMessage error={notice} />}

      <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 rounded-full bg-muted p-1">
        {(["password", "code"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={cn("h-10 rounded-full text-sm font-medium transition", mode === m ? "bg-cream text-gold-deep shadow-sm" : "text-taupe")}>
            {m === "password" ? "Password" : "Email code"}
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <form action={pwAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <FormMessage error={pwState.error} />
          <SubmitButton pending={pwPending}>Sign in</SubmitButton>
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-gold-deep underline-offset-4 hover:underline">Forgot your password?</Link>
          </p>
        </form>
      ) : !codeStep ? (
        <form action={codeAction} className="space-y-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <FormMessage error={codeState.error} />
          <SubmitButton pending={codePending}>Email me a sign-in code</SubmitButton>
        </form>
      ) : (
        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="email" value={codeEmail} />
          <FormMessage message={codeState.message} error={verifyState.error} />
          <Field label={`Code sent to ${codeEmail}`} name="code" inputMode="numeric" autoComplete="one-time-code"
            pattern="[0-9]*" maxLength={10} required className="text-center text-2xl tracking-[0.5em]" />
          <SubmitButton pending={verifyPending}>Verify and sign in</SubmitButton>
          <button type="button" onClick={() => location.reload()} className="w-full text-center text-sm text-taupe hover:text-gold-deep">
            Use a different email
          </button>
        </form>
      )}

      <p className="border-t border-champagne/30 pt-5 text-center text-sm text-taupe">
        The album is for invited family and friends. Don&apos;t have access? Please ask the family to invite you.
      </p>
    </div>
  );
}
