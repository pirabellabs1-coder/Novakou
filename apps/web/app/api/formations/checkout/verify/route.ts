// GET /api/formations/checkout/verify?session_id=xxx — Vérifier un paiement post-checkout
// Also creates enrollments as fallback if webhook hasn't fired yet (race condition)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { PaymentService } from "@/lib/payments/service";
import { ensureUserInDb } from "@/lib/formations/ensure-user";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "session_id manquant" }, { status: 400 });
    }

    // Verify payment via PaymentService (handles both mock and Stripe)
    const verification = await PaymentService.verifyPayment(sessionId);

    if (!verification.paid) {
      return NextResponse.json({ paid: false, status: "unpaid" });
    }

    // Verify session belongs to this user (for real Stripe sessions)
    if (verification.userId && verification.userId !== session.user.id) {
      return NextResponse.json({ error: "Session non autorisée" }, { status: 403 });
    }

    // Fetch enrollments created for this session (may have been created by webhook)
    let enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        stripeSessionId: sessionId,
      },
      include: {
        formation: { select: { id: true, title: true, slug: true, thumbnail: true } },
      },
    });

    // Fallback: if webhook hasn't fired yet, create enrollments here
    // This handles the race condition where user lands on success page before webhook arrives
    if (enrollments.length === 0 && verification.metadata) {
      const formationIdsJson = verification.metadata.formationIds;
      const promoId = verification.metadata.promoId;

      if (formationIdsJson) {
        let formationIds: string[];
        try {
          formationIds = JSON.parse(formationIdsJson);
        } catch {
          formationIds = [];
        }

        if (formationIds.length > 0) {
          // Calculate discount if promo was used
          let discountPct = 0;
          if (promoId) {
            const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
            if (promo?.isActive) discountPct = promo.discountPct;
          }

          const formations = await prisma.formation.findMany({
            where: { id: { in: formationIds }, status: "ACTIF" },
            select: { id: true, title: true, slug: true, thumbnail: true, price: true, isFree: true },
          });

          for (const formation of formations) {
            // Idempotent: skip if enrollment already exists
            const existing = await prisma.enrollment.findUnique({
              where: { userId_formationId: { userId: session.user.id, formationId: formation.id } },
            });

            if (!existing) {
              const paidAmount = formation.isFree ? 0 : Math.round(formation.price * (1 - discountPct / 100) * 100) / 100;

              await prisma.enrollment.create({
                data: {
                  userId: session.user.id,
                  formationId: formation.id,
                  paidAmount,
                  stripeSessionId: sessionId,
                  progress: 0,
                },
              });

              await prisma.formation.update({
                where: { id: formation.id },
                data: { studentsCount: { increment: 1 } },
              });
            }
          }

          // Increment promo usage
          if (promoId) {
            await prisma.promoCode.update({
              where: { id: promoId },
              data: { usageCount: { increment: 1 } },
            }).catch(() => {});
          }

          // Clear cart
          await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });

          // Re-fetch enrollments
          enrollments = await prisma.enrollment.findMany({
            where: {
              userId: session.user.id,
              stripeSessionId: sessionId,
            },
            include: {
              formation: { select: { id: true, title: true, slug: true, thumbnail: true } },
            },
          });
        }
      }
    }

    // Fire marketing hooks (fire-and-forget, safe to call even if not available)
    try {
      const { onFormationPurchase } = await import("@/lib/marketing/hooks");
      for (const enrollment of enrollments) {
        onFormationPurchase(
          session.user.id,
          enrollment.formation.id,
          enrollment.paidAmount ?? 0,
          {
            sessionId: sessionId,
            source: "checkout_verify",
            formationTitle: enrollment.formation.title,
          }
        );
      }
    } catch {
      // Marketing hooks module not available — ignore
    }

    return NextResponse.json({
      paid: true,
      enrollments,
      formationCount: enrollments.length,
      provider: verification.provider,
    });
  } catch (error) {
    console.error("[GET /api/formations/checkout/verify]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
