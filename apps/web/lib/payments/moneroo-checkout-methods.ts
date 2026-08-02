// Correspondance entre nos codes de paiement internes (ceux affichés à
// l'acheteur au checkout) et les shortcodes de méthode Moneroo.
//
// POURQUOI CE FICHIER : /payments/initialize accepte un tableau `methods`
// OPTIONNEL. La doc Moneroo précise que fournir ce tableau RESTREINT la page de
// paiement aux méthodes listées ; l'omettre autorise toutes les méthodes.
// Jusqu'ici on ne l'envoyait jamais → l'acheteur qui cliquait « Carte bancaire »
// chez nous atterrissait sur la page Moneroo ouverte sur le Mobile Money.
// C'était le bug « la sélection carte/PayPal renvoie vers le paiement mobile ».
//
// ⚠️ RÈGLE : ne JAMAIS inventer de shortcode. Un code inconnu fait échouer
// l'initialisation → checkout totalement cassé. Tous les codes ci-dessous
// proviennent de la liste officielle (docs.moneroo.io, méthodes disponibles).
//
// Codes vérifiés :
//   XOF : card_xof · orange_bf/ci/ml/sn · wave_ci/sn · mtn_bj/ci ·
//         moov_bf/bj/ci/ml/tg · e_money_sn · freemoney_sn · wizall_sn
//   XAF : card_xaf · orange_cm · mtn_cm
//
// NON SUPPORTÉS par Moneroo (aucun shortcode n'existe) :
//   - PayPal        → ne peut jamais aboutir
//   - Virement bancaire → seul `bank_transfer_ng` existe (Nigeria/NGN),
//                         donc inutilisable pour nos paiements XOF/XAF.

export type CheckoutCurrency = "XOF" | "XAF";

/**
 * Un opérateur Mobile Money couvre plusieurs pays. On ne connaît pas toujours
 * le pays de l'acheteur au moment du choix : on transmet donc TOUS les codes
 * de l'opérateur pour la devise, et l'acheteur choisit son pays sur la page
 * Moneroo. Le choix reste restreint à l'opérateur qu'il a demandé.
 */
const METHOD_MAP: Record<CheckoutCurrency, Record<string, string[]>> = {
  XOF: {
    card: ["card_xof"],
    orange_money: ["orange_ci", "orange_sn", "orange_ml", "orange_bf"],
    wave: ["wave_ci", "wave_sn"],
    mtn_momo: ["mtn_bj", "mtn_ci"],
    moov_money: ["moov_bj", "moov_ci", "moov_tg", "moov_ml", "moov_bf"],
    free_money: ["freemoney_sn"],
    e_money: ["e_money_sn"],
    wizall: ["wizall_sn"],
  },
  XAF: {
    card: ["card_xaf"],
    orange_money: ["orange_cm"],
    mtn_momo: ["mtn_cm"],
  },
};

/** Méthodes proposées dans l'UI mais qu'aucune passerelle ne peut honorer. */
export const UNSUPPORTED_CHECKOUT_METHODS = ["paypal", "bank_transfer"];

/** Vrai si la méthode interne peut réellement aboutir à un paiement. */
export function isCheckoutMethodSupported(
  method: string | null | undefined,
  currency: CheckoutCurrency = "XOF",
): boolean {
  if (!method) return false;
  return resolveMonerooMethods(method, currency).length > 0;
}

/**
 * Traduit un code interne en shortcodes Moneroo.
 * Renvoie [] si la méthode est inconnue ou non supportée — l'appelant NE DOIT
 * alors PAS envoyer `methods` (sinon l'init échoue), ce qui laisse Moneroo
 * afficher toutes ses méthodes : dégradation sûre, jamais de checkout cassé.
 */
export function resolveMonerooMethods(
  method: string | null | undefined,
  currency: CheckoutCurrency = "XOF",
): string[] {
  if (!method) return [];
  const key = String(method).trim().toLowerCase();
  return METHOD_MAP[currency]?.[key] ?? [];
}
