import { test, expect } from "@playwright/test";
import { isReservedSlug, RESERVED_ROOT_SLUGS } from "../lib/reserved-slugs";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Boutique servie à la racine : `novakou.com/ma-boutique`.
 *
 * Le middleware réécrit tout segment racine INCONNU vers la page boutique.
 * C'est la liste des segments réservés qui empêche cette règle d'avaler une
 * vraie page du site — et une page avalée deviendrait publique, puisque la
 * réécriture court-circuite le contrôle d'accès. D'où ce filet.
 */

const APP = join(process.cwd(), "app");

/** Segments racine réellement présents dans l'application. */
function segmentsReels(): string[] {
  const out = new Set<string>();
  const lire = (dir: string, dansGroupe: boolean) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith("[") || e.name.startsWith("_")) continue;
      if (e.name.startsWith("(")) {
        // Groupe de routes : n'apparaît pas dans l'URL, on descend d'un cran.
        lire(join(dir, e.name), true);
        continue;
      }
      out.add(e.name);
      void dansGroupe;
    }
  };
  lire(APP, false);
  return [...out];
}

test("toute route racine réelle est déclarée réservée", () => {
  // Une route oubliée ici resterait affichée (Next.js sert le statique avant
  // le dynamique) MAIS le middleware la laisserait passer comme publique :
  // une page exigeant une connexion ne la demanderait plus.
  const oubliees = segmentsReels().filter((s) => !isReservedSlug(s));
  expect(oubliees, "routes racine absentes de RESERVED_ROOT_SLUGS").toEqual([]);
});

test("les espaces privés ne peuvent jamais être pris pour une boutique", () => {
  for (const s of ["admin", "wallet", "vendeur", "apprenant", "affilie", "mentor", "kyc", "messages", "sessions", "api", "checkout", "payment"]) {
    expect(isReservedSlug(s), `${s} doit être réservé`).toBe(true);
  }
});

test("la réservation ignore la casse et les espaces", () => {
  expect(isReservedSlug("  ADMIN ")).toBe(true);
  expect(isReservedSlug("Wallet")).toBe(true);
});

test("un nom de boutique ordinaire reste libre", () => {
  for (const s of ["fidah-boukari", "digitx-shop", "ma-boutique", "kaza", "elias-store"]) {
    expect(isReservedSlug(s), `${s} devrait rester disponible`).toBe(false);
  }
});

test("le middleware garde les domaines personnalisés hors de la règle", () => {
  // `/boutique/by-domain/<hôte>` est la cible de la réécriture des domaines
  // personnalisés : la rediriger casserait toutes les boutiques sur domaine
  // propre. La négation doit rester dans l'expression.
  const src = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
  expect(src).toContain("by-domain");
  expect(src.includes("(?!by-domain")).toBe(true);
});

test("la liste réservée ne contient ni doublon ni entrée vide", () => {
  for (const s of RESERVED_ROOT_SLUGS) {
    expect(s.trim(), "entrée vide dans la liste").not.toBe("");
    expect(s, `« ${s} » doit être en minuscules`).toBe(s.toLowerCase());
  }
});
