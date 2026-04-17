import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load and display hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Novakou/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have visible navbar", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav, header").first();
    await expect(nav).toBeVisible();
  });

  test("should have CTA buttons", async ({ page }) => {
    await page.goto("/");
    // Look for inscription or explorer links
    const links = page.locator('a[href*="inscription"], a[href*="explorer"]');
    await expect(links.first()).toBeVisible();
  });

  test("should have footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});
