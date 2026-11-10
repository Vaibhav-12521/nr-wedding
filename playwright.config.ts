import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const PORT = Number(process.env.E2E_PORT ?? 3200);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  reporter: [["list"]],
  use: {
    baseURL,
    channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Edge"], channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge" }, testIgnore: /mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: process.env.E2E_BROWSER_CHANNEL ?? "msedge" }, testMatch: /mobile/ },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `npm run build && npx next start -p ${PORT}`,
    url: baseURL,
    timeout: 300_000,
    reuseExistingServer: true,
  },
});
