import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";

export const STATE_FILE = join(process.cwd(), "tests", "e2e", ".state.json");

export type E2EState = {
  password: string;
  users: Record<"admin" | "guest1" | "guest2", { id: string; email: string; name: string }>;
  albums: Record<"open" | "restricted", { id: string; slug: string; name: string }>;
  restrictedPhotoId: string;
  images: string[];
};

export function state(): E2EState {
  return JSON.parse(readFileSync(STATE_FILE, "utf8"));
}

export async function login(page: Page, who: keyof E2EState["users"]) {
  const s = state();
  await page.goto("/login");
  await page.getByLabel("Email").fill(s.users[who].email);
  await page.getByLabel("Password").fill(s.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/photos/);
}
