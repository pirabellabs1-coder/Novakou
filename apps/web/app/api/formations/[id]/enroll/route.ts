// POST /api/formations/[id]/enroll — Inscrire un apprenant après paiement

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { PaymentService } from "@/lib/payments/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { stripeSessionId } = body as { stripeSessionId?: string };

    const formation = await prisma.formation.findUnique({
      where: { id, status: "ACTIF" },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    // Check if already enrolled (idempotence)
    const existing = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId: session.user.id, formationId: id } },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Determine paid amount
    let verifiedPaidAmount = 0;

    if (formation.isFree || formation.price === 0) {
      // Free formation — no payment needed
      verifiedPaidAmount = 0;
    } else if (stripeSessionId) {
      // Paid formation — verify payment via PaymentService
      const verification = await PaymentService.verifyPayment(stripeSessionId);

      if (!verification.paid) {
        return NextResponse.json(
          { error: "Paiement non confirmé. Veuillez finaliser le paiement." },
          { status: 402 }
        );
      }

      // For real Stripe, verify user ownership
      if (verification.provider === "stripe" && verification.userId && verification.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Session de paiement non autorisée" },
          { status: 403 }
        );
      }

      verifiedPaidAmount = verification.amount;
    } else if (PaymentService.isMockMode()) {
      // Mock mode — allow enrollment without session for paid formations
      verifiedPaidAmount = formation.price;
    } else {
      // Real mode without session — refuse
      return NextResponse.json(
        { error: "Un paiement est requis pour cette formation" },
        { status: 402 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        formationId: id,
        paidAmount: verifiedPaidAmount,
        stripeSessionId: stripeSessionId ?? null,
        progress: 0,
      },
    });

    // Increment student count
    await prisma.formation.update({
      where: { id },
      data: { studentsCount: { increment: 1 } },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("[POST /api/formations/[id]/enroll]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
