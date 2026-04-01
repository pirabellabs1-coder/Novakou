// Shared promo code validation and cart totals computation

import prisma from "@freelancehigh/db";

export interface PromoValidationResult {
  valid: boolean;
  discountPct: number;
  error?: string;
  promoId?: string;
  code?: string;
  formationIds: string[];
}

/**
 * Validate a promo code against all conditions:
 * - Code exists and is active
 * - Within date range (expiresAt)
 * - Usage count < maxUsage
 * - Applicable to given formations (formationIds filter or all)
 */
export async function validatePromoCode(
  code: string,
  cartFormationIds: string[]
): Promise<PromoValidationResult> {
  const promo = await prisma.promoCode.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!promo) {
    return { valid: false, discountPct: 0, error: "Code promo invalide", formationIds: [] };
  }

  // Check usage limit
  if (promo.maxUsage !== null && promo.usageCount >= promo.maxUsage) {
    return { valid: false, discountPct: 0, error: "Ce code promo a atteint sa limite d'utilisation", formationIds: [] };
  }

  // Check if promo applies to any cart formations
  if (promo.formationIds.length > 0) {
    const hasApplicable = cartFormationIds.some((fid) => promo.formationIds.includes(fid));
    if (!hasApplicable) {
      return { valid: false, discountPct: 0, error: "Ce code promo ne s'applique pas aux formations de votre panier", formationIds: [] };
    }
  }

  return {
    valid: true,
    discountPct: promo.discountPct,
    promoId: promo.id,
    code: promo.code,
    formationIds: promo.formationIds,
  };
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  total: number;
}

/**
 * Compute cart totals from item prices with optional promo code discount.
 * Supports targeted promo codes (only apply discount to specific formations).
 */
export function computeCartTotals(
  items: Array<{ formationId: string; price: number }>,
  promo?: { discountPct: number; formationIds: string[] } | null
): CartTotals {
  const subtotal = items.reduce((acc, item) => acc + item.price, 0);

  let discountAmount = 0;
  if (promo && promo.discountPct > 0) {
    const applicableItems = promo.formationIds.length > 0
      ? items.filter((item) => promo.formationIds.includes(item.formationId))
      : items;
    const applicableSubtotal = applicableItems.reduce((acc, item) => acc + item.price, 0);
    discountAmount = Math.round(applicableSubtotal * (promo.discountPct / 100) * 100) / 100;
  }

  return {
    subtotal,
    discountAmount,
    total: Math.max(0, subtotal - discountAmount),
  };
}
