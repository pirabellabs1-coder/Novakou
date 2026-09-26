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

// Ce fichier testait « le Cameroun devient encaissable » par Monetbil. Deux
// decisions l'ont vide de son objet : « le Cameroun passe par PawaPay seul,
// Monetbil retire d'Orange/MTN CM », puis « aligner le registre sur la
// couverture REELLE du compte PawaPay ». Constat d'aujourd'hui : PLUS AUCUNE
// passerelle n'encaisse orange_cm ni mtn_cm.
//
// L'assertion est retiree — un test de Monetbil n'a pas a se prononcer sur un
// pays qu'il ne sert plus. Que le Cameroun soit redevenu invendable est un
// fait metier a arbitrer par le fondateur, pas a figer ici.

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

test("Monetbil ne route plus aucun opérateur (retrait du 2026-09-25)", () => {
  // Sur tout l'historique : 0 encaissement abouti, 23 refus « OPERATOR_NOT_FOUND »
  // (Guinée MTN/Orange). Un acheteur guinéen a essayé 12 fois. Proposer Monetbil,
  // c'était un échec garanti : TOUTES ses routes sont retirées du registre.
  // Les codes documentés restent notés en commentaire dans registry.ts pour la
  // réouverture, après un paiement de test réel abouti.
  for (const code of Object.keys(OPERATORS)) {
    expect(routeFor(code, "monetbil", "collect"), `${code} ne doit plus router vers Monetbil`).toBeNull();
    expect(routeFor(code, "monetbil", "payout"), `${code} ne doit plus verser via Monetbil`).toBeNull();
  }
});

test("l'adaptateur Monetbil reste déclaré, encaissement seul, sans route active", () => {
  // Le module et la passerelle existent toujours (clé saisissable en admin,
  // réconciliation capable de relire un ancien statut) — seule la couverture
  // est fermée. Le jour où un paiement de test aboutit, on rouvre opérateur
  // par opérateur avec les codes documentés, jamais devinés.
  const meta = PROVIDERS.find((p) => p.id === "monetbil");
  expect(meta).toBeDefined();
  expect(meta?.directions).toEqual(["collect"]);
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
