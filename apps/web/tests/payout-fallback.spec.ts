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
 * L'ordre des passerelles de versement est une décision du fondateur
 * (2026-08-04) : FedaPay d'abord, FeexPay en secours. Un test le fige pour
 * qu'un futur remaniement ne l'inverse pas par inadvertance.
 */
test("le versement essaie FedaPay avant FeexPay", () => {
  const src = readFileSync(join(process.cwd(), "lib/payout/execute.ts"), "utf8");
  expect(src).toContain('const PROVIDER_ORDER: PayoutProviderId[] = ["fedapay", "feexpay"]');
});
