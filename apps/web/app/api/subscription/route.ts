// POST /api/subscription — Create a Stripe Checkout Session for plan upgrades

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { stripe } from "@/lib/stripe";
import { rateLimit } from "@/lib/api-rate-limit";

const VALID_PLANS = ["pro", "business", "agence"] as const;
type PaidPlanId = (typeof VALID_PLANS)[number];

const PLAN_NAMES: Record<PaidPlanId, string> = {
  pro: "Pro",
  business: "Business",
  agence: "Agence",
};

const PLAN_PRICES_MONTHLY: Record<PaidPlanId, number> = {
  pro: 15,
  business: 45,
  agence: 99,
};

/**
 * Map plan IDs to Stripe Price IDs from environment variables.
 *
 * Expected env vars:
 *   STRIPE_PRICE_PRO       — e.g. price_xxx for Pro (15 EUR/month)
 *   STRIPE_PRICE_BUSINESS  — e.g. price_xxx for Business (45 EUR/month)
 *   STRIPE_PRICE_AGENCE    — e.g. price_xxx for Agence (99 EUR/month)
 */
function getStripePriceId(planId: PaidPlanId): string | null {
  const envMap: Record<PaidPlanId, string | undefined> = {
    pro: process.env.STRIPE_PRICE_PRO,
    business: process.env.STRIPE_PRICE_BUSINESS,
    agence: process.env.STRIPE_PRICE_AGENCE,
  };
  return envMap[planId] ?? null;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      );
    }

    const rl = rateLimit(`subscription:${session.user.id}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de requetes. Reessayez dans 1 minute." }, { status: 429 });
    }

    // Check Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: "Le systeme de paiement n'est pas configure." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { planId } = body as { planId: string };

    // Validate planId
    if (!planId || !VALID_PLANS.includes(planId as PaidPlanId)) {
      return NextResponse.json(
        { error: "Plan invalide. Les plans acceptes sont : pro, business, agence." },
        { status: 400 }
      );
    }

    const plan = planId as PaidPlanId;

    // Resolve Stripe Price ID
    const priceId = getStripePriceId(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: `Le Price ID Stripe pour le plan "${plan}" n'est pas configure. Variable attendue : STRIPE_PRICE_${plan.toUpperCase()}` },
        { status: 503 }
      );
    }

    // Build success/cancel URLs
    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/dashboard/abonnement?success=true&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard/abonnement?cancelled=true`;

    // Determine or create Stripe customer
    // For now, use the user email. In production, the Stripe customer ID
    // should be stored in the DB and reused.
    const userEmail = session.user.email ?? undefined;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        platform: "freelancehigh",
        type: "subscription",
        plan_id: plan,
        user_id: session.user.id,
      },
      subscription_data: {
        metadata: {
          platform: "freelancehigh",
          plan_id: plan,
          user_id: session.user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      plan: plan,
      planName: PLAN_NAMES[plan],
      amount: PLAN_PRICES_MONTHLY[plan],
    });
  } catch (error) {
    console.error("[API /subscription POST]", error);

    // Return Stripe-specific error messages when available
    if (error instanceof Error && "type" in error) {
      return NextResponse.json(
        { error: `Erreur Stripe : ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la creation de la session de paiement." },
      { status: 500 }
    );
  }
}
