import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/formations/admin/mentor-disputes/[id]
 * Admin decision on a mentor booking dispute.
 *
 * Body: {
 *   outcome: "refund_student" | "release_to_mentor" | "split_50_50",
 *   note?: string (shown to both parties)
 * }
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || role !== "ADMIN") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const body = await request.json();
    const { outcome, note } = body as {
      outcome?: "refund_student" | "release_to_mentor" | "split_50_50";
      note?: string;
    };

    if (!outcome || !["refund_student", "release_to_mentor", "split_50_50"].includes(outcome)) {
      return NextResponse.json({ error: "Outcome invalide" }, { status: 400 });
    }

    const booking = await prisma.mentorBooking.findUnique({
      where: { id },
      include: {
        mentor: { include: { user: { select: { id: true, email: true, name: true } } } },
        student: { select: { id: true, email: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (!booking.status.startsWith("CANCELLATION_REQUESTED")) {
      return NextResponse.json({ error: "Cette réservation n'est pas en dispute" }, { status: 400 });
    }

    const now = new Date();
    let newStatus: "CANCELLED" | "RELEASED" = "CANCELLED";
    let newEscrowStatus: "REFUNDED" | "RELEASED" = "REFUNDED";
    let platformRevenueData: {
      grossAmount: number;
      commissionAmount: number;
      vendorAmount: number;
    } | null = null;

    if (outcome === "refund_student") {
      newStatus = "CANCELLED";
      newEscrowStatus = "REFUNDED";
      // No platform revenue logged (full refund)
    } else if (outcome === "release_to_mentor") {
      newStatus = "RELEASED";
      newEscrowStatus = "RELEASED";
      // Platform commission applies
      const gross = booking.paidAmount;
      const commission = Math.round(gross * PLATFORM_COMMISSION_RATE);
      platformRevenueData = {
        grossAmount: gross,
        commissionAmount: commission,
        vendorAmount: gross - commission,
      };
    } else {
      // split_50_50: half refund to student, half to mentor (after commission)
      newStatus = "CANCELLED";
      newEscrowStatus = "REFUNDED"; // Mark as refunded since student got half back
      const halfGross = Math.round(booking.paidAmount / 2);
      const commission = Math.round(halfGross * PLATFORM_COMMISSION_RATE);
      platformRevenueData = {
        grossAmount: halfGross,
        commissionAmount: commission,
        vendorAmount: halfGross - commission,
      };
    }

    const updated = await prisma.mentorBooking.update({
      where: { id },
      data: {
        status: newStatus,
        escrowStatus: newEscrowStatus,
        adminDecisionAt: now,
        adminDecisionBy: session.user.id,
        adminDecisionOutcome: outcome,
        adminDecisionNote: note?.trim() || null,
        escrowReleasedAt: newEscrowStatus === "RELEASED" ? now : undefined,
      },
    });

    if (platformRevenueData) {
      await prisma.platformRevenue.create({
        data: {
          orderId: updated.id,
          orderType: "mentor",
          grossAmount: platformRevenueData.grossAmount,
          commissionRate: PLATFORM_COMMISSION_RATE,
          commissionAmount: platformRevenueData.commissionAmount,
          vendorAmount: platformRevenueData.vendorAmount,
          paymentRef: booking.paymentRef,
        },
      }).catch((e) => console.warn("[admin dispute] platform revenue log failed", e));
    }

    // Notify both parties
    const studentMsg = {
      refund_student: "Votre demande a été acceptée. Vous serez remboursé intégralement.",
      release_to_mentor: "Votre demande a été refusée. Les fonds ont été libérés vers le mentor.",
      split_50_50: "L'admin a décidé d'un partage 50/50 : vous serez remboursé de la moitié.",
    }[outcome];

    const mentorMsg = {
      refund_student: "L'admin a validé l'annulation. L'apprenant est remboursé.",
      release_to_mentor: "L'admin a tranché en votre faveur. Les fonds sont libérés dans votre wallet.",
      split_50_50: "L'admin a décidé d'un partage 50/50 : vous recevrez la moitié des fonds.",
    }[outcome];

    await prisma.notification.createMany({
      data: [
        {
          userId: booking.student.id,
          type: "ORDER",
          title: "Décision admin sur votre demande",
          message: studentMsg + (note ? ` Motif: ${note}` : ""),
          link: "/formations/apprenant/sessions",
        },
        {
          userId: booking.mentor.user.id,
          type: "ORDER",
          title: "Décision admin sur votre session",
          message: mentorMsg + (note ? ` Motif: ${note}` : ""),
          link: "/formations/mentor/rendez-vous",
        },
      ],
    }).catch(() => null);

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        escrowStatus: updated.escrowStatus,
        outcome,
      },
    });
  } catch (err) {
    console.error("[admin/mentor-disputes PATCH]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
