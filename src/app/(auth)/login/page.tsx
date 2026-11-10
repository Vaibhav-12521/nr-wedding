import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  inactive: "This account doesn't have access yet. Please ask the family for an invitation.",
  link: "That link has expired or was already used. Please sign in, or request a new link.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/photos", error } = await searchParams;
  const session = await getSession();
  if (session?.profile.is_active) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/photos");
  if (!isSupabaseConfigured) {
    return <p className="text-center text-taupe">Sign-in isn&apos;t available yet - the site&apos;s database hasn&apos;t been connected. See the README.</p>;
  }
  return <LoginForm next={next} notice={error ? NOTICES[error] : undefined} />;
}
