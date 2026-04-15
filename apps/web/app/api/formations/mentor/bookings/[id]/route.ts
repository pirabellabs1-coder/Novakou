import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import {
  sendMentorBookingConfirmedEmail,
  sendMentorBookingCancelledEmail,
  sendMentorMeetingLinkEmail,
  sendMentorSessionCompletedEmail,
} from "@/lib/email/mentor";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/formations/mentor/bookings/[id]
 * Returns a single booking (mentor access only).
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profil mentor introuvable" }, { status: 404 });

    const booking = await prisma.mentorBooking.findFirst({
      where: { id: id, mentorId: profile.id },
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        paidAmount: true,
        status: true,
        meetingLink: true,
        sessionNotes: true,
        studentRating: true,
        studentReview: true,
        mentorFeedback: true,
        student: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    return NextResponse.json({ data: booking });
  } catch (err) {
    console.error("[mentor/bookings GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/formations/mentor/bookings/[id]
 * Actions: confirm | cancel | complete | set_link | add_feedback
 *
 * Body:
 *   { action: "confirm" }
 *   { action: "cancel" }
 *   { action: "complete", mentorFeedback?: string }
 *   { action: "set_link", meetingLink: string }
 *   { action: "add_feedback", mentorFeedback: string }
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profil mentor introuvable" }, { status: 404 });

    const booking = await prisma.mentorBooking.findFirst({
      where: { id: id, mentorId: profile.id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        mentor: { select: { user: { select: { name: true } } } },
      },
    });
    if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    const mentorName = booking.mentor.user.name ?? profile.specialty ?? "Votre mentor";
    const studentName = booking.student.name ?? booking.student.email ?? "Apprenant";
    const studentEmail = booking.student.email;

    const body = await request.json();
    const { action } = body as { action: string; meetingLink?: string; mentorFeedback?: string };

    let updated;

    switch (action) {
      case "confirm":
        if (booking.status !== "PENDING")
          return NextResponse.json({ error: "Cette réservation n'est pas en attente" }, { status: 400 });

        updated = await prisma.mentorBooking.update({
          where: { id: id },
          data: { status: "CONFIRMED" },
        });

        // Notify student — in-app + email
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            type: "ORDER",
            title: "Séance confirmée !",
            message: `Votre séance de mentorat a été confirmée. Rendez-vous le ${new Date(booking.scheduledAt).toLocaleDateString("fr-FR")}.`,
            link: "/formations/apprenant/dashboard",
          },
        }).catch(() => null);

        if (studentEmail) {
          await sendMentorBookingConfirmedEmail({
            studentEmail,
            studentName,
            mentorName,
            scheduledAt: booking.scheduledAt,
            durationMinutes: booking.durationMinutes,
            meetingLink: booking.meetingLink ?? undefined,
          }).catch((e) => console.warn("[mentor email confirm]", e));
        }

        break;

      case "cancel":
        if (["COMPLETED", "CANCELLED"].includes(booking.status))
          return NextResponse.json({ error: "Cette réservation ne peut plus être annulée" }, { status: 400 });

        updated = await prisma.mentorBooking.update({
          where: { id: id },
          data: { status: "CANCELLED" },
        });

        // Notify student — in-app + email
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            type: "ORDER",
            title: "Séance annulée",
            message: `Votre séance de mentorat du ${new Date(booking.scheduledAt).toLocaleDateString("fr-FR")} a été annulée.`,
            link: "/formations/apprenant/dashboard",
          },
        }).catch(() => null);

        if (studentEmail) {
          await sendMentorBookingCancelledEmail({
            studentEmail,
            studentName,
            mentorName,
            scheduledAt: booking.scheduledAt,
          }).catch((e) => console.warn("[mentor email cancel]", e));
        }

        break;

      case "complete":
        if (booking.status !== "CONFIRMED")
          return NextResponse.json({ error: "Seules les séances confirmées peuvent être marquées terminées" }, { status: 400 });

        updated = await prisma.mentorBooking.update({
          where: { id: id },
          data: {
            status: "COMPLETED",
            mentorFeedback: body.mentorFeedback ?? null,
          },
        });

        // Increment mentor stats
        await prisma.mentorProfile.update({
          where: { id: profile.id },
          data: {
            totalSessions: { increment: 1 },
          },
        });

        // Notify student to leave a review — in-app + email
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            type: "ORDER",
            title: "Séance terminée — Laissez un avis",
            message: "Votre séance de mentorat est terminée. N'oubliez pas de laisser un avis à votre mentor !",
            link: "/formations/apprenant/dashboard",
          },
        }).catch(() => null);

        if (studentEmail) {
          await sendMentorSessionCompletedEmail({
            studentEmail,
            studentName,
            mentorName,
            bookingId: id,
          }).catch((e) => console.warn("[mentor email complete]", e));
        }

        break;

      case "set_link": {
        const link = body.meetingLink?.trim();
        if (!link) return NextResponse.json({ error: "Lien manquant" }, { status: 400 });

        updated = await prisma.mentorBooking.update({
          where: { id: id },
          data: { meetingLink: link },
        });

        // Notify student of the meeting link — in-app + email
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            type: "ORDER",
            title: "Lien de visioconférence disponible",
            message: `Votre mentor a partagé le lien pour votre séance du ${new Date(booking.scheduledAt).toLocaleDateString("fr-FR")}.`,
            link: "/formations/apprenant/dashboard",
          },
        }).catch(() => null);

        if (studentEmail) {
          await sendMentorMeetingLinkEmail({
            studentEmail,
            studentName,
            mentorName,
            scheduledAt: booking.scheduledAt,
            meetingLink: link,
          }).catch((e) => console.warn("[mentor email link]", e));
        }

        break;
      }

      case "add_feedback": {
        const fb = body.mentorFeedback?.trim();
        if (!fb) return NextResponse.json({ error: "Feedback manquant" }, { status: 400 });

        updated = await prisma.mentorBooking.update({
          where: { id: id },
          data: { mentorFeedback: fb },
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Action inconnue: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[mentor/bookings PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
