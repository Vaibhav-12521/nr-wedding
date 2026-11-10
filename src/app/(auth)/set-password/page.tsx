import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Set your password" };

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?error=link");
  const { welcome } = await searchParams;
  return <SetPasswordForm name={session.profile.full_name} welcome={welcome === "1"} />;
}
