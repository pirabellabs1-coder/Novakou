// GET/POST /api/apprenant/refunds — Mes demandes de remboursement

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { FORMATIONS_CONFIG } from "@/lib/formations/config";
import { ensureUserInDb } from "@/lib/formations/ensure-user";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const userId = session.user.id;

    const refunds = await prisma.refundRequest.findMany({
      where: { userId },
      include: {
        enrollment: {
          include: {
            formation: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedRefunds = refunds.map((r) => ({
      id: r.id,
      enrollmentId: r.enrollmentId,
      amount: r.amount,
      reason: r.reason,
      status: r.status.toLowerCase(),
      adminNote: r.adminNote,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
      formation: {
        id: r.enrollment.formation.id,
        title: r.enrollment.formation.title,
        slug: r.enrollment.formation.slug,
        thumbnail: r.enrollment.formation.thumbnail,
      },
    }));

    return NextResponse.json({ refunds: mappedRefunds });
  } catch (error) {
    console.error("[GET /api/apprenant/refunds]", error);
    return NextResponse.json({ refunds: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const userId = session.user.id;
    const body = await req.json();
    const { enrollmentId, reason } = body;

    if (!enrollmentId || !reason) {
      return NextResponse.json(
        { error: "enrollmentId et reason sont requis" },
        { status: 400 }
      );
    }

    // Find the enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        formation: {
          select: { id: true, title: true },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      );
    }

    // Check ownership
    if (enrollment.userId !== userId) {
      return NextResponse.json(
        { error: "Cette inscription ne vous appartient pas" },
        { status: 403 }
      );
    }

    // Check refund window (14 days)
    const daysSinceEnrollment =
      (Date.now() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEnrollment > FORMATIONS_CONFIG.REFUND_WINDOW_DAYS) {
      return NextResponse.json(
        {
          error: `La période de remboursement de ${FORMATIONS_CONFIG.REFUND_WINDOW_DAYS} jours est dépassée`,
        },
        { status: 400 }
      );
    }

    // Check progress < 30%
    if (enrollment.progress >= FORMATIONS_CONFIG.REFUND_MAX_PROGRESS) {
      return NextResponse.json(
        {
          error: `Votre progression dépasse ${FORMATIONS_CONFIG.REFUND_MAX_PROGRESS}%. Le remboursement n'est plus possible.`,
        },
        { status: 400 }
      );
    }

    // Check no existing PENDING refund for this enrollment
    const existingRefund = await prisma.refundRequest.findFirst({
      where: {
        enrollmentId,
        status: "PENDING",
      },
    });

    if (existingRefund) {
      return NextResponse.json(
        { error: "Une demande de remboursement est déjà en cours pour cette inscription" },
        { status: 409 }
      );
    }

    // Create refund request
    const refund = await prisma.refundRequest.create({
      data: {
        userId,
        enrollmentId,
        amount: enrollment.paidAmount,
        reason,
        status: "PENDING",
      },
    });

    // Mark enrollment as refund requested
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { refundRequested: true, refundReason: reason },
    });

    return NextResponse.json({ refund }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/apprenant/refunds]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
