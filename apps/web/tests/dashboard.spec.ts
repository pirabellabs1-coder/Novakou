import { test, expect } from "@playwright/test";

test.describe("Dashboard Freelance", () => {
  test("should load dashboard page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have sidebar navigation", async ({ page, viewport }) => {
    // Sidebar is hidden on mobile, visible on desktop
    if (viewport && viewport.width >= 1024) {
      await page.goto("/dashboard");
      const sidebar = page.locator("aside, nav").first();
      await expect(sidebar).toBeVisible();
    }
  });

  test("should navigate to services page", async ({ page }) => {
    await page.goto("/dashboard/services");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to KYC page", async ({ page }) => {
    await page.goto("/dashboard/kyc");
    await expect(page.locator("body")).toBeVisible();
    // Should show verification content
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });
});
