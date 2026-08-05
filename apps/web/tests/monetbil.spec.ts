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

test("un seul code par pays : c'est le fournisseur qui route", () => {
  // Monetbil choisit l'opérateur d'après le NUMÉRO. Inventer un code par
  // réseau créerait une distinction que leur API ne fait pas.
  const cm = Object.entries(OPERATORS).filter(([, o]) => (o as { country?: string }).country === "cm");
  for (const [code] of cm) {
    expect(routeFor(code, "monetbil", "collect")?.code).toBe("mobile");
  }
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
