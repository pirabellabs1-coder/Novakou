// POST /api/produits/checkout — Checkout pour un produit numérique (mock ou Stripe)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { PaymentService } from "@/lib/payments/service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const product = await prisma.digitalProduct.findFirst({
      where: { id: productId, status: "ACTIF" },
      select: {
        id: true,
        title: true,
        price: true,
        isFree: true,
        maxBuyers: true,
        currentBuyers: true,
        banner: true,
        slug: true,
        instructeur: { select: { id: true } },
        flashPromotions: {
          where: {
            isActive: true,
            startsAt: { lte: new Date() },
            endsAt: { gt: new Date() },
          },
          take: 1,
          select: { id: true, discountPct: true, maxUsage: true, usageCount: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable ou inactif" }, { status: 404 });
    }

    // Prevent self-purchase
    const instructeurProfile = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (instructeurProfile && instructeurProfile.id === product.instructeur.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas acheter votre propre produit" }, { status: 400 });
    }

    // Check if already purchased
    const existingPurchase = await prisma.digitalProductPurchase.findUnique({
      where: { userId_productId: { userId: session.user.id, productId: product.id } },
    });
    if (existingPurchase) {
      return NextResponse.json({ error: "Vous avez déjà acheté ce produit" }, { status: 400 });
    }

    // Check stock limit
    if (product.maxBuyers !== null && product.currentBuyers >= product.maxBuyers) {
      return NextResponse.json({ error: "Ce produit a atteint sa limite de ventes" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Helper to create purchase record
    const createPurchase = async (paidAmount: number, sessionId: string | null) => {
      await prisma.$transaction(async (tx) => {
        if (product.maxBuyers !== null) {
          const updated = await tx.digitalProduct.updateMany({
            where: { id: product.id, currentBuyers: { lt: product.maxBuyers } },
            data: { currentBuyers: { increment: 1 }, salesCount: { increment: 1 } },
          });
          if (updated.count === 0) throw new Error("STOCK_EXHAUSTED");
        } else {
          await tx.digitalProduct.update({
            where: { id: product.id },
            data: { salesCount: { increment: 1 } },
          });
        }

        await tx.digitalProductPurchase.create({
          data: {
            userId: session.user.id,
            productId: product.id,
            paidAmount,
            stripeSessionId: sessionId,
          },
        });
      });
    };

    // Handle free products
    if (product.isFree || product.price === 0) {
      await createPurchase(0, null);

      // Fire marketing hook (fire-and-forget)
      try {
        const { onProductPurchase } = await import("@/lib/marketing/hooks");
        onProductPurchase(session.user.id, product.id, 0, {
          source: "free_product",
          productTitle: product.title,
        });
      } catch { /* ignore */ }

      return NextResponse.json({
        free: true,
        redirectUrl: `/formations/produits/${product.slug}?purchased=true`,
      });
    }

    // Calculate price with flash promo
    let finalPrice = product.price;
    let flashPromoId: string | null = null;

    const activePromo = product.flashPromotions[0];
    if (activePromo) {
      const promoAvailable = !activePromo.maxUsage || activePromo.usageCount < activePromo.maxUsage;
      if (promoAvailable) {
        finalPrice = product.price * (1 - activePromo.discountPct / 100);
        flashPromoId = activePromo.id;
      }
    }

    // Use PaymentService
    const payment = await PaymentService.createPayment({
      userId: session.user.id,
      amount: Math.round(finalPrice * 100) / 100,
      currency: "EUR",
      description: product.title,
      type: "product",
      itemId: product.id,
      metadata: {
        type: "digital_product",
        userId: session.user.id,
        productId: product.id,
        flashPromoId: flashPromoId || "",
      },
      successUrl: `${baseUrl}/formations/produits/${product.slug}?purchased=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/formations/produits/${product.slug}`,
    });

    // If mock (instant success) → create purchase immediately
    if (payment.provider === "mock" && payment.status === "paid") {
      await createPurchase(Math.round(finalPrice * 100) / 100, payment.sessionId);

      // Increment flash promo usage
      if (flashPromoId) {
        await prisma.flashPromotion.update({
          where: { id: flashPromoId },
          data: { usageCount: { increment: 1 } },
        }).catch(() => {});
      }

      // Fire marketing hook
      try {
        const { onProductPurchase } = await import("@/lib/marketing/hooks");
        onProductPurchase(session.user.id, product.id, finalPrice, {
          source: "mock_checkout",
          productTitle: product.title,
        });
      } catch { /* ignore */ }

      return NextResponse.json({
        url: `/formations/produits/${product.slug}?purchased=true&session_id=${payment.sessionId}`,
        mock: true,
      });
    }

    // Real Stripe → redirect
    return NextResponse.json({ url: payment.checkoutUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_EXHAUSTED") {
      return NextResponse.json({ error: "Ce produit a atteint sa limite de ventes" }, { status: 400 });
    }
    console.error("[POST /api/produits/checkout]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
