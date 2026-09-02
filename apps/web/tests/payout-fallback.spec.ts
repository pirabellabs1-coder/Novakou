import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PayoutNeverSentError } from "../lib/payout/proxy-fetch";
import { classifyFeexpayError } from "../lib/feexpay";
import { classifyFedapayError } from "../lib/fedapay";

/**
 * Basculer de passerelle sur un versement est SÛR ou DANGEREUX selon une seule
 * question : la requête a-t-elle pu atteindre le fournisseur ?
 *
 *   • Connexion jamais établie (DNS, refus, proxy injoignable) → rien n'a pu
 *     partir, on peut essayer ailleurs.
 *   • Délai d'attente, coupure en cours, 5xx → le versement est peut-être
 *     parti. Recommencer ailleurs paierait DEUX FOIS.
 *
 * Le 2026-08-04, un retrait de 100 F a été bloqué parce qu'une panne de proxy
 * était classée « ambiguë » : aucune autre passerelle n'a été tentée alors que
 * FedaPay servait le même opérateur et que rien n'était parti.
 */

const jamaisEnvoye = new PayoutNeverSentError("ECONNREFUSED", new Error("connect ECONNREFUSED"));

test("une connexion jamais établie autorise la bascule", () => {
  for (const c of [classifyFeexpayError(jamaisEnvoye.message, jamaisEnvoye),
                   classifyFedapayError(jamaisEnvoye.message, jamaisEnvoye)]) {
    expect(c.category).toBe("never_sent");
  }
});

test("un délai d'attente reste ambigu et INTERDIT la bascule", () => {
  // Pas d'objet d'erreur typé : on ne sait pas si la requête est partie.
  for (const c of [classifyFeexpayError("request timeout after 30s"),
                   classifyFedapayError("request timeout after 30s")]) {
    expect(c.category, "un timeout ne doit jamais autoriser un second versement").toBe("network");
  }
});

test("le type prime sur le texte du message", () => {
  // Même si le message ressemble à une erreur de validation, un objet
  // PayoutNeverSentError fait autorité : c'est un fait, pas une devinette.
  const trompeur = new PayoutNeverSentError("ENOTFOUND", new Error("invalid_phone validation"));
  expect(classifyFeexpayError("invalid_phone validation", trompeur).category).toBe("never_sent");
});

test("le code système est visible dans le message", () => {
  // Sans lui, on ne peut pas distinguer une panne de proxy d'une panne de
  // fournisseur — c'est ce qui a rendu l'incident du 4 août illisible.
  expect(classifyFeexpayError(jamaisEnvoye.message, jamaisEnvoye).userMessage).toContain("ECONNREFUSED");
});

/**
 * L'ordre des passerelles de versement est une décision du fondateur. Le test
 * le FIGE pour qu'un remaniement ne l'inverse pas par inadvertance.
 *
 * ⚠️ Changer l'ordre est parfaitement légitime — il l'a déjà été (« PawaPay
 * ouvert au retrait, ordre réel des passerelles »). Mais alors METTEZ CETTE
 * LIGNE À JOUR DANS LE MÊME COMMIT. Faute de quoi le test reste rouge, on
 * s'habitue au rouge, et il ne protège plus rien : c'est exactement ce qui
 * s'est produit entre le 2026-08-24 et aujourd'hui.
 */
test("l'ordre de bascule des versements est celui décidé", () => {
  const src = readFileSync(join(process.cwd(), "lib/payout/execute.ts"), "utf8");
  expect(src).toContain(
    'const PROVIDER_ORDER: PayoutProviderId[] = ["pawapay", "feexpay", "fedapay", "monetbil"]',
  );
});

/**
 * Le proxy à IP fixe ne sert plus QUE FeexPay : son forfait Fixie était
 * consommé par des fournisseurs qui ne filtrent pas par IP. FedaPay, Monetbil
 * et iPay sortent donc en direct — decision assumee, pas une regression.
 * Le test exigeait les DEUX passerelles sur le proxy et echouait depuis.
 */
test("le versement FeexPay sort par le proxy à IP fixe", () => {
  const src = readFileSync(join(process.cwd(), "lib/feexpay.ts"), "utf8");
  expect(src, "lib/feexpay.ts doit passer par payoutFetch").toContain("payoutFetch(");
});

test("une panne de proxy est réessayée en direct, pas abandonnée", () => {
  const src = readFileSync(join(process.cwd(), "lib/payout/proxy-fetch.ts"), "utf8");
  // Le repli ne doit exister QUE sur un échec de connexion : sur une erreur
  // ambiguë, réessayer pourrait déclencher un second versement.
  expect(src).toContain("CODES_JAMAIS_ENVOYE.has(code)");
  // On cherche le COMPORTEMENT (le repli), pas une tournure de commentaire :
  // la formulation exacte « nouvelle tentative en direct » a ete reecrite, et
  // le test tombait alors que le repli, lui, n'avait pas bouge.
  expect(src).toContain("repli en direct");
});

test("le code système survit jusqu'au message conservé", () => {
  // Sans lui, « temporairement injoignable » ne dit pas s'il faut corriger le
  // proxy ou prévenir le fournisseur. L'incident du 4 août l'a montré.
  const faux = Object.assign(new TypeError("fetch failed"), {
    cause: Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }),
  });
  expect(classifyFeexpayError("fetch failed", faux).userMessage).toContain("ECONNRESET");
  expect(classifyFedapayError("fetch failed", faux).userMessage).toContain("ECONNRESET");
});
