import { test, expect } from "@playwright/test";
import { montantAVerser, viderCacheTauxVersement, REFERENCE_VERSEMENT } from "../lib/currency/taux-versement";
import { normalizeMsisdn } from "../lib/payments/payout-catalog";

/**
 * Versements hors zone franc : on convertit au taux du jour, arrondi VERS LE
 * BAS. Se tromper ici, c'est payer de l'argent réel en trop (le taux
 * d'affichage arrondi vers le haut faisait 100 FCFA → 30 KES, +32 %) ou payer
 * avec un taux faux. La source de taux est simulée : aucun appel réseau.
 */

const fetchReel = globalThis.fetch;
function sourceSimulee(rates: Record<string, number>, opts: { ageHeures?: number; panne?: boolean } = {}) {
  viderCacheTauxVersement();
  globalThis.fetch = (async () => {
    if (opts.panne) throw new Error("réseau coupé");
    const majLe = Math.floor((Date.now() - (opts.ageHeures ?? 1) * 3600_000) / 1000);
    return new Response(JSON.stringify({ result: "success", rates, time_last_update_unix: majLe }), { status: 200 });
  }) as typeof fetch;
}
test.afterEach(() => {
  globalThis.fetch = fetchReel;
  viderCacheTauxVersement();
});

test("zone franc : montant inchangé, aucune source de taux consultée", async () => {
  sourceSimulee({}, { panne: true });
  expect(await montantAVerser(1000, "XOF")).toMatchObject({ montant: 1000, devise: "XOF" });
  expect(await montantAVerser(1000, "XAF")).toMatchObject({ montant: 1000, devise: "XAF" });
});

test("hors zone franc : taux du jour arrondi vers le bas, jamais plus que dû", async () => {
  sourceSimulee({ KES: 0.2228, CDF: 3.97, UGX: 6.82, RWF: 2.53, ZMW: 0.0339, SLE: 0.0423 });
  expect((await montantAVerser(1000, "KES")).montant).toBe(222);
  expect((await montantAVerser(1000, "ZMW")).montant).toBe(33);
  for (const devise of Object.keys(REFERENCE_VERSEMENT)) {
    for (const fcfa of [100, 999, 1000, 12_345, 250_000]) {
      const v = await montantAVerser(fcfa, devise);
      // Comparé dans la devise versée (marge des seuls arrondis flottants) :
      // jamais plus que le montant FCFA converti au taux du jour.
      expect(v.montant, `${fcfa} FCFA en ${devise}`).toBeLessThanOrEqual(fcfa * v.taux + 1e-9);
      expect(fcfa * v.taux - v.montant, `${fcfa} FCFA en ${devise} : perte < 1 unité`).toBeLessThan(1);
    }
  }
});

test("taux incohérent (> 10 % de la référence) : rien n'est versé, retrait en attente", async () => {
  sourceSimulee({ KES: 0.2228 * 1.2 });
  await expect(montantAVerser(1000, "KES")).rejects.toThrow(/^TAUX_INDISPONIBLE/);
});

test("taux périmé (> 48 h) ou source en panne : rien n'est versé, retrait en attente", async () => {
  sourceSimulee({ KES: 0.2228 }, { ageHeures: 60 });
  await expect(montantAVerser(1000, "KES")).rejects.toThrow(/^TAUX_INDISPONIBLE/);
  sourceSimulee({}, { panne: true });
  await expect(montantAVerser(1000, "KES")).rejects.toThrow(/^TAUX_INDISPONIBLE/);
});

test("devise sans référence ou montant sous l'unité : refus définitif", async () => {
  sourceSimulee({ GHS: 0.0206, SLE: 0.0423 });
  await expect(montantAVerser(1000, "GHS")).rejects.toThrow(/^PAYOUTS_NOT_ALLOWED/);
  await expect(montantAVerser(10, "SLE")).rejects.toThrow(/^PAYOUTS_NOT_ALLOWED/);
  await expect(montantAVerser(0, "XOF")).rejects.toThrow(/^PAYOUTS_NOT_ALLOWED/);
});

/**
 * Le 0 de tête fait partie du numéro en Côte d'Ivoire, au Congo et au Bénin
 * (formats confirmés par PawaPay /v2/predict-provider le 2026-10-05). On le
 * retirait pour la Côte d'Ivoire : numéros à 12 chiffres au lieu de 13, refus
 * FeexPay « Validation failed ». Les numéros déjà enregistrés amputés sont
 * réparés.
 */
test("numéros : le 0 ivoirien et congolais est gardé, les numéros amputés réparés", () => {
  for (const saisie of ["07 07 12 34 56", "2250707123456", "225707123456", "+225 07 07 12 34 56"]) {
    expect(normalizeMsisdn(saisie, "orange_ci"), saisie).toBe("2250707123456");
  }
  for (const saisie of ["06 123 45 67", "242061234567", "24261234567"]) {
    expect(normalizeMsisdn(saisie, "mtn_cg"), saisie).toBe("242061234567");
  }
  expect(normalizeMsisdn("07 12 34 56", "airtel_ga")).toBe("24107123456");
  // Ancien plan béninois à 8 chiffres : le régulateur a ajouté « 01 » devant.
  expect(normalizeMsisdn("57335726", "mtn_bj")).toBe("2290157335726");
  expect(normalizeMsisdn("22957335726", "mtn_bj")).toBe("2290157335726");
  // Ailleurs, le 0 national tombe toujours.
  expect(normalizeMsisdn("0811234567", "vodacom_cd")).toBe("243811234567");
});
