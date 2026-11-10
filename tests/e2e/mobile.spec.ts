import { expect, test } from "@playwright/test";
import { login, state } from "./fixtures";

test("10. mobile: tab bar, one-handed select mode and selection bar", async ({ page }) => {
  const s = state();
  await login(page, "guest2");
  const tabbar = page.getByRole("navigation", { name: "Photo album" }).last();
  await expect(tabbar).toBeVisible();
  await expect(tabbar.getByRole("link", { name: "Upload" })).toBeVisible();

  await page.goto(`/albums/${s.albums.restricted.slug}`);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.getByRole("button", { name: /^Select / }).first().click();
  await expect(page.getByText(/Selected: 1 photo/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Download Selected" })).toBeInViewport();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
