import { test, expect } from "@playwright/test";
import {
  PAYOUT_METHODS,
  getAvailablePayoutMethods,
  isPayoutMethodServable,
  normalizeMsisdn,
} from "../lib/moneroo-payout-methods";
import { OPERATORS, PROVIDERS, routeFor, isSupported } from "../lib/payments/registry";

/**
 * Le retrait ne doit JAMAIS proposer un moyen par lequel on ne sait pas envoyer
 * d'argent. Un moyen affiché est une promesse de versement.
 *
 * Avant ce garde-fou, 11 des 23 moyens du catalogue (Cameroun, Kenya, Tanzanie,
 * Ouganda, Rwanda, Zambie, Djamo, E-Money) n'avaient aucune passerelle capable
 * de les payer : la demande partait et restait bloquée en attente d'un admin.
 */

test("aucun moyen de retrait proposé sans passerelle capable de le payer", () => {
  const proposes = getAvailablePayoutMethods(null);
  expect(proposes.length).toBeGreaterThan(0);
  for (const m of proposes) {
    expect(isSupported(m.id, "payout"), `${m.id} est proposé mais aucune passerelle ne le verse`).toBe(true);
  }
});

test("tout opérateur versable par une passerelle est bien proposé", () => {
  const versables = Object.keys(OPERATORS).filter((code) =>
    PROVIDERS.filter((p) => p.directions.includes("payout")).some((p) => routeFor(code, p.id, "payout")),
  );
  const proposes = new Set(getAvailablePayoutMethods(null).map((m) => m.id));
  for (const code of versables) {
    expect(proposes.has(code), `${code} est payable mais reste caché au vendeur`).toBe(true);
  }
});

test("un pays sans route de versement ne propose rien plutôt que du faux", () => {
  // Le Cameroun et le Burkina n'ont aucune route de versement aujourd'hui.
  // Mieux vaut une liste vide qu'un moyen qui échouera.
  for (const pays of ["CM", "BF", "KE"]) {
    expect(getAvailablePayoutMethods(pays), `${pays} propose des moyens impayables`).toHaveLength(0);
  }
});

test("les pays réellement couverts proposent leurs moyens", () => {
  expect(getAvailablePayoutMethods("BJ").map((m) => m.id)).toContain("mtn_bj");
  expect(getAvailablePayoutMethods("TG").map((m) => m.id)).toContain("togocel");
  expect(getAvailablePayoutMethods("NE").map((m) => m.id)).toContain("airtel_ne");
});

test("le filtre ne dépend pas du catalogue historique mais du registre", () => {
  // Les moyens hérités de l'ancienne passerelle restent dans le catalogue
  // (historique des retraits déjà versés) mais ne doivent plus être offerts.
  const retires = PAYOUT_METHODS.filter((m) => !isPayoutMethodServable(m.id)).map((m) => m.id);
  expect(retires).toContain("mtn_cm");
  expect(retires).toContain("mpesa_ke");
  expect(getAvailablePayoutMethods(null).map((m) => m.id)).not.toContain("mtn_cm");
});

/**
 * Le numéro qui reçoit l'argent doit sortir dans UN seul format, quelle que
 * soit la façon dont il est entré. L'écran de retrait renvoie « indicatif +
 * numéro saisi » : sans normalisation idempotente, un Béninois qui tape son 0
 * envoyait « 2290157335726 » (13 chiffres) au lieu de « 22957335726 ».
 */
test("le numéro de versement sort au même format quelle que soit la saisie", () => {
  const attendu = "22957335726";
  for (const saisie of ["0157335726", "2290157335726", "57335726", "22957335726", "+229 01 57 33 57 26"]) {
    expect(normalizeMsisdn(saisie, "mtn_bj"), `saisie « ${saisie} »`).toBe(attendu);
  }
  for (const saisie of ["771234567", "0771234567", "221771234567", "+221 77 123 45 67"]) {
    expect(normalizeMsisdn(saisie, "orange_sn"), `saisie « ${saisie} »`).toBe("221771234567");
  }
});

test("normaliser deux fois ne change rien", () => {
  for (const code of ["mtn_bj", "orange_sn", "togocel", "orange_ml"]) {
    const une = normalizeMsisdn("0157335726", code);
    expect(normalizeMsisdn(une, code)).toBe(une);
  }
});
