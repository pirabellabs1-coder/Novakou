import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/mentor/bookings
 * Returns all bookings for the authenticated mentor.
 * Query params:
 *   status: PENDING | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW  (optional, multiple via comma)
 *   from:   ISO date string  (optional)
 *   to:     ISO date string  (optional)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (!profile)
      return NextResponse.json({ data: [], profile: null });

    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
    type BS = typeof validStatuses[number];

    const statusFilter: BS[] = statusRaw
      ? (statusRaw
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter((s): s is BS => validStatuses.includes(s as BS)))
      : [];

    const where: Record<string, unknown> = { mentorId: profile.id };
    if (statusFilter.length > 0) where.status = { in: statusFilter };
    if (from || to) {
      where.scheduledAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const bookings = await prisma.mentorBooking.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        paidAmount: true,
        status: true,
        meetingLink: true,
        sessionNotes: true,
        studentRating: true,
        mentorFeedback: true,
        student: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ data: bookings, profile });
  } catch (err) {
    console.error("[mentor/bookings GET list]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
