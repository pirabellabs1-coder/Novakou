// POST /api/marketing/funnels/checkout — Créer une session Stripe Checkout pour un achat via funnel

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

interface AcceptedItem {
  productId: string;
  title: string;
  price: number;
  discountPct: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { funnelId, funnelSlug, acceptedItems, visitorId } = body as {
      funnelId: string;
      funnelSlug: string;
      acceptedItems: AcceptedItem[];
      visitorId: string;
    };

    if (!funnelId || !acceptedItems || !Array.isArray(acceptedItems) || acceptedItems.length === 0) {
      return NextResponse.json(
        { error: "funnelId et acceptedItems sont requis" },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of acceptedItems) {
      if (!item.productId || typeof item.price !== "number" || item.price <= 0) {
        return NextResponse.json(
          { error: "Chaque item doit avoir un productId et un prix valide" },
          { status: 400 }
        );
      }
    }

    const origin = new URL(req.url).origin;
    const slug = funnelSlug || funnelId;
    const successUrl = `${origin}/formations/f/${slug}?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/formations/f/${slug}?canceled=true`;

    // ── DEV MODE ──────────────────────────────────────────────────────
    if (DEV_MODE) {
      const devSessionId = `dev_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Track purchase event in dev
      try {
        const totalRevenue = acceptedItems.reduce((sum, item) => {
          const discount = item.discountPct ? item.price * (item.discountPct / 100) : 0;
          return sum + (item.price - discount);
        }, 0);

        await fetch(`${origin}/api/marketing/funnels/${funnelId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "purchase",
            stepIndex: -1, // checkout step
            stepType: "CHECKOUT",
            visitorId: visitorId || "anonymous",
            revenue: totalRevenue,
            metadata: { items: acceptedItems, sessionId: devSessionId },
          }),
        });
      } catch {
        // Non-blocking
      }

      return NextResponse.json({
        sessionId: devSessionId,
        url: `${origin}/formations/f/${slug}?success=true&session_id=${devSessionId}`,
      });
    }

    // ── PRODUCTION ────────────────────────────────────────────────────

    // Optional: get user session for pre-filling email
    const session = await getServerSession(authOptions);
    const customerEmail = session?.user?.email || undefined;

    // Build Stripe line items
    const lineItems = acceptedItems.map((item) => {
      const discount = item.discountPct ? item.price * (item.discountPct / 100) : 0;
      const finalPrice = Math.round((item.price - discount) * 100); // Stripe uses cents

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: item.title,
            metadata: {
              productId: item.productId,
              originalPrice: String(item.price),
              discountPct: String(item.discountPct ?? 0),
            },
          },
          unit_amount: finalPrice,
        },
        quantity: 1,
      };
    });

    // Create Stripe Checkout session
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2024-12-18.acacia" as "2025-02-24.acacia",
    });

    const checkoutSession = await stripeClient.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        type: "funnel_purchase",
        funnelId,
        funnelSlug: slug,
        visitorId: visitorId || "anonymous",
        acceptedItemIds: acceptedItems.map((i) => i.productId).join(","),
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("[POST /api/marketing/funnels/checkout]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
