import { createInterface } from "node:readline/promises";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

async function main() {
  const [emailArg, name = "", ...rest] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Usage: npm run create-admin -- you@example.com "Your Name" [--password]');
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  const svc = createClient(url, key, { auth: { persistSession: false } });

  const { data: prior } = await svc.from("invitations").select("id").eq("email", email).maybeSingle();
  if (prior) await svc.from("invitations").update({ role: "admin", full_name: name }).eq("id", prior.id);
  else await svc.from("invitations").insert({ email, role: "admin", full_name: name });

  const { data: existing } = await svc.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) {
    await svc.from("profiles").update({ role: "admin", is_active: true, ...(name ? { full_name: name } : {}) }).eq("id", existing.id);
    console.log(`✓ ${email} is now an admin. Sign in at ${site}/login`);
    return;
  }

  if (rest.includes("--password")) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const password = await rl.question("Choose a password (min 10 characters): ");
    rl.close();
    if (password.length < 10) throw new Error("Password too short.");
    const { error } = await svc.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
    if (error) throw new Error(error.message);
    console.log(`✓ Admin account created. Sign in at ${site}/login`);
  } else {
    const { error } = await svc.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/auth/confirm`, data: { full_name: name } });
    if (error) throw new Error(error.message);
    console.log(`✓ Invitation emailed to ${email}. The link lets them set a password.`);
  }
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
