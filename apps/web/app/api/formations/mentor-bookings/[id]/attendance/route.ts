import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/formations/mentor-bookings/[id]/attendance
 * Body: { attended: boolean }
 *
 * The caller must be either the student or the mentor of the booking.
 * - attended=true → records presence for the calling role
 * - attended=false → marks absence (will trigger dispute workflow if the other party claims presence)
 *
 * When BOTH parties confirm presence (studentAttended=true AND mentorAttended=true),
 * the booking is automatically moved to COMPLETED (escrow stays HELD, cron releases 24h later).
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { attended } = body as { attended?: boolean };
    if (typeof attended !== "boolean") {
      return NextResponse.json({ error: "Champ `attended` boolean requis" }, { status: 400 });
    }

    const booking = await prisma.mentorBooking.findUnique({
      where: { id },
      include: {
        mentor: { include: { user: { select: { id: true } } } },
        student: { select: { id: true } },
      },
    });
    if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    const userId = session.user.id;
    const isStudent = booking.studentId === userId;
    const isMentor = booking.mentor.user.id === userId;

    if (!isStudent && !isMentor) {
      return NextResponse.json({ error: "Vous n'êtes pas partie de cette session" }, { status: 403 });
    }

    // Only allowed for CONFIRMED or COMPLETED sessions (and only after scheduled start - 30min)
    if (!["CONFIRMED", "COMPLETED"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Vous ne pouvez marquer votre présence que pour une session confirmée." },
        { status: 400 },
      );
    }
    const earliestAllowed = new Date(booking.scheduledAt.getTime() - 30 * 60 * 1000);
    if (new Date() < earliestAllowed) {
      return NextResponse.json(
        { error: "Marquage de présence disponible 30 min avant le début de la session." },
        { status: 400 },
      );
    }

    const now = new Date();
    const update: {
      studentAttended?: boolean;
      studentAttendedAt?: Date;
      mentorAttended?: boolean;
      mentorAttendedAt?: Date;
    } = {};
    if (isStudent) {
      update.studentAttended = attended;
      update.studentAttendedAt = now;
    } else {
      update.mentorAttended = attended;
      update.mentorAttendedAt = now;
    }

    let updated = await prisma.mentorBooking.update({
      where: { id },
      data: update,
    });

    // If both confirmed presence AND session is still CONFIRMED, auto-move to COMPLETED
    const bothConfirmed =
      (isStudent ? attended : updated.studentAttended) === true &&
      (isMentor ? attended : updated.mentorAttended) === true;

    if (bothConfirmed && updated.status === "CONFIRMED") {
      updated = await prisma.mentorBooking.update({
        where: { id },
        data: { status: "COMPLETED", completedAt: now },
      });
      // Notify both parties
      await prisma.notification.createMany({
        data: [
          {
            userId: booking.student.id,
            type: "ORDER" as const,
            title: "Session terminée ✓",
            message: `Votre séance du ${booking.scheduledAt.toLocaleDateString("fr-FR")} a été marquée comme terminée. Les fonds seront libérés au mentor dans 24h.`,
            link: "/formations/apprenant/sessions",
          },
          {
            userId: booking.mentor.user.id,
            type: "ORDER" as const,
            title: "Session terminée ✓",
            message: `Votre séance du ${booking.scheduledAt.toLocaleDateString("fr-FR")} est confirmée terminée. Les fonds seront libérés dans 24h.`,
            link: "/formations/mentor/finances",
          },
        ],
      }).catch(() => null);
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        studentAttended: updated.studentAttended,
        mentorAttended: updated.mentorAttended,
        autoCompleted: bothConfirmed && updated.status === "COMPLETED",
      },
    });
  } catch (err) {
    console.error("[mentor-bookings/attendance POST]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
