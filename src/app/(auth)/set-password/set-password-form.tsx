"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/auth/fields";
import { setPassword, type AuthState } from "../actions";

export function SetPasswordForm({ name, welcome }: { name: string; welcome: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(setPassword, {});
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium">{welcome ? `Welcome${name ? `, ${name}` : ""}!` : "Choose a new password"}</h1>
        <p className="mt-1 text-taupe">
          {welcome ? "You've been invited to the family photo album. Choose a password to finish setting up your account." : "Use at least 10 characters."}
        </p>
      </div>
      <form action={action} className="space-y-4">
        <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={10} required />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
        <FormMessage error={state.error} />
        <SubmitButton pending={pending}>Save and continue</SubmitButton>
      </form>
    </div>
  );
}
