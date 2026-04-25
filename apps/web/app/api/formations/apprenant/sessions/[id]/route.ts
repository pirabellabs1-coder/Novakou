import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { meetingUrlFrom, isJoinableNow } from "@/lib/mentor/jitsi";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/apprenant/sessions/[id]
 * Returns a single mentor session for the authenticated learner.
 * Verifies ownership (studentId must match).
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const booking = await prisma.mentorBooking.findFirst({
      where: { id, studentId: userId },
      include: {
        mentor: {
          include: {
            user: { select: { id: true, name: true, image: true, email: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: booking.id,
        status: booking.status,
        scheduledAt: booking.scheduledAt,
        durationMinutes: booking.durationMinutes,
        paidAmount: booking.paidAmount,
        studentGoals: booking.studentGoals,
        meetingLink: booking.meetingLink,
        meetingUrl: meetingUrlFrom(booking.meetingRoomId, booking.id),
        isJoinable: booking.status === "CONFIRMED" && isJoinableNow(booking.scheduledAt, booking.durationMinutes),
        studentRating: booking.studentRating,
        studentReview: booking.studentReview,
        mentorFeedback: booking.mentorFeedback,
        createdAt: booking.createdAt,
        mentor: {
          id: booking.mentor.id,
          userId: booking.mentor.user.id,
          name: booking.mentor.user.name,
          image: booking.mentor.user.image,
          specialty: booking.mentor.specialty,
          domain: booking.mentor.domain,
          bio: booking.mentor.bio,
          sessionDuration: booking.mentor.sessionDuration,
          rating: booking.mentor.rating,
        },
        canReview: booking.status === "COMPLETED" && booking.studentRating == null,
        canCancel: booking.status === "PENDING" || booking.status === "CONFIRMED",
      },
    });
  } catch (err) {
    console.error("[apprenant/sessions/[id] GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/apprenant/sessions/[id]
 * Actions: cancel
 *
 * Body: { action: "cancel" }
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { action } = body as { action?: string };

    const booking = await prisma.mentorBooking.findFirst({
      where: { id, studentId: userId },
      include: {
        mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }

    if (action === "cancel") {
      const { reason } = body as { reason?: string };

      if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
        return NextResponse.json(
          { error: "Cette session ne peut plus être annulée." },
          { status: 400 },
        );
      }

      // ── Case 1: Not yet confirmed by mentor → automatic full refund ──
      if (booking.status === "PENDING") {
        const updated = await prisma.mentorBooking.update({
          where: { id },
          data: {
            status: "CANCELLED",
            escrowStatus: "REFUNDED",
            cancelledBy: "student",
            cancelRequestedAt: new Date(),
            cancellationReason: reason?.trim() || "Annulé avant confirmation mentor",
          },
        });

        await prisma.notification.create({
          data: {
            userId: booking.mentor.user.id,
            type: "ORDER",
            title: "Session annulée par l'apprenant",
            message: `${session?.user?.name ?? "L'apprenant"} a annulé sa session du ${booking.scheduledAt.toLocaleDateString("fr-FR")} (avant confirmation). Remboursement automatique.`,
            link: "/mentor/rendez-vous",
          },
        }).catch(() => null);

        return NextResponse.json({
          data: { id: updated.id, status: updated.status, escrowStatus: updated.escrowStatus, autoRefund: true },
        });
      }

      // ── Case 2: Already confirmed → requires reason + admin approval ──
      if (!reason || reason.trim().length < 30) {
        return NextResponse.json(
          { error: "Motif d'annulation requis (30 caractères minimum). L'admin examinera votre demande." },
          { status: 400 },
        );
      }

      const updated = await prisma.mentorBooking.update({
        where: { id },
        data: {
          status: "CANCELLATION_REQUESTED_STUDENT",
          escrowStatus: "DISPUTED",
          cancelledBy: "student",
          cancelRequestedAt: new Date(),
          cancellationReason: reason.trim(),
        },
      });

      // Notify mentor + admins
      await prisma.notification.create({
        data: {
          userId: booking.mentor.user.id,
          type: "ORDER",
          title: "Demande d'annulation de l'apprenant",
          message: `${session?.user?.name ?? "L'apprenant"} a demandé l'annulation de la session du ${booking.scheduledAt.toLocaleDateString("fr-FR")}. L'admin examinera la demande.`,
          link: "/mentor/rendez-vous",
        },
      }).catch(() => null);

      // Notify all admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "ORDER" as const,
          title: "Dispute mentor : annulation apprenant",
          message: `Session du ${booking.scheduledAt.toLocaleDateString("fr-FR")} : l'apprenant demande un remboursement.`,
          link: "/admin/mentor-disputes",
        })),
      }).catch(() => null);

      return NextResponse.json({
        data: { id: updated.id, status: updated.status, escrowStatus: updated.escrowStatus, awaitingAdmin: true },
      });
    }

    return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
  } catch (err) {
    console.error("[apprenant/sessions/[id] PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
