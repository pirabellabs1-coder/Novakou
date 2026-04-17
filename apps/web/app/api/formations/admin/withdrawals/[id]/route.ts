import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/withdrawals/[id]
 *
 * Body:
 *   { action: "approve", reference?: string }           → sets status TRAITE + processedAt
 *   { action: "refuse", refusedReason: string }         → sets status REFUSE + refusedReason
 *
 * Admin-only. Approves or refuses an InstructorWithdrawal (vendor or mentor —
 * the two are distinguished by the "_mentor" suffix on the `method` field).
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["admin", "ADMIN"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, refusedReason, reference } = body as {
      action?: string;
      refusedReason?: string;
      reference?: string;
    };

    if (action !== "approve" && action !== "refuse") {
      return NextResponse.json({ error: "Action invalide (approve | refuse)." }, { status: 400 });
    }

    const w = await prisma.instructorWithdrawal.findUnique({
      where: { id },
      include: {
        instructeur: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!w) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }
    if (w.status !== "EN_ATTENTE") {
      return NextResponse.json(
        { error: `Cette demande a déjà été traitée (${w.status}).` },
        { status: 400 },
      );
    }

    const isMentor = w.method.endsWith("_mentor");
    const role = isMentor ? "mentor" : "vendeur";

    if (action === "approve") {
      await prisma.instructorWithdrawal.update({
        where: { id },
        data: {
          status: "TRAITE",
          processedAt: new Date(),
          ...(reference ? { paymentRef: reference } : {}),
        },
      });

      // Notify beneficiary
      await prisma.notification.create({
        data: {
          userId: w.instructeur.user.id,
          type: "PAYMENT",
          title: "Retrait approuvé ✅",
          message: `Votre demande de retrait de ${Math.round(w.amount)} FCFA a été approuvée et traitée.`,
          link: isMentor ? "/mentor/finances" : "/wallet",
        },
      }).catch(() => null);

      return NextResponse.json({
        data: { id, status: "TRAITE", role },
      });
    }

    // action === "refuse"
    if (!refusedReason || typeof refusedReason !== "string" || refusedReason.trim().length < 5) {
      return NextResponse.json(
        { error: "Un motif de refus est requis (5 caractères minimum)." },
        { status: 400 },
      );
    }

    await prisma.instructorWithdrawal.update({
      where: { id },
      data: {
        status: "REFUSE",
        processedAt: new Date(),
        refusedReason: refusedReason.trim(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: w.instructeur.user.id,
        type: "PAYMENT",
        title: "Retrait refusé",
        message: `Votre demande de retrait a été refusée. Motif : ${refusedReason.trim()}`,
        link: isMentor ? "/mentor/finances" : "/wallet",
      },
    }).catch(() => null);

    return NextResponse.json({
      data: { id, status: "REFUSE", role, refusedReason: refusedReason.trim() },
    });
  } catch (err) {
    console.error("[admin/withdrawals PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
