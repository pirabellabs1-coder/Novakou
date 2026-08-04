import { test, expect } from "@playwright/test";
import { estPasserelleRetiree } from "../lib/payments/removed-gateways";
import { estSondeDiagnostic } from "../lib/payments/diagnostic-probe";

/**
 * Une alerte ne vaut que par son silence.
 *
 * Le 2026-08-04, l'alerte des ventes bloquées annonçait « 6 ventes bloquées »
 * dont la moitié étaient des tentatives d'une passerelle RETIRÉE, datant de
 * juillet. Le code ne peut plus les interroger : elles se resignalaient toutes
 * les quinze minutes, pour toujours. Répéter une chose qu'on ne peut pas
 * corriger apprend à ignorer l'alerte — et c'est ainsi qu'on rate la vraie.
 */

test("les passerelles retirées ne déclenchent plus d'alerte", () => {
  for (const p of ["moneroo", "Moneroo", " PAYGENIUS ", "geniuspay"]) {
    expect(estPasserelleRetiree(p), `${p} devrait être reconnue comme retirée`).toBe(true);
  }
});

test("les passerelles en service continuent d'alerter", () => {
  for (const p of ["feexpay", "fedapay", "kkiapay", "ipaymoney"]) {
    expect(estPasserelleRetiree(p), `${p} est en service, elle doit alerter`).toBe(false);
  }
});

test("une passerelle absente ou vide n'est pas prise pour retirée", () => {
  // Sans cette garde, une tentative sans passerelle serait classée « retirée »
  // et disparaîtrait de l'alerte — exactement le silence qu'on combat.
  for (const p of [null, undefined, "", "   ", 42]) {
    expect(estPasserelleRetiree(p)).toBe(false);
  }
});

test("seule l'adresse dédiée identifie une sonde de diagnostic", () => {
  expect(estSondeDiagnostic({ visitorEmail: "diagnostic.novakou@gmail.com" })).toBe(true);
  // Un vrai acheteur ne doit JAMAIS être écarté sur la forme de ses données.
  expect(estSondeDiagnostic({ visitorEmail: "client@exemple.com" })).toBe(false);
  expect(estSondeDiagnostic({})).toBe(false);
});
