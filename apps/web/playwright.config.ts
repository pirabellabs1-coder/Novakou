import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:3450",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"], viewport: { width: 375, height: 667 } },
    },
    {
      name: "Tablet",
      use: { viewport: { width: 768, height: 1024 } },
    },
  ],

  webServer: {
    // ⚠️ Cette commande était « pnpm dev --filter=… » : ordre d'arguments
    // invalide pour pnpm, et aucun port imposé — le serveur ne démarrait
    // JAMAIS, donc la suite entière (151 tests) était inexécutable partout.
    // Découvert le 2026-08-16 en voulant la lancer. On démarre Next
    // directement, sur le port que `baseURL` attend.
    command: "npx next dev -p 3450",
    url: "http://localhost:3450",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
