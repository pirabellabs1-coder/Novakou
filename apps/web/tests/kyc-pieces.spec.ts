import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Vérifier une identité demande TROIS pièces, et les trois sont obligatoires.
 *
 * Le recto seul ne prouve rien : les dates de validité et le numéro figurent
 * souvent au dos. Et sans photo du visage, une pièce trouvée ou empruntée
 * suffit à passer — c'est précisément ce que le contrôle doit empêcher.
 *
 * L'exigence vit CÔTÉ SERVEUR : un bouton grisé n'arrête personne qui appelle
 * l'API directement.
 */
const lire = (f: string) => readFileSync(join(process.cwd(), f), "utf8");

test("le serveur refuse un dossier incomplet", () => {
  const src = lire("app/api/formations/kyc/route.ts");
  for (const champ of ["documentUrl", "documentVersoUrl", "selfieUrl"]) {
    expect(src, `${champ} n'est pas exigé`).toContain(champ);
  }
  expect(src).toContain("KYC_INCOMPLET");
  // Le refus doit nommer ce qui manque : « dossier incomplet » sans précision
  // fait recommencer la personne à l'aveugle.
  expect(src).toContain("manquant");
});

test("le formulaire réclame les trois pièces avant d'autoriser l'envoi", () => {
  const src = lire("app/(formations-dashboard)/kyc/page.tsx");
  expect(src).toMatch(/!documentUrl\.trim\(\)\s*\|\|\s*!versoUrl\.trim\(\)\s*\|\|\s*!selfieUrl\.trim\(\)/);
  // Trois emplacements distincts, pas un seul dupliqué à la main.
  expect((src.match(/<DepotPiece/g) ?? []).length).toBe(3);
});

test("les consignes de prise de vue sont affichées", () => {
  const src = lire("app/(formations-dashboard)/kyc/page.tsx");
  for (const mot of ["lumière", "reflets", "lisible", "de face"]) {
    expect(src.toLowerCase(), `consigne « ${mot} » absente`).toContain(mot.toLowerCase());
  }
});

test("la photo de visage ouvre la caméra frontale", () => {
  const src = lire("app/(formations-dashboard)/kyc/page.tsx");
  // `capture="user"` : sans lui, le téléphone ouvre la caméra arrière et la
  // personne se photographie à l'aveugle.
  expect(src).toContain('camera="user"');
});

test("l'admin voit les trois pièces, pas seulement le recto", () => {
  const src = lire("app/(formations-dashboard)/admin/kyc/page.tsx");
  expect(src).toContain("selected.documentVersoUrl");
  expect(src).toContain("selected.selfieUrl");
});
