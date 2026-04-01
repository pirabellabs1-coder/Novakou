// POST /api/formations/checkout — Créer une session de paiement (Stripe ou mock)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";
import { PaymentService } from "@/lib/payments/service";

const checkoutSchema = z.object({
  promoCode: z.string().optional(),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { promoCode, locale } = checkoutSchema.parse(body);

    // Récupérer le panier
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        formation: {
          select: {
            id: true,
            title: true,
            price: true,
            isFree: true,
            thumbnail: true,
            status: true,
          },
        },
      },
    });

    const activeItems = cartItems.filter((i) => i.formation.status === "ACTIF");

    if (activeItems.length === 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // Calculer la réduction promo
    let discountPct = 0;
    let promoId: string | undefined;
    let promoTargetedFormationIds: string[] = [];

    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: {
          code: promoCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (promo) {
        const isExhausted = promo.maxUsage != null && promo.usageCount >= promo.maxUsage;
        const cartFormationIds = activeItems.map((i) => i.formationId);
        const isScopedAndInvalid =
          promo.formationIds.length > 0 &&
          !cartFormationIds.some((fid) => promo.formationIds.includes(fid));

        if (!isExhausted && !isScopedAndInvalid) {
          discountPct = promo.discountPct;
          promoId = promo.id;
          promoTargetedFormationIds = promo.formationIds;
        }
      }
    }

    // Check for active flash promotions
    const now = new Date();
    const flashPromos = await prisma.flashPromotion.findMany({
      where: {
        formationId: { in: activeItems.map((i) => i.formationId) },
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
    });
    const flashPromoByFormation = new Map(
      flashPromos.filter((p) => !p.maxUsage || p.usageCount < p.maxUsage).map((p) => [p.formationId, p])
    );

    // Calculate total amount
    let totalAmount = 0;
    for (const item of activeItems) {
      const promoApplies =
        promoTargetedFormationIds.length === 0 ||
        promoTargetedFormationIds.includes(item.formationId);
      const itemPromoPct = promoApplies ? discountPct : 0;
      const flashPromo = flashPromoByFormation.get(item.formationId);
      const effectiveDiscount = flashPromo
        ? Math.max(flashPromo.discountPct, itemPromoPct)
        : itemPromoPct;

      const price = item.formation.isFree ? 0 : item.formation.price;
      totalAmount += Math.max(0, price * (1 - effectiveDiscount / 100));
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const formationIds = activeItems.map((i) => i.formationId);

    // All free items → skip payment, create enrollments directly
    if (totalAmount === 0) {
      const mockSessionId = `mock_free_${Date.now()}`;

      // Create enrollments for free formations
      for (const item of activeItems) {
        const existing = await prisma.enrollment.findUnique({
          where: { userId_formationId: { userId: session.user.id, formationId: item.formationId } },
        });
        if (!existing) {
          await prisma.enrollment.create({
            data: {
              userId: session.user.id,
              formationId: item.formationId,
              paidAmount: 0,
              stripeSessionId: mockSessionId,
            },
          });
          await prisma.formation.update({
            where: { id: item.formationId },
            data: { studentsCount: { increment: 1 } },
          });
        }
      }

      // Clear cart
      await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });

      // Increment promo usage if applicable
      if (promoId) {
        await prisma.promoCode.update({
          where: { id: promoId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return NextResponse.json({
        url: `${baseUrl}/formations/succes?session_id=${mockSessionId}`,
        sessionId: mockSessionId,
        mock: true,
      });
    }

    // Use PaymentService for paid checkout
    const description = activeItems.length === 1
      ? activeItems[0].formation.title
      : `${activeItems.length} formations`;

    const payment = await PaymentService.createPayment({
      userId: session.user.id,
      amount: Math.round(totalAmount * 100) / 100,
      currency: "EUR",
      description,
      type: "formation",
      metadata: {
        type: "formation",
        userId: session.user.id,
        formationIds: JSON.stringify(formationIds),
        promoId: promoId ?? "",
        flashPromoIds: JSON.stringify(flashPromos.map((p) => p.id)),
      },
      successUrl: `${baseUrl}/formations/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/formations/panier?cancelled=true`,
    });

    // If mock payment (instant success), create enrollments immediately
    if (payment.provider === "mock" && payment.status === "paid") {
      for (const item of activeItems) {
        const promoApplies =
          promoTargetedFormationIds.length === 0 ||
          promoTargetedFormationIds.includes(item.formationId);
        const itemPromoPct = promoApplies ? discountPct : 0;
        const flashPromo = flashPromoByFormation.get(item.formationId);
        const effectiveDiscount = flashPromo
          ? Math.max(flashPromo.discountPct, itemPromoPct)
          : itemPromoPct;
        const finalPrice = Math.max(0, item.formation.price * (1 - effectiveDiscount / 100));

        const existing = await prisma.enrollment.findUnique({
          where: { userId_formationId: { userId: session.user.id, formationId: item.formationId } },
        });
        if (!existing) {
          await prisma.enrollment.create({
            data: {
              userId: session.user.id,
              formationId: item.formationId,
              paidAmount: Math.round(finalPrice * 100) / 100,
              stripeSessionId: payment.sessionId,
            },
          });
          await prisma.formation.update({
            where: { id: item.formationId },
            data: { studentsCount: { increment: 1 } },
          });
        }
      }

      // Clear cart
      await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });

      // Increment promo/flash usage
      if (promoId) {
        await prisma.promoCode.update({
          where: { id: promoId },
          data: { usageCount: { increment: 1 } },
        });
      }
      for (const fp of flashPromos) {
        await prisma.flashPromotion.update({
          where: { id: fp.id },
          data: { usageCount: { increment: 1 } },
        }).catch(() => {});
      }

      return NextResponse.json({
        url: `${baseUrl}/formations/succes?session_id=${payment.sessionId}`,
        sessionId: payment.sessionId,
        mock: true,
      });
    }

    // Real Stripe checkout → redirect to Stripe
    return NextResponse.json({
      url: payment.checkoutUrl,
      sessionId: payment.sessionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[POST /api/formations/checkout]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
