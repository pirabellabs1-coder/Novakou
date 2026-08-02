// Orchestrateur de PAYOUT avec bascule automatique de fournisseur.
//
// Ordre de bascule : FeexPay → FedaPay.
// On tente chaque fournisseur configuré ET capable de servir l'opérateur du
// bénéficiaire. Si l'un REFUSE (solde insuffisant, IP non autorisée, validation),
// on rejoue le même versement chez le suivant. Aucun argent ne circule entre
// fournisseurs : c'est juste un ré-essai du versement ailleurs.
//
// ── SÛRETÉ MONÉTAIRE (le point le plus important) ──
// On ne bascule QUE sur un refus AVANT tout mouvement d'argent :
//   insufficient_funds / not_available / validation  → le fournisseur a dit non,
//   rien n'a bougé → on peut réessayer ailleurs sans risque.
// Sur une erreur AMBIGUË (réseau, timeout, 5xx, inconnue) on NE bascule PAS et
// on N'ÉCHOUE PAS : on s'arrête et on renvoie "ambiguous" pour que l'admin
// vérifie manuellement — car le versement a PEUT-ÊTRE été pris en compte, et
// rejouer ailleurs risquerait un DOUBLE paiement.
//
// Idempotence : dans un seul appel, on s'arrête au 1er fournisseur qui accepte
// (renvoie une référence). L'identifiant de retrait interne sert de clé
// l'id du retrait, ce qui protège les ré-essais du MÊME fournisseur.

import {
  initPayout as feexpayInit, isFeexpayConfigured, classifyFeexpayError, normalizeFeexpayStatus,
} from "@/lib/feexpay";
import {
  initPayout as fedapayInit, isFedapayConfigured, classifyFedapayError, normalizeFedapayStatus,
} from "@/lib/fedapay";
import { getPayoutMapping, baseMethodCode } from "@/lib/payout/methods-map";

export type PayoutProviderId = "feexpay" | "fedapay";

/** Ordre de tentative : le premier configuré ET capable emporte le versement. */
const PROVIDER_ORDER: PayoutProviderId[] = ["feexpay", "fedapay"];

export type PayoutExecutionInput = {
  /** Code opérateur interne (le suffixe _mentor est toléré). */
  method: string;
  amount: number;
  /** Numéro normalisé, chiffres + indicatif pays, SANS "+" (ex "2290166000000"). */
  msisdn: string;
  customer: { email: string; firstName: string; lastName: string };
  description: string;
  /** Id du retrait interne — sert d'idempotence et de référence webhook. */
  withdrawalId: string;
  /**
   * Test / diagnostic admin : forcer UN fournisseur précis, SANS bascule.
   * Permet à l'admin de router délibérément un versement de test à travers
   * FeexPay ou FedaPay sans laisser l'ordre de bascule décider.
   * En usage normal : laisser vide → ordre + bascule standard.
   */
  forceProvider?: PayoutProviderId;
};

export type PayoutAttempt = {
  provider: PayoutProviderId;
  outcome: "accepted" | "rejected" | "skipped" | "ambiguous";
  category?: string;
  detail?: string;
};

export type PayoutExecutionResult =
  | {
      ok: true;
      provider: PayoutProviderId;
      providerRef: string;
      /** "pending" = accepté, en cours (le webhook confirmera) ; "success" = déjà confirmé. */
      status: "pending" | "success";
      attempts: PayoutAttempt[];
    }
  | {
      ok: false;
      /**
       * rejected    : tous les fournisseurs ont refusé (rien n'a bougé) → REFUSE.
       * ambiguous   : arrêt de sûreté sur erreur non concluante → garder EN_ATTENTE
       *               et VÉRIFIER MANUELLEMENT (un versement a peut-être été pris).
       * no_provider : aucun fournisseur configuré ET capable pour cet opérateur.
       */
      terminal: "rejected" | "ambiguous" | "no_provider";
      userMessage: string;
      attempts: PayoutAttempt[];
    };

// Une catégorie d'erreur est-elle « sûre » pour basculer (aucun argent déplacé) ?
function isSafeToFallback(category: string): boolean {
  return category === "insufficient_funds" || category === "not_available" || category === "validation";
}

/**
 * Exécute un versement en essayant les fournisseurs dans l'ordre, avec bascule
 * sur refus. Ne déclenche jamais deux versements dans un même appel.
 */
export async function executePayout(input: PayoutExecutionInput): Promise<PayoutExecutionResult> {
  const method = baseMethodCode(input.method);
  const mapping = getPayoutMapping(method);
  const attempts: PayoutAttempt[] = [];
  // Devise : depuis la table ; défaut XOF (tous les opérateurs actuels sauf CM=XAF).
  const currency = mapping?.currency ?? "XOF";
  const motif = input.description || "Retrait Novakou";
  let lastRejectionMsg: string | null = null;

  // Forçage de test : un seul fournisseur, aucune bascule. Sinon ordre standard.
  const order = input.forceProvider ? [input.forceProvider] : PROVIDER_ORDER;

  for (const provider of order) {
    // 1) Configuré ?
    const configured = provider === "feexpay" ? isFeexpayConfigured() : isFedapayConfigured();
    if (!configured) {
      attempts.push({ provider, outcome: "skipped", detail: "non configuré" });
      continue;
    }

    // 2) Capable de servir cet opérateur ? Uniquement si le registre déclare
    //    une route confirmée : on n'invente jamais un endpoint de versement.
    const capable = provider === "feexpay" ? Boolean(mapping?.feexpay) : Boolean(mapping?.fedapay);
    if (!capable) {
      attempts.push({ provider, outcome: "skipped", detail: "opérateur non supporté" });
      continue;
    }

    // 3) Tentative de versement.
    try {
      if (provider === "feexpay") {
        const route = mapping!.feexpay!;
        const r = await feexpayInit({
          endpoint: route.endpoint,
          network: route.network,
          phoneNumber: input.msisdn,
          amount: input.amount,
          motif,
          callbackInfo: input.withdrawalId,
          email: input.customer.email,
        });
        const norm = normalizeFeexpayStatus(r.status);
        if (norm === "failed") {
          attempts.push({ provider, outcome: "rejected", category: "provider_failed", detail: `statut ${r.status}` });
          lastRejectionMsg = "FeexPay a refusé le versement.";
          continue;
        }
        attempts.push({ provider, outcome: "accepted", detail: `ref ${r.reference}` });
        return { ok: true, provider, providerRef: r.reference, status: norm === "success" ? "success" : "pending", attempts };
      }

      // fedapay
      const route = mapping!.fedapay!;
      const r = await fedapayInit({
        amount: input.amount,
        currencyIso: currency,
        mode: route.mode,
        phoneNumber: `+${input.msisdn}`,
        countryIso: mapping!.country,
        customer: { firstname: input.customer.firstName, lastname: input.customer.lastName, email: input.customer.email },
        description: motif,
        merchantReference: input.withdrawalId,
      });
      const norm = normalizeFedapayStatus(r.status);
      if (norm === "failed") {
        attempts.push({ provider, outcome: "rejected", category: "provider_failed", detail: `statut ${r.status}` });
        lastRejectionMsg = "FedaPay a refusé le versement.";
        continue;
      }
      attempts.push({ provider, outcome: "accepted", detail: `ref ${r.id}` });
      return { ok: true, provider, providerRef: r.id, status: norm === "success" ? "success" : "pending", attempts };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const { category, userMessage } =
        provider === "feexpay" ? classifyFeexpayError(msg) : classifyFedapayError(msg);

      if (isSafeToFallback(category)) {
        // Refus propre (rien n'a bougé) → on note et on tente le suivant.
        attempts.push({ provider, outcome: "rejected", category, detail: msg.slice(0, 300) });
        lastRejectionMsg = userMessage;
        continue;
      }

      // Erreur AMBIGUË → arrêt de sûreté. On NE tente pas un autre fournisseur
      // (risque de double paiement). L'admin doit vérifier.
      attempts.push({ provider, outcome: "ambiguous", category, detail: msg.slice(0, 300) });
      return {
        ok: false,
        terminal: "ambiguous",
        userMessage:
          `${userMessage} — versement NON confirmé chez ${provider}. ` +
          `Par sécurité, aucun autre fournisseur n'a été tenté (risque de double paiement). ` +
          `Vérifiez le tableau de bord ${provider} avant de relancer.`,
        attempts,
      };
    }
  }

  // Aucun fournisseur n'a accepté.
  const anyRejected = attempts.some((a) => a.outcome === "rejected");
  if (anyRejected) {
    return { ok: false, terminal: "rejected", userMessage: lastRejectionMsg ?? "Tous les fournisseurs ont refusé le versement.", attempts };
  }
  return {
    ok: false,
    terminal: "no_provider",
    userMessage: "Aucun fournisseur de paiement n'est configuré et capable de servir cet opérateur.",
    attempts,
  };
}
