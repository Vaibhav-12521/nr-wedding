import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, LayoutDashboard, LogOut } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { NameForm } from "./name-form";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const session = await requireMember("/account");
  const { supabase, userId } = session;
  const [uploads, favourites] = await Promise.all([
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("uploaded_by", userId),
    supabase.from("photo_favourites").select("photo_id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return (
    <div className="mx-auto max-w-2xl pb-32 pt-4">
      <h1 className="text-4xl font-medium sm:text-5xl">Your account</h1>
      <p className="mt-1 text-taupe">{session.email}</p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/photos?view=mine" className="rounded-2xl border border-champagne/40 bg-cream p-5 hover:border-gold">
          <p className="font-display text-4xl">{uploads.count ?? 0}</p><p className="text-sm text-taupe">photos uploaded</p>
        </Link>
        <Link href="/photos?view=favourites" className="rounded-2xl border border-champagne/40 bg-cream p-5 hover:border-gold">
          <p className="font-display text-4xl">{favourites.count ?? 0}</p><p className="text-sm text-taupe">favourites</p>
        </Link>
      </div>

      <section className="card-frame paper mt-8 p-6 sm:p-8">
        <div className="relative z-10"><NameForm name={session.profile.full_name} /></div>
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {session.profile.role === "admin" && (
          <Link href="/admin" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 font-medium text-cream hover:bg-gold-deep">
            <LayoutDashboard className="size-4" /> Admin dashboard
          </Link>
        )}
        <Link href="/set-password" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gold/50 px-6 font-medium text-gold-deep hover:bg-blush/30">
          <KeyRound className="size-4" /> Change password
        </Link>
        <form action={signOut}>
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-input px-6 font-medium text-cocoa hover:bg-muted">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
