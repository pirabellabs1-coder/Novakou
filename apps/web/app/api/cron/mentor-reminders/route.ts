/**
 * Cron : mentor booking reminders (email H-24 et H-15min).
 *
 * Appelé par Vercel Cron toutes les 10 minutes.
 *
 * Fenêtres de traitement :
 *   - H-24 : bookings CONFIRMED avec scheduledAt entre maintenant+23h et maintenant+24h10m
 *   - H-15m : bookings CONFIRMED avec scheduledAt entre maintenant+14m et maintenant+16m
 *
 * Garantit qu'on envoie au maximum 1 email par (bookingId, kind) grâce à la
 * unique constraint (@@unique([bookingId, kind])) sur MentorBookingReminder.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout, button, getAppUrl } from "@/lib/email";

// Sécurité : seul Vercel Cron ou un appelant avec le secret peut déclencher
function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // permissif si pas configuré (dev)
  return auth === `Bearer ${expected}`;
}

async function sendReminderEmail(booking: {
  id: string;
  studentEmail: string;
  studentName: string;
  mentorName: string;
  scheduledAt: Date;
  meetingLink: string | null;
  meetingRoomId: string | null;
  kind: "H-24" | "H-15m";
}) {
  const dateStr = booking.scheduledAt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const meetingUrl = booking.meetingLink
    || (booking.meetingRoomId ? `${getAppUrl()}/sessions/${booking.id}/salle` : `${getAppUrl()}/apprenant/rendez-vous`);

  const urgency = booking.kind === "H-15m" ? "Votre séance commence dans 15 minutes" : "Rappel : votre séance est demain";
  const leadLine = booking.kind === "H-15m"
    ? `Il ne reste que <strong>15 minutes</strong> avant votre séance avec <strong>${booking.mentorName}</strong>.`
    : `Votre séance avec <strong>${booking.mentorName}</strong> aura lieu <strong>dans 24 heures</strong>.`;

  const html = emailLayout(`
    <h2 style="color:#111827;font-size:22px;margin:0 0 12px;">${urgency}</h2>
    <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Bonjour ${booking.studentName?.split(" ")[0] ?? "à vous"}, ${leadLine}
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin:0 0 20px;">
      <p style="color:#374151;font-size:13px;margin:0;line-height:1.7;">
        <strong>Date</strong> : ${dateStr}<br/>
        <strong>Mentor</strong> : ${booking.mentorName}
      </p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      ${button(booking.kind === "H-15m" ? "Rejoindre maintenant" : "Voir ma séance", meetingUrl)}
    </div>
    <p style="color:#9ca3af;font-size:11px;text-align:center;">
      Besoin de reporter ? Contactez directement votre mentor depuis votre espace.
    </p>
  `);

  return sendEmail({
    to: booking.studentEmail,
    subject: booking.kind === "H-15m"
      ? `⏰ Votre séance commence dans 15 min — ${booking.mentorName}`
      : `📅 Rappel : séance demain avec ${booking.mentorName}`,
    html,
  });
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in15mLo = new Date(now.getTime() + 14 * 60_000);
  const in15mHi = new Date(now.getTime() + 16 * 60_000);
  const in24hLo = new Date(now.getTime() + 23 * 60 * 60_000);
  const in24hHi = new Date(now.getTime() + (24 * 60 + 10) * 60_000);

  const results = { sent24h: 0, sent15m: 0, errors: 0 };

  async function processBatch(kind: "H-24" | "H-15m", lo: Date, hi: Date) {
    const bookings = await prisma.mentorBooking.findMany({
      where: {
        status: "CONFIRMED",
        scheduledAt: { gte: lo, lte: hi },
        reminders: { none: { kind } },
      },
      select: {
        id: true,
        scheduledAt: true,
        meetingLink: true,
        meetingRoomId: true,
        student: { select: { email: true, name: true } },
        mentor: { select: { user: { select: { name: true } } } },
      },
      take: 100,
    });

    for (const b of bookings) {
      const email = b.student?.email;
      if (!email) continue;
      try {
        await sendReminderEmail({
          id: b.id,
          studentEmail: email,
          studentName: b.student?.name ?? "",
          mentorName: b.mentor?.user?.name ?? "votre mentor",
          scheduledAt: b.scheduledAt,
          meetingLink: b.meetingLink,
          meetingRoomId: b.meetingRoomId,
          kind,
        });
        await prisma.mentorBookingReminder.create({
          data: { bookingId: b.id, kind },
        });
        if (kind === "H-24") results.sent24h++;
        else results.sent15m++;
      } catch (err) {
        console.error(`[mentor-reminders] ${kind} failed for ${b.id}:`, err);
        results.errors++;
      }
    }
  }

  await processBatch("H-24", in24hLo, in24hHi);
  await processBatch("H-15m", in15mLo, in15mHi);

  return NextResponse.json({ ok: true, ...results });
}
