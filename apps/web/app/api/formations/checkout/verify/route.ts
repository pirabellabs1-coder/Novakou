// GET /api/formations/checkout/verify?session_id=xxx — Vérifier un paiement post-checkout

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { PaymentService } from "@/lib/payments/service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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

    // Fetch enrollments created for this session
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        stripeSessionId: sessionId,
      },
      include: {
        formation: { select: { id: true, titleFr: true, titleEn: true, slug: true, thumbnail: true } },
      },
    });

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
            formationTitle: enrollment.formation.titleFr,
          }
        ).catch(() => {});
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
