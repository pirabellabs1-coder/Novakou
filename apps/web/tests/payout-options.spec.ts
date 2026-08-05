import { test, expect } from "@playwright/test";
import {
  PAYOUT_METHODS,
  getAvailablePayoutMethods,
  isPayoutMethodServable,
  normalizeMsisdn,
  isPayoutCountryDisabled,
  MIN_WITHDRAWAL_XOF,
} from "../lib/payments/payout-catalog";
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
  // Bénin : le « 01 » fait PARTIE du numéro depuis le plan à 10 chiffres. On le
  // retirait, produisant « 22957335726 » — un numéro qui n'existe plus. FeexPay
  // acceptait le versement puis le transfert échouait, et le motif accusait les
  // « coordonnées » du vendeur, qui étaient pourtant justes.
  const attendu = "2290157335726";
  for (const saisie of ["0157335726", "2290157335726", "+229 01 57 33 57 26"]) {
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

/**
 * Un pays est fermé au retrait UNIQUEMENT quand aucune passerelle n'y verse.
 *
 * Auparavant une liste écrite à la main gardait le Sénégal et la Côte d'Ivoire
 * fermés longtemps après que FeexPay et FedaPay aient su y envoyer l'argent.
 * Personne ne pensait à la mettre à jour, et les vendeurs de ces pays lisaient
 * « bientôt disponible » pour un service déjà opérationnel.
 */
test("un pays servi par une passerelle est ouvert au retrait", () => {
  for (const pays of ["BJ", "CI", "SN", "TG", "ML", "NE"]) {
    expect(getAvailablePayoutMethods(pays).length, `${pays} sans moyen`).toBeGreaterThan(0);
    expect(isPayoutCountryDisabled(pays), `${pays} fermé alors qu'on sait y verser`).toBe(false);
  }
});

test("un pays sans route reste fermé, sans liste à maintenir", () => {
  for (const pays of ["CM", "BF", "KE"]) {
    expect(isPayoutCountryDisabled(pays), `${pays} ouvert sans route de versement`).toBe(true);
  }
});

/**
 * Le montant minimum de retrait doit être LE MÊME partout. Il valait 100 côté
 * admin, 1 000 côté vendeur, 5 000 côté mentor et affilié : un vendeur voyait
 * son bouton grisé sans explication.
 */
test("aucun moyen servable n'exige plus que le minimum global", () => {
  for (const m of getAvailablePayoutMethods(null)) {
    expect(m.minAmount, `${m.id} exige ${m.minAmount} > ${MIN_WITHDRAWAL_XOF}`).toBeLessThanOrEqual(MIN_WITHDRAWAL_XOF);
  }
});
