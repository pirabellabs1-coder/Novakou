import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeMonetbilStatus, classifyMonetbilError } from "../lib/monetbil";
import { OPERATORS, PROVIDERS, routeFor } from "../lib/payments/registry";

/**
 * Monetbil ouvre le Cameroun et la zone XAF — la région qu'aucune de nos
 * passerelles ne servait. Contrat établi par SONDAGE de leur API, champ par
 * champ, puis recoupé avec leur documentation officielle.
 */

test("le Cameroun devient encaissable", () => {
  for (const code of ["orange_cm", "mtn_cm"]) {
    expect(routeFor(code, "monetbil", "collect"), `${code} sans route`).not.toBeNull();
  }
});

test("Monetbil reste en ENCAISSEMENT SEUL", () => {
  // Onze variantes d'endpoint de versement testées répondent 404 : déclarer
  // un décaissement ici promettrait un virement qu'on ne sait pas faire.
  const p = PROVIDERS.find((x) => x.id === "monetbil");
  expect(p?.directions).toEqual(["collect"]);
  for (const code of ["orange_cm", "mtn_cm"]) {
    expect(routeFor(code, "monetbil", "payout")).toBeNull();
  }
});

test("un paiement en cours n'est jamais pris pour un échec", () => {
  // Leur API rend un entier : 0 en cours, 1 réussi. Traiter le 0 comme un
  // échec fermerait une vente que l'acheteur confirme sur son téléphone.
  expect(normalizeMonetbilStatus(0)).toBe("pending");
  expect(normalizeMonetbilStatus("0")).toBe("pending");
  expect(normalizeMonetbilStatus(1)).toBe("success");
  expect(normalizeMonetbilStatus(2)).toBe("failed");
  expect(normalizeMonetbilStatus(undefined)).toBe("pending");
});

test("une clé de service absente est reconnue comme telle", () => {
  // C'est la réponse observée avec une fausse clé : elle doit conduire à
  // essayer une autre passerelle, pas à accuser l'acheteur.
  expect(classifyMonetbilError("SERVICE_NOT_FOUND — service not found").category).toBe("not_available");
  expect(classifyMonetbilError("MISSING_MSISDN — missing phonenumber").category).toBe("validation");
});

test("chaque opérateur porte le code EXACT de leur documentation", () => {
  // Leur table associe un code précis à chaque réseau (CM_MTNMOBILEMONEY…).
  // J'avais d'abord mis un « mobile » générique en supposant, comme iPay, un
  // routage par le numéro : c'était faux, et un code inventé enverrait
  // l'argent sur le mauvais réseau.
  const attendus: Record<string, string> = {
    orange_cm: "CM_ORANGEMONEY",
    mtn_cm: "CM_MTNMOBILEMONEY",
    eu_cm: "CM_EUMM",
    mtn_cg: "CG_MTNMOBILEMONEY",
    airtel_cg: "CG_AIRTELMONEY",
    moov_ga: "GA_MOOVMONEY",
  };
  for (const [code, natif] of Object.entries(attendus)) {
    expect(routeFor(code, "monetbil", "collect")?.code, code).toBe(natif);
  }
});

test("Monetbil ouvre le Congo et le Gabon, invendables jusqu'ici", () => {
  // Le Congo n'etait servi que par FeexPay ; le Gabon par personne.
  expect(routeFor("moov_ga", "monetbil", "collect")).not.toBeNull();
  expect(routeFor("airtel_cg", "monetbil", "collect")).not.toBeNull();
  // MTN Congo a desormais DEUX passerelles : une panne chez l'une ne ferme
  // plus le pays.
  const mtnCg = Object.keys(OPERATORS).includes("mtn_cg");
  expect(mtnCg).toBe(true);
  expect(routeFor("mtn_cg", "feexpay", "collect")).not.toBeNull();
  expect(routeFor("mtn_cg", "monetbil", "collect")).not.toBeNull();
});

test("le statut Monetbil est réellement consultable par la réconciliation", () => {
  // Sans lecteur de statut, une vente camerounaise partirait puis resterait
  // « en attente » pour toujours — le défaut exact qui a bloqué FeexPay.
  const src = readFileSync(join(process.cwd(), "lib/payments/reconcile-collect.ts"), "utf8");
  expect(src).toContain("monetbil: async (ref)");
  expect(src).toContain('await import("@/lib/monetbil")');
});

test("le paiement Monetbil est réellement lancé par payment/init", () => {
  const src = readFileSync(join(process.cwd(), "app/api/formations/payment/init/route.ts"), "utf8");
  expect(src).toContain('candidate.provider === "monetbil"');
});

test("la clé Monetbil est saisissable depuis l'écran admin", () => {
  // Sans champ déclaré, la passerelle serait visible mais impossible à
  // configurer autrement qu'en variable d'environnement — donc inutilisable
  // pour quelqu'un qui n'a pas accès à Vercel.
  const src = readFileSync(join(process.cwd(), "lib/payments/gateways.ts"), "utf8");
  expect(src).toContain("monetbil: [{ key: \"serviceKey\"");
});
