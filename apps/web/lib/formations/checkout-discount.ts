/**
 * Source UNIQUE de vérité du code promo au checkout (chemin monétaire).
 *
 * Branché à la fois dans :
 *   - app/api/formations/payment/init  → décide le MONTANT débité
 *   - lib/formations/fulfillment        → répartit la remise sur les items
 *
 * Les deux appellent `computeCheckoutDiscount` avec les MÊMES entrées → ils
 * calculent la MÊME remise (déterministe), donc le garde-fou anti-fraude
 * (`assertAmountMatches` / `expectedAmountReceived`) ne casse jamais une vraie
 * commande remisée.
 *
 * Règle d'éligibilité (marketplace multi-vendeur) :
 *   Un code appartient TOUJOURS à un vendeur (`instructeurId`, non-null ; aucun
 *   code « plateforme » n'existe). Un code ne peut donc remiser QUE les items de
 *   son vendeur propriétaire, puis `scope` restreint À L'INTÉRIEUR de ce
 *   catalogue (ALL / FORMATIONS / PRODUCTS / SPECIFIC). Ça ferme la fuite
 *   inter-vendeur : le code d'un vendeur ne rogne jamais la marge d'un autre.
 *
 * Ne lève jamais : renvoie `{ applied: false, reason }` sur toute violation.
 *
 * Note : BOGO / tieredRules NE SONT PAS appliqués ici (le checkout historique ne
 * les appliquait pas non plus — ils restent gérés par l'aperçu UI
 * `discount-evaluator.ts`). On préserve le comportement percentage/fixed.
 */

import { prisma } from "@/lib/prisma";
import {
  selectEligible,
  rawDiscount,
  type CheckoutDiscountLine,
  type DiscountRule,
} from "@/lib/formations/checkout-discount-math";

export type { CheckoutDiscountLine, DiscountRule } from "@/lib/formations/checkout-discount-math";
export { selectEligible, rawDiscount, lineFinalPrice } from "@/lib/formations/checkout-discount-math";

export interface CheckoutDiscountResult {
  applied: boolean;
  reason: string | null;
  codeId: string | null;
  code: string | null;
  /** remise totale (XOF), calculée SUR les seuls items éligibles */
  discountAmount: number;
  /** ids des items qui reçoivent la remise */
  eligibleIds: string[];
  /** sous-total des items éligibles (base de répartition) */
  eligibleSubtotal: number;
  /** limite globale du code (pour l'incrément atomique côté fulfillment) */
  maxUses: number | null;
}

const none = (reason: string): CheckoutDiscountResult => ({
  applied: false,
  reason,
  codeId: null,
  code: null,
  discountAmount: 0,
  eligibleIds: [],
  eligibleSubtotal: 0,
  maxUses: null,
});

// ── Fonction principale (avec DB) ──────────────────────────────────────────

export async function computeCheckoutDiscount(
  rawCode: string | null | undefined,
  userId: string | null,
  lines: CheckoutDiscountLine[],
): Promise<CheckoutDiscountResult> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return none("no_code");
  if (!lines.length) return none("empty");

  const dc = await prisma.discountCode.findFirst({ where: { code, isActive: true } });
  if (!dc) return none("invalid");

  // Éligibilité DÉTERMINISTE (propriétaire + portée) — ne dépend d'aucun état
  // qui pourrait bouger entre l'init et le webhook. On la calcule d'abord et on
  // la renvoie TOUJOURS (même si un garde stateful refuse ensuite), pour que le
  // fulfillment puisse répartir un rabais DÉJÀ débité sur le bon jeu d'items.
  const eligible = selectEligible(
    {
      instructeurId: dc.instructeurId,
      scope: dc.scope as DiscountRule["scope"],
      formationIds: dc.formationIds,
      productIds: dc.productIds,
      discountType: dc.discountType,
      discountValue: dc.discountValue,
    },
    lines,
  );
  if (eligible.length === 0) return none("not_applicable");

  const eligibleSubtotal = eligible.reduce((s, l) => s + l.price, 0);
  const base = {
    codeId: dc.id,
    code: dc.code,
    eligibleIds: eligible.map((l) => l.id),
    eligibleSubtotal,
    maxUses: dc.maxUses ?? null,
  };
  const reject = (reason: string): CheckoutDiscountResult => ({
    ...base,
    applied: false,
    reason,
    discountAmount: 0,
  });

  // ── Gardes (peuvent refuser l'application, sans effacer l'éligibilité) ──
  const now = new Date();
  if (dc.expiresAt && dc.expiresAt < now) return reject("expired");
  if (dc.maxUses != null && dc.usedCount >= dc.maxUses) return reject("exhausted");
  if (dc.minOrderAmount && eligibleSubtotal < dc.minOrderAmount) return reject("min_not_met");

  // firstOrderOnly : réservé à la 1re commande PAYÉE (gratuit/offert n'invalide pas).
  if (dc.firstOrderOnly && userId) {
    const [enroll, purchase] = await Promise.all([
      prisma.enrollment.findFirst({
        where: { userId, paidAmount: { gt: 0 }, refundedAt: null },
        select: { id: true },
      }),
      prisma.digitalProductPurchase.findFirst({
        where: { userId, paidAmount: { gt: 0 } },
        select: { id: true },
      }),
    ]);
    if (enroll || purchase) return reject("first_order_only");
  }

  if (dc.maxUsesPerUser != null && userId) {
    const count = await prisma.discountUsage.count({ where: { discountId: dc.id, userId } });
    if (count >= dc.maxUsesPerUser) return reject("per_user_limit");
  }

  const discountAmount = rawDiscount(dc.discountType, dc.discountValue, eligibleSubtotal);

  return {
    ...base,
    applied: discountAmount > 0,
    reason: discountAmount > 0 ? null : "zero",
    discountAmount,
  };
}
