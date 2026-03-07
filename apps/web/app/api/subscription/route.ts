import { NextRequest, NextResponse } from "next/server";

const VALID_PLANS = ["free", "pro", "business", "agence"] as const;
type PlanId = (typeof VALID_PLANS)[number];

const PLAN_NAMES: Record<PlanId, string> = {
  free: "Gratuit",
  pro: "Pro",
  business: "Business",
  agence: "Agence",
};

const PLAN_PRICES: Record<PlanId, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 15, annual: 144 },
  business: { monthly: 45, annual: 432 },
  agence: { monthly: 99, annual: 948 },
};

// POST /api/subscription — Process subscription payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, billing, paymentMethod } = body as {
      planId: string;
      billing: string;
      paymentMethod: string;
    };

    // Validate planId
    if (!planId || !VALID_PLANS.includes(planId as PlanId)) {
      return NextResponse.json(
        { error: "Plan invalide. Les plans acceptes sont : free, pro, business, agence." },
        { status: 400 }
      );
    }

    // Validate billing
    if (!billing || !["monthly", "annual"].includes(billing)) {
      return NextResponse.json(
        { error: "Periode de facturation invalide. Valeurs acceptees : monthly, annual." },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!paymentMethod || typeof paymentMethod !== "string") {
      return NextResponse.json(
        { error: "Methode de paiement requise." },
        { status: 400 }
      );
    }

    // Free plan requires no payment
    if (planId === "free") {
      return NextResponse.json({
        success: true,
        plan: planId,
        planName: PLAN_NAMES[planId as PlanId],
        amount: 0,
        billing,
        nextBillingDate: null,
      });
    }

    // Simulate payment processing delay (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Calculate next billing date
    const now = new Date();
    const nextBillingDate = new Date(now);
    if (billing === "annual") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    }

    const prices = PLAN_PRICES[planId as PlanId];
    const amount = billing === "annual" ? prices.annual : prices.monthly;

    return NextResponse.json({
      success: true,
      plan: planId,
      planName: PLAN_NAMES[planId as PlanId],
      amount,
      billing,
      paymentMethod,
      nextBillingDate: nextBillingDate.toISOString(),
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    });
  } catch (error) {
    console.error("[API /subscription POST]", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du paiement." },
      { status: 500 }
    );
  }
}
