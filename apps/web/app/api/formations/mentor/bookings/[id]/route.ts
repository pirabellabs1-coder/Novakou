import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";
import { buildMeetingUrl, generateRoomId } from "@/lib/mentor/jitsi";
import {
  sendMentorBookingConfirmedEmail,
  sendMentorBookingCancelledEmail,
  sendMentorMeetingLinkEmail,
  sendMentorSessionCompletedEmail,
} from "@/lib/email/mentor";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/mentor/bookings/[id]
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
 * PATCH /api/mentor/bookings/[id]
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
      case "confirm": {
        if (booking.status !== "PENDING")
          return NextResponse.json({ error: "Cette réservation n'est pas en attente" }, { status: 400 });

        // Auto-generate meeting room if missing
        const roomId = booking.meetingRoomId || generateRoomId(booking.id);
        const autoMeetingUrl = buildMeetingUrl(booking.id);
        // Keep existing manual link if any, else use auto Jitsi URL
        const effectiveMeetingLink = booking.meetingLink ?? autoMeetingUrl;

        updated = await prisma.mentorBooking.update({
          where: { id: id },
          data: {
            status: "CONFIRMED",
            meetingRoomId: roomId,
            meetingLink: effectiveMeetingLink,
          },
        });

        // Notify student — in-app + email
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            type: "ORDER",
            title: "Séance confirmée !",
            message: `Votre séance de mentorat a été confirmée. Rendez-vous le ${new Date(booking.scheduledAt).toLocaleDateString("fr-FR")}.`,
            link: `/apprenant/sessions/${booking.id}`,
          },
        }).catch(() => null);

        if (studentEmail) {
          await sendMentorBookingConfirmedEmail({
            studentEmail,
            studentName,
            mentorName,
            scheduledAt: booking.scheduledAt,
            durationMinutes: booking.durationMinutes,
            meetingLink: effectiveMeetingLink,
          }).catch((e) => console.warn("[mentor email confirm]", e));
        }

        break;
      }

      case "cancel": {
        if (["COMPLETED", "CANCELLED", "RELEASED"].includes(booking.status))
          return NextResponse.json({ error: "Cette réservation ne peut plus être annulée" }, { status: 400 });

        const reason: string | undefined = body.reason;
        if (!reason || reason.trim().length < 30)
          return NextResponse.json(
            { error: "Motif d'annulation obligatoire (30 caractères minimum). L'admin examinera la demande." },
            { status: 400 },
          );

        // Mentor cancellation → always requires admin approval (escrow disputed)
        updated = await prisma.mentorBooking.update({
          where: { id: id },
          data: {
            status: "CANCELLATION_REQUESTED_MENTOR",
            escrowStatus: "DISPUTED",
            cancelledBy: "mentor",
            cancelRequestedAt: new Date(),
            cancellationReason: reason.trim(),
          },
        });

        // Notify student + admins
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            type: "ORDER",
            title: "Demande d'annulation du mentor",
            message: `Le mentor a demandé l'annulation de votre séance du ${new Date(booking.scheduledAt).toLocaleDateString("fr-FR")}. L'admin examinera la demande. En cas de validation, vous serez remboursé.`,
            link: "/apprenant/sessions",
          },
        }).catch(() => null);

        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: "ORDER" as const,
            title: "Dispute mentor : annulation mentor",
            message: `Le mentor a annulé la session du ${new Date(booking.scheduledAt).toLocaleDateString("fr-FR")}. À valider.`,
            link: "/admin/mentor-disputes",
          })),
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
      }

      case "complete": {
        if (booking.status !== "CONFIRMED")
          return NextResponse.json({ error: "Seules les séances confirmées peuvent être marquées terminées" }, { status: 400 });

        // Commission split (like formations/products): 10% platform, 90% vendor
        const commissionAmount = Math.round(booking.paidAmount * PLATFORM_COMMISSION_RATE);
        const vendorAmount = booking.paidAmount - commissionAmount;

        // Check if this is a new student (for totalStudents increment)
        const priorWithSameStudent = await prisma.mentorBooking.count({
          where: {
            mentorId: profile.id,
            studentId: booking.studentId,
            status: "COMPLETED",
            id: { not: id },
          },
        });
        const isNewStudent = priorWithSameStudent === 0;

        await prisma.$transaction([
          prisma.mentorBooking.update({
            where: { id: id },
            data: {
              status: "COMPLETED",
              mentorFeedback: body.mentorFeedback ?? null,
              reviewRequestSentAt: new Date(),
              completedAt: new Date(),
            },
          }),
          prisma.mentorProfile.update({
            where: { id: profile.id },
            data: {
              totalSessions: { increment: 1 },
              ...(isNewStudent ? { totalStudents: { increment: 1 } } : {}),
            },
          }),
          prisma.platformRevenue.create({
            data: {
              orderId: booking.id,
              orderType: "mentor",
              grossAmount: booking.paidAmount,
              commissionRate: PLATFORM_COMMISSION_RATE,
              commissionAmount,
              vendorAmount,
              currency: "XOF",
            },
          }),
        ]);

        updated = await prisma.mentorBooking.findUnique({ where: { id } });

        // Notify student to leave a review — in-app + email
        await prisma.notification.create({
          data: {
            userId: booking.studentId,
            type: "ORDER",
            title: "Séance terminée — Laissez un avis",
            message: "Votre séance de mentorat est terminée. N'oubliez pas de laisser un avis à votre mentor !",
            link: `/apprenant/sessions/${booking.id}`,
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
      }

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
            link: "/apprenant/dashboard",
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
