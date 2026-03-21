import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma as _prisma, IS_DEV } from "@/lib/prisma";
import { notificationStore } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";
import { sendAdminBroadcastEmail } from "@/lib/admin/admin-emails";
import { createAuditLog } from "@/lib/admin/audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

// POST /api/admin/notifications/send — Send notifications to users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, type, target, channel } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "title et message sont requis" },
        { status: 400 }
      );
    }

    const channelInfo = channel ?? "in_app";

    if (IS_DEV) {
      const allUsers = devStore.getAll();
      let targetUsers = allUsers.filter((u) => u.role !== "admin");

      if (target) {
        if (target.role) targetUsers = targetUsers.filter((u) => u.role === target.role);
        if (target.plan) targetUsers = targetUsers.filter((u) => u.plan === target.plan);
        if (target.status) targetUsers = targetUsers.filter((u) => u.status === target.status);
        if (target.kycLevel !== undefined) targetUsers = targetUsers.filter((u) => u.kyc === target.kycLevel);
        if (target.userIds && Array.isArray(target.userIds)) targetUsers = targetUsers.filter((u) => target.userIds.includes(u.id));
      }

      if (targetUsers.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Aucun utilisateur ne correspond aux criteres de ciblage",
          count: 0,
        });
      }

      const notifType = type ?? "system";
      for (const user of targetUsers) {
        notificationStore.add({
          userId: user.id,
          title,
          message,
          type: notifType,
          read: false,
          link: undefined,
        });
      }

      return NextResponse.json({
        success: true,
        message: `${targetUsers.length} notification(s) envoyee(s)`,
        count: targetUsers.length,
        channel: channelInfo,
        targetCriteria: target ?? "all_users",
      });
    }

    // ── Production: Prisma ──

    // Build where clause for target users
    const where: Record<string, unknown> = { role: { not: "ADMIN" } };
    if (target) {
      if (target.role) where.role = target.role.toUpperCase();
      if (target.plan) where.plan = target.plan.toUpperCase();
      if (target.status) where.status = target.status.toUpperCase();
      if (target.kycLevel !== undefined) where.kyc = target.kycLevel;
      if (target.userIds && Array.isArray(target.userIds)) where.id = { in: target.userIds };
    }

    const targetUsers = await prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, role: true },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun utilisateur ne correspond aux criteres de ciblage",
        count: 0,
      });
    }

    // Create in-app notifications for all targets
    await prisma.notification.createMany({
      data: targetUsers.map((u: { id: string; email: string; name: string }) => ({
        userId: u.id,
        title,
        message,
        type: "ADMIN_ACTION" as const,
        read: false,
      })),
    });

    // Send emails if channel includes email
    let failedEmails = 0;
    if (channelInfo === "email" || channelInfo === "all") {
      for (const user of targetUsers) {
        try {
          await sendAdminBroadcastEmail(user.email, user.name, title, message);
        } catch (emailErr) {
          failedEmails++;
          console.error(`[Notification] Email failed for ${user.email}:`, emailErr);
        }
      }
    }

    // Log the notification in AdminNotificationLog (non-blocking — table might not be migrated yet)
    try {
      await prisma.adminNotificationLog.create({
        data: {
          adminId: session.user.id,
          title,
          message,
          targetCriteria: target ?? { scope: "all_users" },
          recipientCount: targetUsers.length,
          failedCount: failedEmails,
          channels: [channelInfo],
        },
      });
    } catch (logErr) {
      console.error("[Notification] AdminNotificationLog error (table may not be migrated):", logErr);
    }

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: "notification.sent",
      details: {
        title,
        recipientCount: targetUsers.length,
        failedEmails,
        channel: channelInfo,
        targetCriteria: target,
      },
    }).catch((err) => console.error("[Notification] Audit log error:", err));

    const statusMessage = failedEmails > 0
      ? `${targetUsers.length} notification(s) envoyee(s) — ${failedEmails} email(s) echoue(s)`
      : `${targetUsers.length} notification(s) envoyee(s)`;

    return NextResponse.json({
      success: true,
      message: statusMessage,
      count: targetUsers.length,
      failedEmails,
      channel: channelInfo,
      targetCriteria: target ?? "all_users",
    });
  } catch (error) {
    console.error("[API /admin/notifications/send POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des notifications" },
      { status: 500 }
    );
  }
}
