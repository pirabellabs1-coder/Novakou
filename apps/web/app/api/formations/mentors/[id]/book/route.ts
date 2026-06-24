import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "node:crypto";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { isSlotStillAvailable } from "@/lib/mentor/slots";
import { generateRoomId } from "@/lib/mentor/jitsi";
import { initPayment as initMoneroo, isMonerooConfigured } from "@/lib/moneroo";
import { initPayment as initPayGenius, isPayGeniusConfigured } from "@/lib/paygenius";

type PaymentProvider = "moneroo" | "paygenius";

function resolveProvider(_raw: unknown): PaymentProvider {
  // PayGenius = fournisseur de paiement UNIQUE (Moneroo = repli dormant).
  return isPayGeniusConfigured() ? "paygenius" : "moneroo";
}

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
    const { slotStart, studentGoals, durationMinutes: requestedDuration, provider: rawProvider } = body as {
      slotStart?: string;
      studentGoals?: string;
      durationMinutes?: number;
      provider?: string;
    };
    const requestedProvider: PaymentProvider = resolveProvider(rawProvider);

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

    // ── STEP 0: Check if student has an active pack for this mentor ────
    // If yes, consume 1 session and bypass payment. We fetch candidates then
    // filter in JS because Prisma does not support field-vs-field comparison
    // in `where` (we'd need a raw query otherwise).
    const candidates = await prisma.mentorSessionPackPurchase
      .findMany({
        where: {
          userId: studentId,
          refundedAt: null,
          expiresAt: { gt: new Date() },
          pack: { mentorId: mentor.id, isActive: true },
        },
        include: { pack: true },
        orderBy: { expiresAt: "asc" }, // consume the oldest one first
      })
      .catch(() => []);
    const activePack = candidates.find((p) => p.sessionsConsumed < p.sessionsTotal) ?? null;

    // ── STEP 1: Create booking (PAYMENT_PENDING or CONFIRMED via pack) ────
    // Pre-generate the booking id so we can compute meetingRoomId BEFORE the
    // transaction and avoid a separate (non-atomic) update afterwards.
    const newBookingId = crypto.randomUUID();
    const roomId = generateRoomId(newBookingId);
    const slotEnd = new Date(slotDate.getTime() + duration * 60 * 1000);
    // Widen the window by the longest plausible session length so we also catch
    // existing bookings that started BEFORE this slot but whose end-time falls
    // inside it. The exact overlap is then refined in JS below.
    const maxSessionMs = 180 * 60 * 1000;
    const overlapWindowStart = new Date(slotDate.getTime() - maxSessionMs);

    let booking;
    try {
      booking = await prisma.$transaction(async (tx) => {
        // Re-query overlap INSIDE the transaction (anti race-condition).
        const candidates = await tx.mentorBooking.findMany({
          where: {
            mentorId: mentor.id,
            scheduledAt: { gte: overlapWindowStart, lt: slotEnd },
            status: { in: ["PENDING", "CONFIRMED", "PAYMENT_PENDING"] },
            escrowStatus: { not: "REFUNDED" },
          },
          select: { scheduledAt: true, durationMinutes: true },
        });
        const hasOverlap = candidates.some(
          (c: { scheduledAt: Date; durationMinutes: number }) => {
            const cStart = c.scheduledAt.getTime();
            const cEnd = cStart + (c.durationMinutes ?? 60) * 60 * 1000;
            // overlap = (cStart < slotEnd) && (cEnd > slotStart)
            return cStart < slotEnd.getTime() && cEnd > slotDate.getTime();
          },
        );
        if (hasOverlap) {
          throw new Error("SLOT_TAKEN");
        }
        return tx.mentorBooking.create({
          data: {
            id: newBookingId,
            mentorId: mentor.id,
            studentId,
            status: activePack ? "CONFIRMED" : "PAYMENT_PENDING",
            scheduledAt: slotDate,
            durationMinutes: duration,
            paidAmount: activePack ? 0 : mentor.sessionPrice,
            studentGoals: studentGoals.trim(),
            meetingRoomId: roomId,
            escrowStatus: activePack ? "RELEASED" : "NONE",
            packPurchaseId: activePack?.id ?? null,
            paidAt: activePack ? new Date() : null,
          },
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message === "SLOT_TAKEN") {
        return NextResponse.json(
          { error: "Ce créneau vient d'être pris ou n'est plus disponible." },
          { status: 409 },
        );
      }
      throw err;
    }

    // Consume one session from the pack
    if (activePack) {
      await prisma.mentorSessionPackPurchase.update({
        where: { id: activePack.id },
        data: { sessionsConsumed: { increment: 1 } },
      });
      return NextResponse.json({
        data: {
          bookingId: booking.id,
          scheduledAt: booking.scheduledAt,
          usedPack: true,
          remainingSessions: activePack.sessionsTotal - activePack.sessionsConsumed - 1,
          checkoutUrl: null,
          provider: "pack",
        },
      });
    }

    // ── STEP 2: Init payment (Moneroo / PayGenius / mock) ─────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const internalRef = `mnt:${booking.id}`;
    let checkoutUrl: string = "";
    let provider: "moneroo" | "paygenius" | "mock" = "mock";

    const providerConfigured =
      requestedProvider === "paygenius" ? isPayGeniusConfigured() : isMonerooConfigured();
    const useMock = !providerConfigured;
    let initFallback = false;

    if (!useMock) {
      const fName = session.user.name ?? session.user.email?.split("@")[0] ?? "Apprenant";
      const [first, ...rest] = fName.split(" ");
      const last = rest.join(" ") || first;
      const sharedMeta = {
        bookingId: booking.id,
        mentorId: mentor.id,
        studentId,
        internalRef,
        type: "mentor_booking",
      };
      const returnUrl = `${appUrl}/payment/return?ref=${encodeURIComponent(internalRef)}&bookingId=${booking.id}&provider=${requestedProvider}`;
      const description = `Réservation mentor — ${mentor.specialty || "Séance"}`;

      try {
        let providerRefId: string;
        if (requestedProvider === "paygenius") {
          const pg = await initPayGenius({
            amount: mentor.sessionPrice,
            currency: "XOF",
            description,
            customer: {
              email: session.user.email!,
              name: `${first || "Apprenant"} ${last || ""}`.trim(),
            },
            return_url: returnUrl,
            metadata: sharedMeta,
          });
          provider = "paygenius";
          checkoutUrl = pg.checkout_url;
          providerRefId = pg.reference;
        } else {
          const mnr = await initMoneroo({
            amount: mentor.sessionPrice,
            currency: "XOF",
            description,
            customer: {
              email: session.user.email!,
              first_name: first || "Apprenant",
              last_name: last || "—",
            },
            return_url: returnUrl,
            metadata: sharedMeta,
          });
          provider = "moneroo";
          checkoutUrl = mnr.checkout_url;
          providerRefId = mnr.id;
        }
        await prisma.mentorBooking.update({
          where: { id: booking.id },
          data: { paymentProvider: provider, paymentRef: providerRefId },
        });
      } catch (err) {
        console.warn(`[book] ${requestedProvider} failed, falling back to mock:`, err instanceof Error ? err.message : err);
        initFallback = true;
      }
    }

    if (useMock || initFallback) {
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
