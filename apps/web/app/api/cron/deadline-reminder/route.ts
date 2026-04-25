import { NextRequest, NextResponse } from "next/server";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { emitEvent } from "@/lib/events/dispatcher";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel cron or manual trigger)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // --- DEV mode: use in-memory store ---
  if (IS_DEV && !USE_PRISMA_FOR_DATA) {
    try {
      const { orderStore } = await import("@/lib/dev/data-store");

      const now = Date.now();
      const TWO_HOURS = 2 * 60 * 60 * 1000;
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      const orders = orderStore.getAll();
      const activeOrders = orders.filter((o) => o.status === "en_cours");

      let reminders24h = 0;
      let remindersOverdue = 0;

      for (const order of activeOrders) {
        const deadlineTime = new Date(order.deadline).getTime();
        const timeLeft = deadlineTime - now;

        // Deadline in less than 24h (but not overdue) — within 2h detection window
        if (timeLeft > 0 && timeLeft <= TWENTY_FOUR_HOURS && timeLeft > TWENTY_FOUR_HOURS - TWO_HOURS) {
          emitEvent("order.deadline_24h", {
            orderId: order.id,
            serviceTitle: order.serviceTitle,
            amount: order.amount,
            freelanceId: order.freelanceId,
            freelanceName: "",
            freelanceEmail: "",
            clientId: order.clientId,
            clientName: order.clientName,
            clientEmail: "",
            deadline: order.deadline,
          }).catch((err) => console.error("[CRON] deadline_24h emitEvent error:", err));
          reminders24h++;
        }

        // Deadline overdue — within 2h detection window
        if (timeLeft <= 0 && timeLeft > -TWO_HOURS) {
          emitEvent("order.deadline_overdue", {
            orderId: order.id,
            serviceTitle: order.serviceTitle,
            amount: order.amount,
            freelanceId: order.freelanceId,
            freelanceName: "",
            freelanceEmail: "",
            clientId: order.clientId,
            clientName: order.clientName,
            clientEmail: "",
            deadline: order.deadline,
          }).catch((err) => console.error("[CRON] deadline_overdue emitEvent error:", err));
          remindersOverdue++;
        }
      }

      return NextResponse.json({
        success: true,
        checked: activeOrders.length,
        reminders24h,
        remindersOverdue,
      });
    } catch (error) {
      console.error("[CRON deadline-reminder] dev store error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la verification des deadlines" },
        { status: 500 }
      );
    }
  }

  // --- Production: use Prisma ---
  try {
    const { prisma } = await import("@/lib/prisma");

    const now = new Date();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    const twoHoursFromNow = new Date(now.getTime() + TWO_HOURS_MS);
    const twentyFourHoursFromNow = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);
    const twoHoursAgo = new Date(now.getTime() - TWO_HOURS_MS);
    // Window for 24h reminder: deadline is between (24h - 2h) and 24h from now
    const twentyTwoHoursFromNow = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS - TWO_HOURS_MS);

    // Find orders with deadlines approaching within 24h (not yet overdue)
    const orders24h = await prisma.order.findMany({
      where: {
        status: "EN_COURS",
        deadline: {
          gt: twentyTwoHoursFromNow,
          lte: twentyFourHoursFromNow,
        },
      },
      select: {
        id: true,
        title: true,
        amount: true,
        freelanceId: true,
        clientId: true,
        deadline: true,
        freelance: { select: { name: true, email: true } },
        client: { select: { name: true, email: true } },
      },
    });

    // Find orders that just became overdue (deadline passed within last 2h)
    const ordersOverdue = await prisma.order.findMany({
      where: {
        status: "EN_COURS",
        deadline: {
          gt: twoHoursAgo,
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        amount: true,
        freelanceId: true,
        clientId: true,
        deadline: true,
        freelance: { select: { name: true, email: true } },
        client: { select: { name: true, email: true } },
      },
    });

    let reminders24h = 0;
    let remindersOverdue = 0;

    for (const order of orders24h) {
      emitEvent("order.deadline_24h", {
        orderId: order.id,
        serviceTitle: order.title ?? "",
        amount: order.amount,
        freelanceId: order.freelanceId,
        freelanceName: order.freelance?.name ?? "",
        freelanceEmail: order.freelance?.email ?? "",
        clientId: order.clientId,
        clientName: order.client?.name ?? "",
        clientEmail: order.client?.email ?? "",
        deadline: order.deadline.toISOString(),
      }).catch((err) => console.error("[CRON] deadline_24h emitEvent error:", err));
      reminders24h++;
    }

    for (const order of ordersOverdue) {
      emitEvent("order.deadline_overdue", {
        orderId: order.id,
        serviceTitle: order.title ?? "",
        amount: order.amount,
        freelanceId: order.freelanceId,
        freelanceName: order.freelance?.name ?? "",
        freelanceEmail: order.freelance?.email ?? "",
        clientId: order.clientId,
        clientName: order.client?.name ?? "",
        clientEmail: order.client?.email ?? "",
        deadline: order.deadline.toISOString(),
      }).catch((err) => console.error("[CRON] deadline_overdue emitEvent error:", err));
      remindersOverdue++;
    }

    // ─── Mentor bookings — J-1 reminder (24h before session) ────────────────
    // Runs daily at midnight; wide window (23h–25h before now) captures all sessions within next day.
    // Protected against duplicate send by the `reminder24hSentAt` DB flag.
    let mentorReminder24h = 0;
    let mentorReminder1h = 0;
    let mentorReviewRequests = 0;
    try {
      const { sendMentorReminder24hEmail, sendMentorReminder1hEmail, sendMentorReviewRequestEmail } =
        await import("@/lib/email/mentor");
      const { meetingUrlFrom } = await import("@/lib/mentor/jitsi");

      // J-1 window: sessions scheduled between now+23h and now+25h
      const win24Start = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const win24End = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      const bookings24h = await prisma.mentorBooking.findMany({
        where: {
          status: "CONFIRMED",
          scheduledAt: { gte: win24Start, lte: win24End },
          reminder24hSentAt: null,
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });

      for (const b of bookings24h) {
        const meetingUrl = meetingUrlFrom(b.meetingRoomId, b.id);
        const mentorName = b.mentor.user.name ?? "Votre mentor";
        const studentName = b.student.name ?? "L'apprenant";

        // Send to both parties in parallel
        const promises: Promise<unknown>[] = [];
        if (b.student.email) {
          promises.push(
            sendMentorReminder24hEmail({
              recipientEmail: b.student.email,
              recipientName: b.student.name ?? "Apprenant",
              otherPartyName: mentorName,
              scheduledAt: b.scheduledAt,
              durationMinutes: b.durationMinutes,
              meetingUrl,
              isMentor: false,
              bookingId: b.id,
            }).catch((err) => console.error("[CRON mentor 24h student]", err)),
          );
        }
        if (b.mentor.user.email) {
          promises.push(
            sendMentorReminder24hEmail({
              recipientEmail: b.mentor.user.email,
              recipientName: mentorName,
              otherPartyName: studentName,
              scheduledAt: b.scheduledAt,
              durationMinutes: b.durationMinutes,
              meetingUrl,
              isMentor: true,
              bookingId: b.id,
            }).catch((err) => console.error("[CRON mentor 24h mentor]", err)),
          );
        }
        await Promise.allSettled(promises);

        await prisma.mentorBooking.update({
          where: { id: b.id },
          data: { reminder24hSentAt: new Date() },
        }).catch((err) => console.error("[CRON mentor 24h update]", err));

        mentorReminder24h++;
      }

      // H-1 window: sessions scheduled between now+45 min and now+75 min
      // (only caught if cron runs ~hourly; our deadline-reminder runs once/day at midnight — so
      //  in practice this catches midnight-±15min sessions only. Still useful as a safety net.)
      const win1Start = new Date(now.getTime() + 45 * 60 * 1000);
      const win1End = new Date(now.getTime() + 75 * 60 * 1000);

      const bookings1h = await prisma.mentorBooking.findMany({
        where: {
          status: "CONFIRMED",
          scheduledAt: { gte: win1Start, lte: win1End },
          reminder1hSentAt: null,
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          mentor: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });

      for (const b of bookings1h) {
        const meetingUrl = meetingUrlFrom(b.meetingRoomId, b.id);
        const mentorName = b.mentor.user.name ?? "Votre mentor";
        const studentName = b.student.name ?? "L'apprenant";

        const promises: Promise<unknown>[] = [];
        if (b.student.email) {
          promises.push(
            sendMentorReminder1hEmail({
              recipientEmail: b.student.email,
              recipientName: b.student.name ?? "Apprenant",
              otherPartyName: mentorName,
              scheduledAt: b.scheduledAt,
              meetingUrl,
              isMentor: false,
            }).catch((err) => console.error("[CRON mentor 1h student]", err)),
          );
        }
        if (b.mentor.user.email) {
          promises.push(
            sendMentorReminder1hEmail({
              recipientEmail: b.mentor.user.email,
              recipientName: mentorName,
              otherPartyName: studentName,
              scheduledAt: b.scheduledAt,
              meetingUrl,
              isMentor: true,
            }).catch((err) => console.error("[CRON mentor 1h mentor]", err)),
          );
        }
        await Promise.allSettled(promises);

        await prisma.mentorBooking.update({
          where: { id: b.id },
          data: { reminder1hSentAt: new Date() },
        }).catch((err) => console.error("[CRON mentor 1h update]", err));

        mentorReminder1h++;
      }

      // Review request: sessions completed in last 7 days without review, no request sent yet
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const completedWithoutReview = await prisma.mentorBooking.findMany({
        where: {
          status: "COMPLETED",
          studentRating: null,
          reviewRequestSentAt: null,
          updatedAt: { gte: sevenDaysAgo, lte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          mentor: { include: { user: { select: { name: true } } } },
        },
        take: 50,
      });

      for (const b of completedWithoutReview) {
        if (b.student.email) {
          await sendMentorReviewRequestEmail({
            studentEmail: b.student.email,
            studentName: b.student.name ?? "Apprenant",
            mentorName: b.mentor.user.name ?? "Votre mentor",
            bookingId: b.id,
          }).catch((err) => console.error("[CRON mentor review]", err));
        }
        await prisma.mentorBooking.update({
          where: { id: b.id },
          data: { reviewRequestSentAt: new Date() },
        }).catch((err) => console.error("[CRON mentor review update]", err));
        mentorReviewRequests++;
      }
    } catch (err) {
      console.error("[CRON mentor-reminder block]", err);
    }

    return NextResponse.json({
      success: true,
      checked: orders24h.length + ordersOverdue.length,
      reminders24h,
      remindersOverdue,
      mentorReminder24h,
      mentorReminder1h,
      mentorReviewRequests,
    });
  } catch (error) {
    console.error("[CRON deadline-reminder]", error);
    return NextResponse.json(
      { error: "Erreur lors de la verification des deadlines" },
      { status: 500 }
    );
  }
}
