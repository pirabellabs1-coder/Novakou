import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAvailableSlots } from "@/lib/mentor/slots";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/formations/mentors/[id]/slots?from=<ISO>&to=<ISO>
 * Returns the list of available slots for the given mentor in the date range.
 *
 * Slots exclude:
 *   - Past times and times within `bookingLeadTime` minutes
 *   - Periods overlapping CONFIRMED or PENDING bookings (+ sessionBuffer)
 *   - Times outside the mentor's weekly availability schedule
 *
 * Range is capped at 60 days. If `from` or `to` are missing, defaults:
 *   - from = now
 *   - to   = now + 14 days
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    const fromDate = fromParam ? new Date(fromParam) : now;
    const toDate = toParam ? new Date(toParam) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
      include: {
        availabilities: { where: { isActive: true } },
        availabilitySlots: {
          where: {
            isActive: true,
            // Margin to capture slots whose date may be in another tz
            date: {
              gte: new Date(fromDate.getTime() - 24 * 60 * 60 * 1000),
              lte: new Date(toDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        },
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            scheduledAt: {
              gte: new Date(fromDate.getTime() - 4 * 60 * 60 * 1000), // extra margin for buffer logic
              lte: new Date(toDate.getTime() + 4 * 60 * 60 * 1000),
            },
          },
          select: { scheduledAt: true, durationMinutes: true, status: true },
        },
        user: { select: { name: true, image: true } },
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor introuvable" }, { status: 404 });
    }

    if (!mentor.isAvailable) {
      return NextResponse.json({
        data: {
          slots: [],
          mentor: {
            id: mentor.id,
            name: mentor.user.name,
            image: mentor.user.image,
            specialty: mentor.specialty,
            sessionPrice: mentor.sessionPrice,
            sessionDuration: mentor.sessionDuration,
            timezone: mentor.timezone,
            isAvailable: false,
          },
          reason: "UNAVAILABLE",
        },
      });
    }

    const slots = computeAvailableSlots({
      availabilities: mentor.availabilities,
      availabilitySlots: mentor.availabilitySlots,
      bookings: mentor.bookings,
      fromDate,
      toDate,
      sessionDuration: mentor.sessionDuration,
      sessionBuffer: mentor.sessionBuffer,
      bookingLeadTime: mentor.bookingLeadTime,
    });

    const hasSchedule =
      mentor.availabilities.length > 0 || mentor.availabilitySlots.length > 0;

    return NextResponse.json({
      data: {
        slots,
        mentor: {
          id: mentor.id,
          name: mentor.user.name,
          image: mentor.user.image,
          specialty: mentor.specialty,
          sessionPrice: mentor.sessionPrice,
          sessionDuration: mentor.sessionDuration,
          timezone: mentor.timezone,
          isAvailable: true,
          hasSchedule,
        },
      },
    });
  } catch (err) {
    console.error("[mentors/[id]/slots GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
