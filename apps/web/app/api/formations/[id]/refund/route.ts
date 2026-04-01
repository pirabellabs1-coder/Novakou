// POST /api/formations/[id]/refund — Demande de remboursement apprenant (30 jours max)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { ensureUserInDb } from "@/lib/formations/ensure-user";

const REFUND_WINDOW_DAYS = 30;

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
    await ensureUserInDb(session as { user: { id: string; email: string; name: string } });

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        formationId: id,
      },
      include: {
        formation: { select: { title: true, price: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 });
    }

    if (enrollment.refundRequested) {
      return NextResponse.json({ error: "Remboursement déjà demandé" }, { status: 400 });
    }

    // Check 30-day window
    const enrolledAt = new Date(enrollment.createdAt);
    const now = new Date();
    const daysSinceEnrollment = Math.floor((now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceEnrollment > REFUND_WINDOW_DAYS) {
      return NextResponse.json(
        { error: `Le délai de remboursement de ${REFUND_WINDOW_DAYS} jours est dépassé` },
        { status: 400 }
      );
    }

    // Check progress — block refund if > 50% completed
    if (enrollment.progress > 50) {
      return NextResponse.json(
        { error: "Remboursement impossible : plus de 50% de la formation complétée" },
        { status: 400 }
      );
    }

    // Mark refund as requested
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { refundRequested: true },
    });

    return NextResponse.json({
      success: true,
      message: "Demande de remboursement envoyée. L'équipe va traiter votre demande.",
    });
  } catch (error) {
    console.error("[POST /api/formations/[id]/refund]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
