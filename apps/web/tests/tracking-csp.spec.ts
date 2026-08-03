import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * La politique de sécurité doit autoriser ce que le code des pixels charge.
 *
 * Elle bloquait Facebook, TikTok, Snapchat et Pinterest : le navigateur
 * refusait le script du pixel, donc AUCUNE vente n'était remontée à ces
 * régies. Un vendeur voyait ses dépenses publicitaires monter, ses ventes
 * arriver, et zéro conversion déclarée — impossible d'optimiser une campagne.
 *
 * Rien ne signalait le problème : ni erreur serveur, ni test, ni alerte. Juste
 * un refus silencieux dans la console du navigateur de l'acheteur.
 *
 * Ce test relie les deux fichiers : ajouter une régie dans le composant sans
 * l'autoriser dans la politique fait échouer la vérification.
 */

const RACINE = process.cwd();
const CSP = readFileSync(join(RACINE, "next.config.ts"), "utf8");
const INJECTEUR = readFileSync(
  join(RACINE, "components", "formations", "PixelInjector.tsx"),
  "utf8",
);

/** Domaines effectivement chargés par le composant. */
function domainesCharges(): string[] {
  const trouves = INJECTEUR.match(/https:\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
  return [...new Set(trouves.map((u) => u.toLowerCase()))];
}

/** Contenu d'une directive de la politique de sécurité. */
function directive(nom: string): string {
  const m = CSP.match(new RegExp(`"${nom}[^"]*"`));
  return m ? m[0] : "";
}

test("tout domaine chargé par les pixels est autorisé en script-src", () => {
  const autorises = directive("script-src");
  expect(autorises, "directive script-src introuvable").not.toBe("");

  const bloques = domainesCharges().filter((d) => !autorises.includes(d.replace("https://", "")));
  expect(bloques, "domaines chargés mais bloqués par la politique de sécurité").toEqual([]);
});

test("les points de collecte des régies sont joignables", () => {
  // Le script chargé n'est que la moitié du chemin : il envoie ensuite la
  // conversion vers un autre domaine. Bloquer celui-là revient au même —
  // le pixel se charge, et rien ne part.
  const autorises = directive("connect-src");
  for (const d of [
    "www.facebook.com",      // Meta
    "analytics.tiktok.com",  // TikTok
    "tr.snapchat.com",       // Snapchat
    "ct.pinterest.com",      // Pinterest
    "www.google-analytics.com",
  ]) {
    expect(autorises.includes(d), `${d} absent de connect-src`).toBe(true);
  }
});

test("les cinq régies prises en charge sont couvertes", () => {
  // Le type Pixel liste les régies proposées aux vendeurs. En proposer une
  // dans l'interface sans que son domaine passe reviendrait à vendre une
  // fonctionnalité qui ne marche pas.
  const regies = ["FACEBOOK", "GOOGLE", "TIKTOK", "SNAPCHAT", "PINTEREST"];
  for (const r of regies) {
    expect(INJECTEUR.includes(r), `${r} absent du composant`).toBe(true);
  }
  expect(domainesCharges().length).toBeGreaterThanOrEqual(regies.length);
});
