import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createDb } from "./harness";

const migrations = join(process.cwd(), "supabase", "migrations");
const combined = join(process.cwd(), "supabase", "setup-all.sql");

describe("supabase/setup-all.sql (one-paste setup)", () => {
  it("contains every migration, in order", () => {
    const all = readFileSync(combined, "utf8");
    let at = 0;
    for (const f of readdirSync(migrations).filter((x) => x.endsWith(".sql")).sort()) {
      const body = readFileSync(join(migrations, f), "utf8");
      const i = all.indexOf(body, at);
      expect(i, `${f} missing or out of order - regenerate setup-all.sql`).toBeGreaterThanOrEqual(0);
      at = i + body.length;
    }
  });

  it("runs cleanly on an empty database", async () => {
    const { as } = await createDb({ sqlFiles: [combined] });
    const rows = await as({ role: "anon" }, (q) => q<{ date_label: string }>(`select date_label from public.wedding_events order by sort_order`));
    expect(rows.map((r) => r.date_label)).toEqual(["31 January 2027", "15 February 2027"]);
    const [w] = await as({ role: "anon" }, (q) => q(`select groom_name from public.wedding_details`));
    expect(w).toEqual({ groom_name: "Rudra" });
  });
});
