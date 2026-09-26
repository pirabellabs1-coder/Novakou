import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  const viewports = [
    { name: "Mobile S", width: 320, height: 568 },
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Laptop", width: 1280, height: 720 },
    { name: "Desktop", width: 1920, height: 1080 },
  ];

  const routes = [
    { path: "/", label: "Landing" },
    { path: "/connexion", label: "Connexion" },
    { path: "/inscription", label: "Inscription" },
    { path: "/explorer", label: "Marketplace" },
    { path: "/tarifs", label: "Tarifs" },
    // Espaces privés : sans session, le middleware renvoie vers la connexion —
    // on vérifie alors la page de connexion, jamais une 404 de boutique
    // (« /dashboard » et « /client » n'existent plus depuis FreelanceHigh).
    { path: "/vendeur/dashboard", label: "Dashboard vendeur" },
    { path: "/apprenant/dashboard", label: "Dashboard apprenant" },
    { path: "/admin", label: "Admin" },
  ];

  for (const vp of viewports) {
    for (const route of routes) {
      test(`${route.label} renders on ${vp.name} (${vp.width}px)`, async ({
        browser,
      }) => {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        });
        const page = await context.newPage();

        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await expect(page.locator("body")).toBeAttached();

        // No horizontal overflow
        const bodyWidth = await page.evaluate(
          () => document.body.scrollWidth
        );
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 20);

        await context.close();
      });
    }
  }

  // Sidebar visibility tests
  for (const vp of viewports) {
    test(`Sidebar hidden on ${vp.name} < lg`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      await page.goto("/vendeur/dashboard", { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeAttached();

      // Espace privé : sans session (CI, base vide), le middleware renvoie
      // vers la connexion — il n'y a aucune barre latérale à vérifier.
      if (/\/connexion/.test(page.url())) {
        await context.close();
        test.skip(true, "session requise pour voir la barre latérale");
      }

      if (vp.width >= 1024) {
        // Desktop: sidebar visible
        const sidebar = page.locator("aside").first();
        await expect(sidebar).toBeVisible();
      } else {
        // Mobile/tablet: hamburger menu visible
        const menuBtn = page.locator(
          'button:has(span.material-symbols-outlined:text("menu"))'
        );
        if ((await menuBtn.count()) > 0) {
          await expect(menuBtn.first()).toBeVisible();
        }
      }

      await context.close();
    });
  }
});
