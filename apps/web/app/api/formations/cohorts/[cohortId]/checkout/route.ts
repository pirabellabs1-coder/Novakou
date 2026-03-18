// POST /api/formations/cohorts/[cohortId]/checkout — Checkout cohorte (mock ou Stripe)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { PaymentService } from "@/lib/payments/service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3450";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  try {
    const { cohortId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    const cohort = await prisma.formationCohort.findUnique({
      where: { id: cohortId },
      include: {
        formation: {
          select: { id: true, titleFr: true, titleEn: true, status: true, slug: true },
        },
      },
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohorte introuvable" }, { status: 404 });
    }
    if (cohort.status !== "OUVERT") {
      return NextResponse.json({ error: "Cette cohorte n'accepte plus d'inscriptions" }, { status: 400 });
    }
    if (new Date() > cohort.enrollmentDeadline) {
      return NextResponse.json({ error: "La deadline d'inscription est dépassée" }, { status: 400 });
    }
    if (cohort.currentCount >= cohort.maxParticipants) {
      return NextResponse.json({ error: "Cette cohorte est complète" }, { status: 400 });
    }
    if (cohort.formation.status !== "ACTIF") {
      return NextResponse.json({ error: "La formation n'est plus active" }, { status: 400 });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_formationId: { userId, formationId: cohort.formationId } },
    });
    if (existingEnrollment) {
      return NextResponse.json({ error: "Vous êtes déjà inscrit à cette formation" }, { status: 400 });
    }

    const payment = await PaymentService.createPayment({
      userId,
      amount: cohort.price,
      currency: "EUR",
      description: `${cohort.titleFr} — ${cohort.formation.titleFr}`,
      type: "cohort",
      itemId: cohortId,
      metadata: {
        type: "cohort",
        userId,
        cohortId,
        formationId: cohort.formationId,
      },
      successUrl: `${APP_URL}/formations/mes-cohorts/${cohortId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${APP_URL}/formations/${cohort.formation.slug}?cancelled=true`,
    });

    // Mock payment → create enrollment immediately
    if (payment.provider === "mock" && payment.status === "paid") {
      await prisma.enrollment.create({
        data: {
          userId,
          formationId: cohort.formationId,
          cohortId,
          paidAmount: cohort.price,
          stripeSessionId: payment.sessionId,
        },
      });
      await prisma.formationCohort.update({
        where: { id: cohortId },
        data: { currentCount: { increment: 1 } },
      });
      await prisma.formation.update({
        where: { id: cohort.formationId },
        data: { studentsCount: { increment: 1 } },
      });

      return NextResponse.json({
        url: `${APP_URL}/formations/mes-cohorts/${cohortId}?success=true&session_id=${payment.sessionId}`,
        sessionId: payment.sessionId,
        mock: true,
      });
    }

    return NextResponse.json({ url: payment.checkoutUrl, sessionId: payment.sessionId });
  } catch (error) {
    console.error("[POST /api/formations/cohorts/[cohortId]/checkout]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
