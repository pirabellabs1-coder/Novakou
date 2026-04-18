/**
 * Evaluates a DiscountCode against a cart context and returns the final
 * discount amount in FCFA (or whichever currency the caller uses).
 *
 * Handles :
 *   - PERCENTAGE / FIXED (base)
 *   - firstOrderOnly (reject if user already has a paid enrollment/purchase)
 *   - bogoQuantityBuy + bogoQuantityFree (Buy N, get M free — cheapest item is free)
 *   - tieredRules (pick highest % matching cart quantity)
 *   - maxUses / maxUsesPerUser / minOrderAmount / expiresAt
 *
 * Never throws — returns `{ ok: false, reason }` on any violation.
 */

import { prisma } from "@/lib/prisma";

export interface CartLineLite {
  id: string; // formationId or productId
  kind: "formation" | "product";
  priceXof: number;
}

export interface EvaluateCtx {
  userId?: string | null;
  code: string; // raw string typed by the user
  lines: CartLineLite[];
}

export interface EvaluateResult {
  ok: boolean;
  reason?: string;
  discountAmount: number;
  finalAmount: number;
  appliedTierPct?: number;
  freeLines?: string[]; // ids of lines that became free via BOGO
  codeId?: string;
}

export async function evaluateDiscount(ctx: EvaluateCtx): Promise<EvaluateResult> {
  const code = ctx.code?.trim().toUpperCase();
  if (!code) return { ok: false, reason: "Code manquant", discountAmount: 0, finalAmount: 0 };
  if (!ctx.lines?.length) return { ok: false, reason: "Panier vide", discountAmount: 0, finalAmount: 0 };

  const dc = await prisma.discountCode.findFirst({
    where: { code, isActive: true },
  });
  if (!dc) return { ok: false, reason: "Code invalide", discountAmount: 0, finalAmount: 0 };

  const now = new Date();
  if (dc.expiresAt && dc.expiresAt < now) {
    return { ok: false, reason: "Code expiré", discountAmount: 0, finalAmount: 0 };
  }
  if (dc.maxUses && dc.usedCount >= dc.maxUses) {
    return { ok: false, reason: "Code épuisé", discountAmount: 0, finalAmount: 0 };
  }

  // Filter lines to those eligible by scope
  const eligibleLines = ctx.lines.filter((l) => {
    if (dc.scope === "ALL") return true;
    if (dc.scope === "FORMATIONS") return l.kind === "formation";
    if (dc.scope === "PRODUCTS") return l.kind === "product";
    if (dc.scope === "SPECIFIC") {
      if (l.kind === "formation") return dc.formationIds.includes(l.id);
      if (l.kind === "product") return dc.productIds.includes(l.id);
    }
    return false;
  });
  if (eligibleLines.length === 0) {
    return { ok: false, reason: "Code non applicable aux articles du panier", discountAmount: 0, finalAmount: 0 };
  }

  const subtotal = eligibleLines.reduce((s, l) => s + l.priceXof, 0);
  if (dc.minOrderAmount && subtotal < dc.minOrderAmount) {
    return { ok: false, reason: `Minimum de commande ${dc.minOrderAmount} non atteint`, discountAmount: 0, finalAmount: subtotal };
  }

  // ── firstOrderOnly : reject if user already paid for anything ───────────
  if (dc.firstOrderOnly && ctx.userId) {
    const [enroll, purchase] = await Promise.all([
      prisma.enrollment.findFirst({
        where: { userId: ctx.userId, paidAmount: { gt: 0 }, refundedAt: null },
        select: { id: true },
      }),
      prisma.digitalProductPurchase.findFirst({
        where: { userId: ctx.userId },
        select: { id: true },
      }),
    ]);
    if (enroll || purchase) {
      return { ok: false, reason: "Code réservé à la première commande", discountAmount: 0, finalAmount: subtotal };
    }
  }

  // ── maxUsesPerUser ────────────────────────────────────────────────────
  if (dc.maxUsesPerUser && ctx.userId) {
    const count = await prisma.discountUsage.count({
      where: { discountId: dc.id, userId: ctx.userId },
    });
    if (count >= dc.maxUsesPerUser) {
      return { ok: false, reason: "Limite d'utilisation atteinte pour ce compte", discountAmount: 0, finalAmount: subtotal };
    }
  }

  // ── 1. BOGO — Buy N, get M (cheapest) free ────────────────────────────
  if (dc.bogoQuantityBuy && dc.bogoQuantityFree) {
    const N = dc.bogoQuantityBuy;
    const M = dc.bogoQuantityFree;
    if (eligibleLines.length < N + M) {
      return {
        ok: false,
        reason: `Ajoutez au moins ${N + M} articles éligibles pour activer ce code`,
        discountAmount: 0,
        finalAmount: subtotal,
      };
    }
    const sorted = [...eligibleLines].sort((a, b) => a.priceXof - b.priceXof);
    const free = sorted.slice(0, M);
    const discount = free.reduce((s, l) => s + l.priceXof, 0);
    return {
      ok: true,
      discountAmount: discount,
      finalAmount: subtotal - discount,
      freeLines: free.map((l) => l.id),
      codeId: dc.id,
    };
  }

  // ── 2. Tiered rules — pick highest tier matching quantity ─────────────
  if (dc.tieredRules) {
    const rules = Array.isArray(dc.tieredRules)
      ? (dc.tieredRules as Array<{ qty: number; pct: number }>)
      : [];
    const matching = rules
      .filter((r) => r && typeof r.qty === "number" && typeof r.pct === "number" && eligibleLines.length >= r.qty)
      .sort((a, b) => b.pct - a.pct)[0];
    if (matching) {
      const discount = Math.round((subtotal * matching.pct) / 100);
      return {
        ok: true,
        discountAmount: discount,
        finalAmount: subtotal - discount,
        appliedTierPct: matching.pct,
        codeId: dc.id,
      };
    }
    // No tier matched → fall through to default percentage/fixed
  }

  // ── 3. Default percentage / fixed ─────────────────────────────────────
  let discount = 0;
  if (dc.discountType === "PERCENTAGE") {
    discount = Math.round((subtotal * dc.discountValue) / 100);
  } else {
    // FIXED_AMOUNT
    discount = Math.min(dc.discountValue, subtotal);
  }
  return {
    ok: true,
    discountAmount: discount,
    finalAmount: subtotal - discount,
    codeId: dc.id,
  };
}
