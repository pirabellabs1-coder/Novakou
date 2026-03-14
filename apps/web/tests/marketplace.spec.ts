import { test, expect } from "@playwright/test";

test.describe("Marketplace", () => {
  test("should load explorer page", async ({ page }) => {
    await page.goto("/explorer");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display filter controls", async ({ page }) => {
    await page.goto("/explorer");
    // Look for filter/search elements
    const searchOrFilter = page.locator('input[type="search"], input[placeholder*="echerch"], [data-testid="filters"], button:has-text("Filtr")').first();
    await expect(searchOrFilter).toBeVisible({ timeout: 10_000 });
  });

  test("should have service cards or grid", async ({ page }) => {
    await page.goto("/explorer");
    // Wait for content to load
    await page.waitForLoadState("networkidle");
    // Should have some content (cards, grid, or empty state)
    const content = page.locator('[class*="grid"], [class*="card"], [class*="service"]').first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });
});
