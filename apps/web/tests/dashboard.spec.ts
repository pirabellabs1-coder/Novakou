import { test, expect } from "@playwright/test";

/**
 * Dashboard tests — migrated to the new namespace.
 * Old: /dashboard, /dashboard/services, /dashboard/kyc (FreelanceHigh marketplace)
 * New: /vendeur/dashboard, /vendeur/produits, /kyc (Novakou formations)
 *
 * Pages requiring auth will redirect; we just verify they don't 404.
 */
test.describe("Vendor dashboard navigation", () => {
  test("/vendeur/dashboard does not 404", async ({ page }) => {
    const res = await page.goto("/vendeur/dashboard");
    expect(res?.status() ?? 200).not.toBe(404);
  });

  test("/vendeur/services alias resolves (no 404)", async ({ request }) => {
    const res = await request.get("/vendeur/services", { maxRedirects: 0 });
    expect(res.status()).not.toBe(404);
  });

  test("/kyc page exists", async ({ page }) => {
    const res = await page.goto("/kyc");
    expect(res?.status() ?? 200).not.toBe(404);
  });
});
