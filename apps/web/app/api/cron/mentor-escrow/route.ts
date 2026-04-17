import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";

/**
 * GET /api/cron/mentor-escrow
 *
 * Runs every 15 min (Vercel cron). Does three things:
 *  1. Auto-COMPLETE sessions: CONFIRMED bookings whose scheduledAt + duration + 30min grace has passed
 *  2. Auto-RELEASE escrow: COMPLETED bookings whose completedAt was >24h ago and escrowStatus=HELD
 *  3. Log PlatformRevenue entry when escrow is released
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const GRACE_AFTER_END_MS = 30 * 60 * 1000; // 30 min after scheduled end
  const RELEASE_HOLD_MS = 24 * 60 * 60 * 1000; // 24h hold after completion

  let autoCompleted = 0;
  let autoReleased = 0;
  let revenuesLogged = 0;
  const errors: string[] = [];

  try {
    // ── Step 1: Auto-COMPLETE confirmed sessions past end time + grace ───
    const confirmedBookings = await prisma.mentorBooking.findMany({
      where: { status: "CONFIRMED" },
      select: { id: true, scheduledAt: true, durationMinutes: true },
    });

    const toComplete = confirmedBookings.filter((b) => {
      const endMs = b.scheduledAt.getTime() + b.durationMinutes * 60 * 1000 + GRACE_AFTER_END_MS;
      return endMs < now.getTime();
    });

    for (const b of toComplete) {
      try {
        await prisma.mentorBooking.update({
          where: { id: b.id },
          data: { status: "COMPLETED", completedAt: now },
        });
        autoCompleted++;
      } catch (err) {
        errors.push(`auto-complete ${b.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // ── Step 2: Auto-RELEASE escrow for sessions COMPLETED >24h ago ──────
    const cutoff = new Date(now.getTime() - RELEASE_HOLD_MS);
    const toRelease = await prisma.mentorBooking.findMany({
      where: {
        status: "COMPLETED",
        escrowStatus: "HELD",
        completedAt: { lte: cutoff },
      },
      select: { id: true, paidAmount: true, paymentRef: true },
    });

    for (const b of toRelease) {
      try {
        await prisma.mentorBooking.update({
          where: { id: b.id },
          data: {
            status: "RELEASED",
            escrowStatus: "RELEASED",
            escrowReleasedAt: now,
          },
        });

        // Log commission
        const gross = b.paidAmount;
        const commission = Math.round(gross * PLATFORM_COMMISSION_RATE);
        const vendorAmount = gross - commission;

        await prisma.platformRevenue.create({
          data: {
            orderId: b.id,
            orderType: "mentor",
            grossAmount: gross,
            commissionRate: PLATFORM_COMMISSION_RATE,
            commissionAmount: commission,
            vendorAmount,
            paymentRef: b.paymentRef,
          },
        });
        revenuesLogged++;
        autoReleased++;
      } catch (err) {
        errors.push(`auto-release ${b.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      autoCompleted,
      autoReleased,
      revenuesLogged,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[CRON mentor-escrow]", err);
    return NextResponse.json(
      { error: "Erreur cron mentor-escrow", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
