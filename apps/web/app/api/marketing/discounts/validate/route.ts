// POST /api/marketing/discounts/validate — Validate a discount code at checkout
// Body: { code, userId, orderAmount, orderType, itemId }
// Returns: { valid, discountAmount, finalPrice, error? }

import { NextRequest, NextResponse } from "next/server";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// DEV mock discount codes (kept in sync with the discounts route)
const MOCK_CODES: Record<
  string,
  {
    id: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    scope: "ALL" | "FORMATIONS" | "PRODUCTS" | "SPECIFIC";
    formationIds: string[];
    productIds: string[];
    maxUses: number | null;
    usedCount: number;
    maxUsesPerUser: number | null;
    minOrderAmount: number | null;
    expiresAt: string | null;
    isActive: boolean;
    // Track per-user usage in dev
    userUsages: Record<string, number>;
  }
> = {};

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId, orderAmount, orderType, itemId } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        finalPrice: orderAmount || 0,
        error: "Code de reduction requis",
      });
    }

    if (typeof orderAmount !== "number" || orderAmount <= 0) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        finalPrice: 0,
        error: "Montant de commande invalide",
      });
    }

    const normalizedCode = code.toUpperCase().trim();

    if (DEV_MODE) {
      return validateDev(normalizedCode, userId || "user_anon", orderAmount, orderType, itemId);
    }

    // Production mode
    return await validateProduction(normalizedCode, userId, orderAmount, orderType, itemId);
  } catch (error) {
    console.error("[POST /api/marketing/discounts/validate]", error);
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: 0,
      error: "Erreur serveur",
    }, { status: 500 });
  }
}

// ── DEV validation ───────────────────────────────────────────────────────────

function validateDev(
  code: string,
  userId: string,
  orderAmount: number,
  orderType?: string,
  itemId?: string,
) {
  const discount = MOCK_CODES[code];

  // 1. Code exists?
  if (!discount) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Code de reduction invalide",
    });
  }

  // 2. Active?
  if (!discount.isActive) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code n'est plus actif",
    });
  }

  // 3. Expired?
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code a expire",
    });
  }

  // 4. Max global uses reached?
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code a atteint sa limite d'utilisation",
    });
  }

  // 5. Max per-user uses reached?
  if (discount.maxUsesPerUser !== null) {
    const userUses = discount.userUsages[userId] || 0;
    if (userUses >= discount.maxUsesPerUser) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        finalPrice: orderAmount,
        error: "Vous avez deja utilise ce code le nombre maximum de fois",
      });
    }
  }

  // 6. Scope check
  if (discount.scope === "FORMATIONS" && orderType && orderType !== "formation") {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code est valide uniquement pour les formations",
    });
  }
  if (discount.scope === "PRODUCTS" && orderType && orderType !== "product") {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code est valide uniquement pour les produits numeriques",
    });
  }
  if (discount.scope === "SPECIFIC" && itemId) {
    const validIds = [...discount.formationIds, ...discount.productIds];
    if (validIds.length > 0 && !validIds.includes(itemId)) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        finalPrice: orderAmount,
        error: "Ce code n'est pas applicable a cet article",
      });
    }
  }

  // 7. Minimum order amount
  if (discount.minOrderAmount !== null && orderAmount < discount.minOrderAmount) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: `Montant minimum requis : ${discount.minOrderAmount.toFixed(2)} EUR`,
    });
  }

  // Calculate discount
  let discountAmount: number;
  if (discount.discountType === "PERCENTAGE") {
    discountAmount = Math.round((orderAmount * discount.discountValue) / 100 * 100) / 100;
  } else {
    discountAmount = Math.min(discount.discountValue, orderAmount);
  }

  const finalPrice = Math.max(0, Math.round((orderAmount - discountAmount) * 100) / 100);

  return NextResponse.json({
    valid: true,
    discountAmount,
    finalPrice,
    discountId: discount.id,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    code,
  });
}

// ── Production validation ────────────────────────────────────────────────────

async function validateProduction(
  code: string,
  userId: string | undefined,
  orderAmount: number,
  orderType?: string,
  itemId?: string,
) {
  const prisma = (await import("@freelancehigh/db")).default;

  const discount = await prisma.discountCode.findUnique({
    where: { code },
    include: { usages: userId ? { where: { userId } } : false },
  });

  if (!discount) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Code de reduction invalide",
    });
  }

  if (!discount.isActive) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code n'est plus actif",
    });
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code a expire",
    });
  }

  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code a atteint sa limite d'utilisation",
    });
  }

  // Per-user limit check
  if (discount.maxUsesPerUser !== null && userId) {
    const userUsageCount = await prisma.discountUsage.count({
      where: { discountId: discount.id, userId },
    });
    if (userUsageCount >= discount.maxUsesPerUser) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        finalPrice: orderAmount,
        error: "Vous avez deja utilise ce code le nombre maximum de fois",
      });
    }
  }

  // Scope check
  if (discount.scope === "FORMATIONS" && orderType && orderType !== "formation") {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code est valide uniquement pour les formations",
    });
  }
  if (discount.scope === "PRODUCTS" && orderType && orderType !== "product") {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: "Ce code est valide uniquement pour les produits numeriques",
    });
  }
  if (discount.scope === "SPECIFIC" && itemId) {
    const validIds = [...discount.formationIds, ...discount.productIds];
    if (validIds.length > 0 && !validIds.includes(itemId)) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        finalPrice: orderAmount,
        error: "Ce code n'est pas applicable a cet article",
      });
    }
  }

  // Minimum order
  if (discount.minOrderAmount !== null && orderAmount < discount.minOrderAmount) {
    return NextResponse.json({
      valid: false,
      discountAmount: 0,
      finalPrice: orderAmount,
      error: `Montant minimum requis : ${discount.minOrderAmount.toFixed(2)} EUR`,
    });
  }

  // Calculate
  let discountAmount: number;
  if (discount.discountType === "PERCENTAGE") {
    discountAmount = Math.round((orderAmount * discount.discountValue) / 100 * 100) / 100;
  } else {
    discountAmount = Math.min(discount.discountValue, orderAmount);
  }

  const finalPrice = Math.max(0, Math.round((orderAmount - discountAmount) * 100) / 100);

  return NextResponse.json({
    valid: true,
    discountAmount,
    finalPrice,
    discountId: discount.id,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    code,
  });
}
