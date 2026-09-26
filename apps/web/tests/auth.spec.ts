import { test, expect } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("should load inscription page", async ({ page }) => {
    await page.goto("/inscription");
    await expect(page.locator("body")).toBeVisible();
    // Should have a form or role selection
    // Le premier bouton du DOM peut être masqué sur mobile (menu replié) :
    // on cible un élément visible.
    const formOrContent = page.locator("form:visible, [role='tablist']:visible, button:visible").first();
    await expect(formOrContent).toBeVisible();
  });

  test("should load connexion page", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.locator("body")).toBeVisible();
    // Should have email input
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test("should navigate from connexion to inscription", async ({ page }) => {
    await page.goto("/connexion");
    const inscriptionLink = page.locator('a[href*="inscription"]').first();
    if (await inscriptionLink.isVisible()) {
      await inscriptionLink.click();
      // next dev compile /inscription à la première visite : plus de 5 s en CI.
      await expect(page).toHaveURL(/inscription/, { timeout: 20_000 });
    }
  });
});
