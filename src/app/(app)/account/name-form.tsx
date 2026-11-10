"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Field, FormMessage, SubmitButton } from "@/components/auth/fields";
import { updateName, type NameState } from "./actions";

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<NameState, FormData>(updateName, {});
  useEffect(() => { if (state.ok) toast.success("Name saved"); }, [state]);
  return (
    <form action={action} className="space-y-3">
      <Field label="Your name (shown on photos you upload)" name="full_name" defaultValue={name} required maxLength={120} />
      <FormMessage error={state.error} />
      <div className="max-w-40"><SubmitButton pending={pending}>Save</SubmitButton></div>
    </form>
  );
}
