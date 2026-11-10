import { rmSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { cleanup } from "./global-setup";
import { STATE_FILE } from "./fixtures";

export default async function globalTeardown() {
  if (process.env.E2E_KEEP_DATA) return;
  loadEnvConfig(process.cwd());
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  await cleanup(svc);
  rmSync(STATE_FILE, { force: true });
  rmSync(join(process.cwd(), "tests", "e2e", ".tmp"), { recursive: true, force: true });
}
