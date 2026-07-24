/**
 * Math PURE du code promo au checkout — AUCUNE dépendance (pas de Prisma) pour
 * être testable en isolation. La logique avec DB vit dans `checkout-discount.ts`.
 */

export interface CheckoutDiscountLine {
  /** formationId ou productId */
  id: string;
  kind: "formation" | "product";
  /** prix unitaire en XOF (entier) */
  price: number;
  /** vendeur propriétaire de l'item (InstructeurProfile.id) */
  instructeurId: string;
}

/** Champs du DiscountCode dont dépend l'éligibilité (sous-ensemble pur). */
export interface DiscountRule {
  instructeurId: string;
  scope: "ALL" | "FORMATIONS" | "PRODUCTS" | "SPECIFIC";
  formationIds: string[];
  productIds: string[];
  discountType: string; // "PERCENTAGE" | "FIXED_AMOUNT" | …
  discountValue: number;
}

/**
 * Items éligibles = ceux du vendeur PROPRIÉTAIRE du code ET dans la portée.
 * Ferme la fuite inter-vendeur : un code ne touche jamais le catalogue d'autrui.
 */
export function selectEligible(
  rule: DiscountRule,
  lines: CheckoutDiscountLine[],
): CheckoutDiscountLine[] {
  return lines.filter((l) => {
    if (l.instructeurId !== rule.instructeurId) return false; // ownership
    switch (rule.scope) {
      case "ALL":
        return true;
      case "FORMATIONS":
        return l.kind === "formation";
      case "PRODUCTS":
        return l.kind === "product";
      case "SPECIFIC":
        return l.kind === "formation"
          ? rule.formationIds.includes(l.id)
          : rule.productIds.includes(l.id);
      default:
        return false;
    }
  });
}

/** Montant brut de la remise sur un sous-total éligible. */
export function rawDiscount(
  discountType: string,
  discountValue: number,
  eligibleSubtotal: number,
): number {
  if (eligibleSubtotal <= 0) return 0;
  const d =
    discountType === "PERCENTAGE"
      ? Math.round(eligibleSubtotal * (discountValue / 100))
      : Math.min(discountValue, eligibleSubtotal); // FIXED_AMOUNT
  return Math.max(0, Math.min(Math.round(d), eligibleSubtotal));
}

/**
 * Prix final d'un item après remise. La remise est répartie AU PRORATA sur les
 * SEULS items éligibles ; un item non éligible garde son prix plein.
 */
export function lineFinalPrice(
  price: number,
  eligible: boolean,
  discountAmount: number,
  eligibleSubtotal: number,
): number {
  if (!eligible || discountAmount <= 0 || eligibleSubtotal <= 0) return price;
  const share = Math.round(price * (discountAmount / eligibleSubtotal));
  return Math.max(0, price - share);
}
