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

/**
 * Manque CONNU, en attente d'un arbitrage du fondateur.
 *
 * Une passerelle sait payer ces dix operateurs, mais le catalogue de retrait
 * n'a AUCUNE entree pour leur pays. Concretement : un vendeur de RDC, du
 * Congo, du Gabon, du Rwanda, d'Ouganda, de Zambie ou de Sierra Leone ne peut
 * pas retirer son argent, alors que nous saurions le lui envoyer.
 *
 * Ouvrir un pays au retrait — libelle, montant minimum, opportunite — est une
 * decision metier, pas un detail a deviner dans un test.
 *
 * Le manque n'est ni masque ni bloquant : il est NOMME. Le test echoue des
 * qu'un AUTRE operateur rejoint ce cas, pour que la liste ne grossisse pas en
 * silence. Retirer une ligne d'ici le jour ou le pays est ouvert.
 */
const PAYABLES_NON_OFFERTS_CONNUS = [
  "airtel_cd", "orange_cd",   // RD Congo
  "airtel_cg", "mtn_cg",      // Congo
  "airtel_ga",                // Gabon
  "mtn_rw",                   // Rwanda
  "mtn_ug",                   // Ouganda
  "mtn_zm", "zamtel_zm",      // Zambie
  "orange_sl",                // Sierra Leone
];

test("aucun opérateur versable ne devient invisible sans qu'on le sache", () => {
  const versables = Object.keys(OPERATORS).filter((code) =>
    PROVIDERS.filter((p) => p.directions.includes("payout")).some((p) => routeFor(code, p.id, "payout")),
  );
  const proposes = new Set(getAvailablePayoutMethods(null).map((m) => m.id));
  const caches = versables.filter((code) => !proposes.has(code));
  expect(
    caches.sort(),
    "Un opérateur est devenu payable sans être proposé au vendeur. Ajoutez-le " +
      "au catalogue de retrait, ou inscrivez-le dans PAYABLES_NON_OFFERTS_CONNUS " +
      "avec la raison.",
  ).toEqual([...PAYABLES_NON_OFFERTS_CONNUS].sort());
});

test("un pays sans route de versement ne propose rien plutôt que du faux", () => {
  // La liste « CM, BF, KE » etait figee : depuis, PawaPay a ouvert le retrait
  // la ou le compte le sert, et le Cameroun comme le Kenya sont couverts. On
  // ne cite donc plus de pays : on parcourt CEUX qui n'ont aucune route, quels
  // qu'ils soient. L'invariant survit aux arbitrages de couverture.
  const paysDuCatalogue = [...new Set(PAYOUT_METHODS.flatMap((m) => m.countries))];
  const sansRoute = paysDuCatalogue.filter(
    (pays) => !PAYOUT_METHODS.some((m) => m.countries.includes(pays) && isPayoutMethodServable(m.id)),
  );
  for (const pays of sansRoute) {
    expect(getAvailablePayoutMethods(pays), `${pays} propose des moyens impayables`).toHaveLength(0);
  }
});

test("les pays réellement couverts proposent leurs moyens", () => {
  expect(getAvailablePayoutMethods("BJ").map((m) => m.id)).toContain("mtn_bj");
  expect(getAvailablePayoutMethods("TG").map((m) => m.id)).toContain("togocel");
  expect(getAvailablePayoutMethods("NE").map((m) => m.id)).toContain("airtel_ne");
});

test("le filtre ne dépend pas du catalogue historique mais du registre", () => {
  // Les moyens hérités d'une passerelle retiree restent dans le catalogue
  // (historique des retraits déjà versés) mais ne doivent plus être offerts.
  // On ne nomme plus « mtn_cm » ni « mpesa_ke » : tous deux sont redevenus
  // servables via PawaPay, et le test s'opposait a une ouverture voulue.
  // L'invariant reel : ce que le registre ne sait pas payer n'est pas offert.
  const nonServables = PAYOUT_METHODS.filter((m) => !isPayoutMethodServable(m.id)).map((m) => m.id);
  const offerts = getAvailablePayoutMethods(null).map((m) => m.id);
  for (const id of nonServables) {
    expect(offerts, `${id} n'est pas payable et ne doit pas être offert`).not.toContain(id);
  }
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
  // Le nom du test le disait deja : « sans liste a maintenir ». Il en tenait
  // pourtant une, et elle a rouille. Elle est desormais derivee du catalogue.
  const paysDuCatalogue = [...new Set(PAYOUT_METHODS.flatMap((m) => m.countries))];
  const sansRoute = paysDuCatalogue.filter(
    (p) => !PAYOUT_METHODS.some((m) => m.countries.includes(p) && isPayoutMethodServable(m.id)),
  );
  for (const pays of sansRoute) {
    expect(isPayoutCountryDisabled(pays), `${pays} ouvert sans route de versement`).toBe(true);
  }
});

/**
 * Le montant minimum de retrait doit être LE MÊME partout. Il valait 100 côté
 * admin, 1 000 côté vendeur, 5 000 côté mentor et affilié : un vendeur voyait
 * son bouton grisé sans explication.
 */
test("aucun moyen servable n'exige plus que le minimum global", () => {
  // MIN_WITHDRAWAL_XOF est libelle en XOF : le comparer au minimum d'un moyen
  // libelle en UGX ou en KES compare des grandeurs sans rapport (airtel_ug
  // exige 1 000 UGX, soit environ 160 XOF — ce n'est pas une incoherence).
  // On borne donc la regle aux moyens de la meme devise.
  const enXof = getAvailablePayoutMethods(null).filter((m) => m.currency === "XOF");
  expect(enXof.length, "aucun moyen en XOF : le catalogue est vide ?").toBeGreaterThan(0);
  for (const m of enXof) {
    expect(m.minAmount, `${m.id} exige ${m.minAmount} > ${MIN_WITHDRAWAL_XOF}`).toBeLessThanOrEqual(MIN_WITHDRAWAL_XOF);
  }
});
