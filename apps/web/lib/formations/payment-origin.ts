/**
 * Classification de l'ORIGINE réelle d'un accès (Enrollment /
 * DigitalProductPurchase) à partir du préfixe de `stripeSessionId` — la seule
 * donnée qui encode comment l'accès a été obtenu. Répond à la question du
 * fondateur : « cet apprenant a-t-il PAYÉ ou pas ? ».
 *
 * Préfixes posés par le code (vérifiés 2026-07-24) :
 *   mnr: / pg:                → paiement réel via passerelle (init moderne)
 *   orange_money:/wave:/mtn_momo:/moov_money:/card: → paiements réels de
 *                               l'ancien checkout inline (avant payment/init)
 *   free:                     → commande gratuite (total 0) — AUCUN argent reçu
 *   gift:<userId>             → offert par le vendeur
 *   sub_<subId>               → accès hérité d'un abonnement
 *   bundle_<purchaseId>       → accès hérité d'un pack (payé au niveau du pack)
 *   dev: / mock:              → test développement
 */

export type PaymentOrigin =
  | "paid"          // argent réellement encaissé pour CET item
  | "free"          // gratuit (prix 0 ou commande gratuite)
  | "gift"          // offert par le vendeur
  | "subscription"  // via abonnement (payant au niveau de l'abonnement)
  | "bundle"        // via pack (payant au niveau du pack)
  | "test"          // dev/mock
  | "unknown";      // référence non reconnue avec montant > 0 — à vérifier

const PAID_PREFIXES = [
  "mnr:", "pg:", "moneroo:",
  "orange_money:", "wave:", "mtn_momo:", "mtn:", "moov_money:", "moov:", "card:",
];

export function classifyPaymentOrigin(
  sessionRef: string | null | undefined,
  paidAmount: number,
): PaymentOrigin {
  const ref = (sessionRef ?? "").toLowerCase();
  if (ref.startsWith("free:")) return "free";
  if (ref.startsWith("gift:")) return "gift";
  if (ref.startsWith("dev:") || ref.startsWith("mock:")) return "test";
  if (ref.startsWith("sub_")) return "subscription";
  if (ref.startsWith("bundle_")) return "bundle";
  if (PAID_PREFIXES.some((p) => ref.startsWith(p))) return "paid";
  return paidAmount > 0 ? "unknown" : "free";
}

/** Libellés FR courts pour l'admin. */
export const ORIGIN_LABEL_FR: Record<PaymentOrigin, string> = {
  paid: "Payé",
  free: "Gratuit",
  gift: "Offert",
  subscription: "Abonnement",
  bundle: "Pack",
  test: "Test",
  unknown: "À vérifier",
};

/** True si de l'argent a réellement été encaissé pour cet item précis. */
export function isRealCash(origin: PaymentOrigin): boolean {
  return origin === "paid";
}
