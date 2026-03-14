import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1280, height: 720 },
  ];

  for (const vp of viewports) {
    test(`Landing page renders on ${vp.name} (${vp.width}px)`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      await page.goto("/");
      await expect(page.locator("body")).toBeVisible();

      // No horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 20); // small tolerance

      await context.close();
    });

    test(`Dashboard renders on ${vp.name} (${vp.width}px)`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      await page.goto("/dashboard");
      await expect(page.locator("body")).toBeVisible();

      // On mobile, sidebar should be hidden; on desktop, visible
      if (vp.width >= 1024) {
        const sidebar = page.locator("aside").first();
        await expect(sidebar).toBeVisible();
      }

      await context.close();
    });
  }
});
