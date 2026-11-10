"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export type AuthState = { error?: string; message?: string; step?: "code"; email?: string };

const email = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200);

function safeNext(raw: FormDataEntryValue | null) {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/photos";
}

async function limited(kind: string, who: string, max: number, seconds: number) {
  const ip = await clientIp();
  const [a, b] = await Promise.all([rateLimit(`${kind}:ip:${ip}`, max * 3, seconds), rateLimit(`${kind}:who:${who}`, max, seconds)]);
  return !(a && b);
}

async function ensureActive(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Sign-in failed. Please try again.";
  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user.id).single();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return "This account doesn't have access. Please ask the family for an invitation.";
  }
  return null;
}

export async function signInWithPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const e = email.safeParse(form.get("email"));
  const password = String(form.get("password") ?? "");
  if (!e.success) return { error: e.error.issues[0].message };
  if (!password) return { error: "Please enter your password." };
  if (await limited("login", e.data, 8, 900)) return { error: "Too many attempts. Please wait 15 minutes and try again." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: e.data, password });
  if (error) return { error: "That email and password don't match. You can also sign in with an email code." };
  const inactive = await ensureActive(supabase);
  if (inactive) return { error: inactive };
  redirect(safeNext(form.get("next")));
}

export async function sendLoginCode(_prev: AuthState, form: FormData): Promise<AuthState> {
  const e = email.safeParse(form.get("email"));
  if (!e.success) return { error: e.error.issues[0].message };
  if (await limited("otp", e.data, 5, 900)) return { error: "Too many codes requested. Please wait 15 minutes." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: e.data, options: { shouldCreateUser: false } });
  if (error && error.status !== 422 && error.status !== 400) console.error("otp", error.message);
  return { step: "code", email: e.data, message: "If this email has been invited, a 6-digit code is on its way. It can take a minute." };
}

export async function verifyLoginCode(_prev: AuthState, form: FormData): Promise<AuthState> {
  const e = email.safeParse(form.get("email"));
  const token = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!e.success) return { error: e.error.issues[0].message };
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email: e.data, error: "Please enter the code from the email." };
  if (await limited("otp-verify", e.data, 10, 900)) return { step: "code", email: e.data, error: "Too many attempts. Please request a new code later." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: e.data, token, type: "email" });
  if (error) return { step: "code", email: e.data, error: "That code is incorrect or has expired." };
  const inactive = await ensureActive(supabase);
  if (inactive) return { error: inactive };
  redirect(safeNext(form.get("next")));
}

export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const e = email.safeParse(form.get("email"));
  if (!e.success) return { error: e.error.issues[0].message };
  if (await limited("reset", e.data, 3, 3600)) return { error: "Too many requests. Please try again in an hour." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(e.data, { redirectTo: `${env.siteUrl}/auth/confirm?next=/set-password` });
  return { message: "If this email has an account, a reset link is on its way." };
}

const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(72, "That's too long.");

export async function setPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const p = passwordSchema.safeParse(form.get("password"));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data !== form.get("confirm")) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password: p.data });
  if (error) return { error: error.message.includes("different") ? "Please choose a different password from your old one." : "Could not save your password. Please try again." };

  await createAdminClient().from("invitations").update({ accepted_at: new Date().toISOString() })
    .eq("user_id", user.id).is("accepted_at", null);
  const inactive = await ensureActive(supabase);
  if (inactive) return { error: inactive };
  redirect("/photos");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
