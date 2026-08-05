import { defineConfig } from "@playwright/test";

/**
 * Configuration pour les tests de LOGIQUE PURE.
 *
 * La configuration principale démarre un serveur Next et un navigateur : c'est
 * nécessaire pour tester des pages, mais inutile — et lent — pour vérifier une
 * conversion ou un catalogue. Ici, ni serveur ni navigateur.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "line",
  use: {},
});
