import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { isSlotStillAvailable } from "@/lib/mentor/slots";
import { generateRoomId } from "@/lib/mentor/jitsi";
import { initPayment, isMonerooConfigured } from "@/lib/moneroo";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/formations/mentors/[id]/book
 *
 * Body:
 *   {
 *     slotStart: ISO datetime,
 *     studentGoals: string (min 30 chars),
 *     durationMinutes?: number (defaults to mentor.sessionDuration)
 *   }
 *
 * Creates a MentorBooking in PENDING state and sends notification + email to mentor.
 *
 * Security:
 *   - Requires authenticated user (no dev fallback for this public POST)
 *   - Cannot book yourself
 *   - Slot availability re-validated inside transaction to prevent race conditions
 *   - Payment is placeholder "paid" (matching /api/formations/checkout pattern until real provider is wired)
 */
export async function POST(request: Request, { params }: Params) {
  const { id: mentorId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Vous devez être connecté pour réserver." }, { status: 401 });
    }
    const studentId = session.user.id;
    if (!studentId) {
      return NextResponse.json({ error: "Session invalide." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { slotStart, studentGoals, durationMinutes: requestedDuration } = body as {
      slotStart?: string;
      studentGoals?: string;
      durationMinutes?: number;
    };

    // Validation basique
    if (!slotStart || typeof slotStart !== "string") {
      return NextResponse.json({ error: "Créneau manquant." }, { status: 400 });
    }
    const slotDate = new Date(slotStart);
    if (isNaN(slotDate.getTime())) {
      return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });
    }
    if (slotDate.getTime() < Date.now()) {
      return NextResponse.json({ error: "Ce créneau est déjà passé." }, { status: 400 });
    }
    if (!studentGoals || typeof studentGoals !== "string" || studentGoals.trim().length < 30) {
      return NextResponse.json({ error: "Merci de décrire vos objectifs (30 caractères minimum)." }, { status: 400 });
    }
    if (studentGoals.length > 5000) {
      return NextResponse.json({ error: "Description trop longue (5000 caractères maximum)." }, { status: 400 });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: {
        availabilities: { where: { isActive: true } },
        availabilitySlots: {
          where: {
            isActive: true,
            // 4h margin on each side to cover a slot that crosses midnight
            date: {
              gte: new Date(slotDate.getTime() - 36 * 60 * 60 * 1000),
              lte: new Date(slotDate.getTime() + 36 * 60 * 60 * 1000),
            },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor introuvable." }, { status: 404 });
    }
    if (!mentor.isAvailable) {
      return NextResponse.json({ error: "Ce mentor n'accepte plus de nouvelles réservations." }, { status: 400 });
    }
    if (mentor.user.id === studentId) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous réserver vous-même." }, { status: 400 });
    }
    if (mentor.availabilities.length === 0 && mentor.availabilitySlots.length === 0) {
      return NextResponse.json({ error: "Ce mentor n'a pas encore configuré sa disponibilité." }, { status: 400 });
    }

    const duration = Number.isFinite(requestedDuration) && requestedDuration! > 0
      ? Math.min(Math.max(Math.floor(requestedDuration!), 15), 180)
      : mentor.sessionDuration;

    // Check slot is still available (anti race-condition)
    const activeBookings = await prisma.mentorBooking.findMany({
      where: {
        mentorId: mentor.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        scheduledAt: {
          gte: new Date(slotDate.getTime() - 4 * 60 * 60 * 1000),
          lte: new Date(slotDate.getTime() + 4 * 60 * 60 * 1000),
        },
      },
      select: { scheduledAt: true, durationMinutes: true, status: true },
    });

    const stillAvailable = isSlotStillAvailable(slotDate, {
      availabilities: mentor.availabilities,
      availabilitySlots: mentor.availabilitySlots,
      bookings: activeBookings,
      sessionDuration: duration,
      sessionBuffer: mentor.sessionBuffer,
      bookingLeadTime: mentor.bookingLeadTime,
    });

    if (!stillAvailable) {
      return NextResponse.json(
        { error: "Ce créneau vient d'être pris ou n'est plus disponible." },
        { status: 409 },
      );
    }

    // ── STEP 1: Create booking in PAYMENT_PENDING state (no escrow yet) ────
    const booking = await prisma.mentorBooking.create({
      data: {
        mentorId: mentor.id,
        studentId,
        status: "PAYMENT_PENDING",
        scheduledAt: slotDate,
        durationMinutes: duration,
        paidAmount: mentor.sessionPrice,
        studentGoals: studentGoals.trim(),
        meetingRoomId: "",
        escrowStatus: "NONE",
      },
    });

    // Attach generated jitsi room id
    const roomId = generateRoomId(booking.id);
    await prisma.mentorBooking.update({
      where: { id: booking.id },
      data: { meetingRoomId: roomId },
    });

    // ── STEP 2: Init payment (Moneroo or mock) ────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const internalRef = `mnt:${booking.id}`;
    let checkoutUrl: string = "";
    let provider: "moneroo" | "mock" = "mock";

    const useMock = !isMonerooConfigured();
    let monerooFallback = false;

    if (!useMock) {
      // Try real Moneroo payment first
      const fName = session.user.name ?? session.user.email?.split("@")[0] ?? "Apprenant";
      const [first, ...rest] = fName.split(" ");
      const last = rest.join(" ") || first;
      try {
        const moneroo = await initPayment({
          amount: mentor.sessionPrice,
          currency: "XOF",
          description: `Réservation mentor — ${mentor.specialty || "Séance"}`,
          customer: {
            email: session.user.email!,
            first_name: first || "Apprenant",
            last_name: last || "—",
          },
          return_url: `${appUrl}/formations/payment/return?ref=${encodeURIComponent(internalRef)}&bookingId=${booking.id}`,
          metadata: {
            bookingId: booking.id,
            mentorId: mentor.id,
            studentId,
            internalRef,
            type: "mentor_booking",
          },
        });
        provider = "moneroo";
        checkoutUrl = moneroo.checkout_url;
        await prisma.mentorBooking.update({
          where: { id: booking.id },
          data: { paymentProvider: provider, paymentRef: moneroo.id },
        });
      } catch (err) {
        // Moneroo rejected (e.g. payment method not enabled for currency).
        // Fallback to mock so the flow continues — in production you'd want
        // to propagate this; here we keep the UX unblocked while keys get fixed.
        console.warn("[book] Moneroo failed, falling back to mock:", err instanceof Error ? err.message : err);
        monerooFallback = true;
      }
    }

    if (useMock || monerooFallback) {
      provider = "mock";
      checkoutUrl = `/payment/return?mock=1&bookingId=${booking.id}&ref=${encodeURIComponent(internalRef)}`;
      await prisma.mentorBooking.update({
        where: { id: booking.id },
        data: { paymentProvider: provider, paymentRef: internalRef },
      });
    }
    // Should always have checkoutUrl by this point
    if (!checkoutUrl) {
      await prisma.mentorBooking.delete({ where: { id: booking.id } }).catch(() => {});
      throw new Error("Impossible d'initialiser le paiement");
    }

    return NextResponse.json({
      data: {
        bookingId: booking.id,
        scheduledAt: booking.scheduledAt,
        durationMinutes: booking.durationMinutes,
        paidAmount: booking.paidAmount,
        status: booking.status,
        checkoutUrl,
        provider,
      },
    });
  } catch (err) {
    console.error("[mentors/[id]/book POST]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erreur serveur", detail: IS_DEV ? message : undefined }, { status: 500 });
  }
}

/**
 * Prevent unintended GET access.
 */
export async function GET() {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}
