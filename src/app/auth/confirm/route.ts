import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["invite", "recovery", "email", "magiclink", "signup", "email_change"];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/photos";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/photos";

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type && TYPES.includes(type)) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  } else if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  }
  if (!ok) return NextResponse.redirect(new URL("/login?error=link", url.origin));

  const destination = type === "invite" ? "/set-password?welcome=1" : type === "recovery" ? "/set-password" : next;
  return NextResponse.redirect(new URL(destination, url.origin));
}
