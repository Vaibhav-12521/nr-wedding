"use server";

import { z } from "zod";
import { apiMember } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type WishState = { ok?: boolean; error?: string };

const schema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(80),
  message: z.string().trim().min(2, "Please write a short message.").max(600, "Please keep it under 600 characters."),
});

export async function submitWish(_p: WishState, form: FormData): Promise<WishState> {
  const auth = await apiMember();
  if (auth.error) return { error: "Please sign in to leave a blessing." };
  const parsed = schema.safeParse({ name: form.get("name"), message: form.get("message") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await rateLimit(`wish:${auth.session.userId}`, 5, 3600))) return { error: "You've shared several blessings already - thank you! Please try again later." };
  const { error } = await auth.session.supabase.from("wishes").insert({ user_id: auth.session.userId, ...parsed.data });
  if (error) return { error: "Could not send your blessing. Please try again." };
  return { ok: true };
}
