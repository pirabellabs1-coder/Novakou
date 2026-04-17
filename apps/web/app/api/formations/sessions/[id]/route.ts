import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/formations/sessions/[id]
 * Returns a MentorBooking if the caller is either the student OR the mentor.
 * Used by the integrated Jitsi page (/sessions/[id]/salle).
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const booking = await prisma.mentorBooking.findUnique({
      where: { id },
      include: {
        mentor: {
          select: {
            id: true,
            user: { select: { id: true, name: true } },
          },
        },
        student: { select: { id: true, name: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });

    const viewerRole: "student" | "mentor" | null =
      booking.studentId === session.user.id ? "student" :
      booking.mentor.user.id === session.user.id ? "mentor" : null;

    if (!viewerRole) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    return NextResponse.json({
      data: {
        id: booking.id,
        status: booking.status,
        scheduledAt: booking.scheduledAt,
        durationMinutes: booking.durationMinutes,
        meetingRoomId: booking.meetingRoomId,
        meetingUrl: booking.meetingRoomId ? `https://meet.jit.si/${booking.meetingRoomId}` : booking.meetingLink,
        studentAttended: booking.studentAttended,
        mentorAttended: booking.mentorAttended,
        mentor: {
          id: booking.mentor.id,
          userId: booking.mentor.user.id,
          name: booking.mentor.user.name,
        },
        student: {
          id: booking.student.id,
          name: booking.student.name,
        },
        viewerRole,
      },
    });
  } catch (err) {
    console.error("[formations/sessions GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
