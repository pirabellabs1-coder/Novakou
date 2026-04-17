import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { retrievePayment, isMonerooConfigured } from "@/lib/moneroo";
import { sendMentorBookingRequestEmail } from "@/lib/email/mentor";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/formations/mentor-bookings/[id]/confirm-payment
 *
 * Finalizes payment for a mentor booking in PAYMENT_PENDING state.
 * - Mock mode (no Moneroo key): trusts the call (dev only)
 * - Real mode: verifies payment with Moneroo API using paymentRef
 *
 * On success:
 *   • status = PENDING (awaiting mentor confirmation)
 *   • escrowStatus = HELD (funds locked by platform)
 *   • paidAt = now
 *   • Notification + email sent to mentor
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
    }

    const booking = await prisma.mentorBooking.findUnique({
      where: { id },
      include: {
        mentor: { include: { user: { select: { id: true, email: true, name: true } } } },
        student: { select: { id: true, email: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }
    if (booking.studentId !== session.user.id) {
      return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
    }

    // Idempotency: if already paid, return success
    if (booking.status !== "PAYMENT_PENDING" && booking.escrowStatus !== "NONE") {
      return NextResponse.json({
        data: { bookingId: booking.id, status: booking.status, escrowStatus: booking.escrowStatus, alreadyConfirmed: true },
      });
    }

    // ── Verify payment ─────────────────────────────────────────────────────
    if (booking.paymentProvider === "moneroo") {
      if (!isMonerooConfigured()) {
        return NextResponse.json({ error: "Moneroo non configuré" }, { status: 500 });
      }
      if (!booking.paymentRef) {
        return NextResponse.json({ error: "Référence paiement manquante" }, { status: 400 });
      }
      const payment = await retrievePayment(booking.paymentRef);
      if (payment.status !== "success") {
        return NextResponse.json(
          { error: `Paiement non finalisé (statut: ${payment.status})`, status: payment.status },
          { status: 402 },
        );
      }
    }
    // else mock: trust the call (dev only, no-op verification)

    // ── Finalize ──────────────────────────────────────────────────────────
    const now = new Date();
    const updated = await prisma.mentorBooking.update({
      where: { id: booking.id },
      data: {
        status: "PENDING",
        escrowStatus: "HELD",
        paidAt: now,
      },
    });

    // Notify mentor (in-app + email) — fire and forget
    await prisma.notification.create({
      data: {
        userId: booking.mentor.user.id,
        type: "ORDER",
        title: "Nouvelle demande de séance payée",
        message: `${booking.student.name ?? "Un apprenant"} a réservé et payé une séance le ${booking.scheduledAt.toLocaleDateString("fr-FR")} à ${booking.scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. Les fonds sont bloqués en escrow.`,
        link: "/mentor/rendez-vous",
      },
    }).catch((err) => console.warn("[confirm-payment] notif mentor failed", err));

    if (booking.mentor.user.email) {
      await sendMentorBookingRequestEmail({
        mentorEmail: booking.mentor.user.email,
        mentorName: booking.mentor.user.name ?? booking.mentor.specialty ?? "Mentor",
        studentName: booking.student.name ?? booking.student.email ?? "Un apprenant",
        scheduledAt: booking.scheduledAt,
        durationMinutes: booking.durationMinutes,
        paidAmount: booking.paidAmount,
      }).catch((err) => console.warn("[confirm-payment] email mentor failed", err));
    }

    return NextResponse.json({
      data: {
        bookingId: updated.id,
        status: updated.status,
        escrowStatus: updated.escrowStatus,
        paidAt: updated.paidAt,
      },
    });
  } catch (err) {
    console.error("[mentor-bookings/confirm-payment]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Erreur lors de la confirmation du paiement", detail: IS_DEV ? message : undefined },
      { status: 500 },
    );
  }
}
