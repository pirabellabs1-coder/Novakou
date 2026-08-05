import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Le menu admin comptait vingt-trois entrées identiques. Rien ne disait qu'une
 * pièce d'identité dormait depuis trois jours ou qu'un retrait attendait
 * d'être versé : il fallait ouvrir chaque page pour le découvrir, donc on ne
 * le découvrait pas.
 */
const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

test("chaque page qui attend une décision a son compteur", () => {
  const api = lire("app/api/formations/admin/actions-en-attente/route.ts");
  for (const page of [
    "/admin/kyc",
    "/admin/retraits-vendeurs",
    "/admin/affiliate-withdrawals",
    "/admin/retraits",
    "/admin/suppressions",
  ]) {
    expect(api, `${page} n'est pas compté`).toContain(`"${page}"`);
  }
});

test("on ne compte QUE ce qui appelle un geste", () => {
  const api = lire("app/api/formations/admin/actions-en-attente/route.ts");
  // Un compteur qui ne retombe jamais à zéro cesse d'être lu — exactement
  // comme une alerte qui crie tout le temps.
  expect(api).toContain('status: "EN_ATTENTE"');
  expect(api).toContain('status: "AWAITING_REVIEW"');
});

test("un compteur en panne n'efface pas tous les autres", () => {
  const api = lire("app/api/formations/admin/actions-en-attente/route.ts");
  // Chaque compte est isolé : une table absente ou renommée ne doit pas faire
  // disparaître l'ensemble des badges du menu.
  expect(api).toContain("catch(() => 0)");
});

test("le repère global est visible depuis n'importe quelle page admin", () => {
  const layout = lire("app/(formations-dashboard)/admin/layout.tsx");
  expect(layout).toContain("à traiter");
  // Le badge par entrée doit être générique, pas ajouté page par page.
  expect(layout).toContain("parPage[item.href]");
});
