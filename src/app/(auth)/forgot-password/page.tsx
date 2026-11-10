"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/auth/fields";
import { requestPasswordReset, type AuthState } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium">Reset your password</h1>
        <p className="mt-1 text-taupe">We&apos;ll email you a link to choose a new one.</p>
      </div>
      {state.message ? (
        <FormMessage message={state.message} />
      ) : (
        <form action={action} className="space-y-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <FormMessage error={state.error} />
          <SubmitButton pending={pending}>Send reset link</SubmitButton>
        </form>
      )}
      <p className="text-center text-sm"><Link href="/login" className="text-gold-deep underline-offset-4 hover:underline">Back to sign in</Link></p>
    </div>
  );
}
