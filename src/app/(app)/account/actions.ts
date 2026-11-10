"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiMember } from "@/lib/auth";

export type NameState = { ok?: boolean; error?: string };

export async function updateName(_prev: NameState, form: FormData): Promise<NameState> {
  const auth = await apiMember();
  if (auth.error) return { error: "Please sign in again." };
  const name = z.string().trim().min(1, "Please enter your name.").max(120).safeParse(form.get("full_name"));
  if (!name.success) return { error: name.error.issues[0].message };
  const { error } = await auth.session.supabase.from("profiles").update({ full_name: name.data }).eq("id", auth.session.userId);
  if (error) return { error: "Could not save your name." };
  revalidatePath("/", "layout");
  return { ok: true };
}
