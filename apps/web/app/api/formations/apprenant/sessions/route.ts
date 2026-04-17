import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { meetingUrlFrom } from "@/lib/mentor/jitsi";

/**
 * GET /api/formations/apprenant/sessions
 * Returns all mentor sessions for the authenticated learner (upcoming + past).
 *
 * Response shape:
 *   {
 *     upcoming: [...],   // PENDING + CONFIRMED in the future
 *     past:     [...],   // COMPLETED, CANCELLED, NO_SHOW, or any past date
 *     stats: { total, upcoming, completed, pending }
 *   }
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const bookings = await prisma.mentorBooking.findMany({
      where: { studentId: userId },
      orderBy: { scheduledAt: "desc" },
      include: {
        mentor: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    const now = new Date();

    const mapped = bookings.map((b) => ({
      id: b.id,
      status: b.status,
      scheduledAt: b.scheduledAt,
      durationMinutes: b.durationMinutes,
      paidAmount: b.paidAmount,
      studentGoals: b.studentGoals,
      meetingLink: b.meetingLink,
      meetingUrl: meetingUrlFrom(b.meetingRoomId, b.id),
      studentRating: b.studentRating,
      studentReview: b.studentReview,
      mentorFeedback: b.mentorFeedback,
      createdAt: b.createdAt,
      mentor: {
        id: b.mentor.id,
        userId: b.mentor.user.id,
        name: b.mentor.user.name,
        image: b.mentor.user.image,
        specialty: b.mentor.specialty,
        domain: b.mentor.domain,
        sessionDuration: b.mentor.sessionDuration,
      },
      canReview: b.status === "COMPLETED" && b.studentRating == null,
    }));

    const upcoming = mapped.filter(
      (b) =>
        new Date(b.scheduledAt) >= now &&
        (b.status === "PENDING" || b.status === "CONFIRMED"),
    );
    const past = mapped.filter((b) => !upcoming.includes(b));

    const stats = {
      total: mapped.length,
      upcoming: upcoming.length,
      completed: mapped.filter((b) => b.status === "COMPLETED").length,
      pending: mapped.filter((b) => b.status === "PENDING").length,
      confirmed: mapped.filter((b) => b.status === "CONFIRMED").length,
    };

    return NextResponse.json({ data: { upcoming, past, stats } });
  } catch (err) {
    console.error("[apprenant/sessions GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
