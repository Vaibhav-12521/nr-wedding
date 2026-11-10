import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { login, state } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("1. public visitors see the wedding site but nothing private", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open the invitation" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Neha");
  await page.goto("/events");
  await expect(page.getByText("31 January Celebration")).toBeVisible();

  await page.goto("/photos");
  await expect(page).toHaveURL(/\/login\?next=%2Fphotos/);
  for (const path of ["/api/photos", "/api/selection", `/api/photos/${state().restrictedPhotoId}/download`]) {
    expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(401);
  }
  expect((await request.post("/api/photos/zip", { form: { ids: state().restrictedPhotoId } })).status()).toBe(401);
});

test("2. invited guest signs in; wrong password is refused", async ({ page }) => {
  const s = state();
  await page.goto("/login");
  await page.getByLabel("Email").fill(s.users.guest1.email);
  await page.getByLabel("Password").fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText("don't match");
  await login(page, "guest1");
  await expect(page.getByRole("heading", { name: "Wedding Photos" })).toBeVisible();
});

test("3+4. single and multiple photo upload, with bad files rejected", async ({ page }) => {
  const s = state();
  await login(page, "guest1");
  await page.goto(`/upload?album=${s.albums.open.id}`);
  const input = page.locator('input[type="file"]');

  await input.setInputFiles(s.images[0]);
  await page.getByRole("button", { name: /Upload 1 photo/ }).click();
  await expect(page.getByText("1 of 1 uploaded")).toBeVisible({ timeout: 60_000 });

  await input.setInputFiles([...s.images.slice(1), join(process.cwd(), "tests", "e2e", ".tmp", "not-a-photo.jpg")]);
  await page.getByRole("button", { name: /Upload 4 photos/ }).click();
  await expect(page.getByText(/4 of 5 uploaded · 1 failed/)).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(/isn't a readable image|couldn't be processed/)).toBeVisible();

  await page.goto(`/albums/${s.albums.open.slug}`);
  await expect(page.getByText("4 photos")).toBeVisible();
  await expect(page.getByText("E2E Guest One").first()).toBeVisible();
});

test("5. select photos, see them in Selected, and they persist", async ({ page }) => {
  const s = state();
  await login(page, "guest1");
  await page.goto(`/albums/${s.albums.open.slug}`);
  const boxes = page.getByRole("button", { name: "Select photo" });
  await boxes.nth(0).click();
  await boxes.nth(0).click();
  await expect(page.getByText(/Selected: 2 photos/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Selected: 2 photos/)).toBeVisible();
  await page.goto("/selection");
  await expect(page.getByText("2 photos")).toBeVisible();
});

test("6. download one original at full quality", async ({ page }) => {
  const s = state();
  await login(page, "guest1");
  const list = await (await page.request.get(`/api/photos?album=${s.albums.open.id}`)).json();
  const photo = list.photos[0];
  const res = await page.request.get(`/api/photos/${photo.id}/download`);
  expect(res.status()).toBe(200);
  const body = await res.body();
  expect(body.length).toBe(photo.size);
  expect(body.subarray(0, 3).toString("hex")).toBe("ffd8ff");
});

test("7. download selected photos as one ZIP", async ({ page }) => {
  await login(page, "guest1");
  const { ids } = await (await page.request.get("/api/selection")).json();
  expect(ids).toHaveLength(2);
  const res = await page.request.post("/api/photos/zip", { form: { ids: ids.join(",") } });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/zip");
  const zip = await res.body();
  expect(zip.subarray(0, 2).toString()).toBe("PK");
  const entries = zip.toString("latin1").split("PK\u0001\u0002").length - 1;
  expect(entries).toBe(2);
  expect(Number(res.headers()["content-length"])).toBe(zip.length);
});

test("8. private album: invisible and undownloadable without permission", async ({ page }) => {
  const s = state();
  await login(page, "guest1");
  const albums = await page.goto(`/albums/${s.albums.restricted.slug}`);
  expect(albums?.status()).toBe(404);
  const list = await (await page.request.get(`/api/photos?album=${s.albums.restricted.id}`)).json();
  expect(list.photos).toHaveLength(0);
  expect((await page.request.get(`/api/photos/${s.restrictedPhotoId}/download`, { maxRedirects: 0 })).status()).toBe(404);
  const zip = await page.request.post("/api/photos/zip", { form: { ids: s.restrictedPhotoId } });
  expect(zip.status()).toBe(403);
  expect((await page.request.delete(`/api/photos/${s.restrictedPhotoId}`)).status()).toBe(403);

  await page.context().clearCookies();
  await login(page, "guest2");
  await page.goto(`/albums/${s.albums.restricted.slug}`);
  await expect(page.getByText("1 photo")).toBeVisible();
  expect((await page.request.get(`/api/photos/${s.restrictedPhotoId}/download`)).status()).toBe(200);
});

test("9. admin area: guests are kept out, admins can approve photos for the public gallery", async ({ page }) => {
  const s = state();
  await login(page, "guest1");
  expect((await page.goto("/admin"))?.status()).toBe(404);
  expect((await page.request.get("/api/admin/rsvps")).status()).toBe(403);

  const list = await (await page.request.get(`/api/photos?album=${s.albums.open.id}`)).json();
  const mine = list.photos[0];
  expect((await page.request.post(`/api/photos/${mine.id}/request-public`, { data: {} })).status()).toBe(200);
  await page.context().clearCookies();
  await page.goto("/gallery");
  await expect(page.locator(`img[src*="${mine.id}"]`)).toHaveCount(0);

  await login(page, "admin");
  await page.goto("/admin/photos");
  await expect(page.getByText("Awaiting approval").first()).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).first().click();
  await expect(page.getByText(/Approved/).first()).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/gallery");
  await expect(page.getByRole("button", { name: /Open photo 1/ })).toBeVisible();
});
