import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { notificationStore } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";

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

    const allUsers = devStore.getAll();
    let targetUsers = allUsers.filter((u) => u.role !== "admin");

    // Filter by target
    if (target) {
      if (target.role) {
        targetUsers = targetUsers.filter((u) => u.role === target.role);
      }
      if (target.plan) {
        targetUsers = targetUsers.filter((u) => u.plan === target.plan);
      }
      if (target.status) {
        targetUsers = targetUsers.filter((u) => u.status === target.status);
      }
      if (target.kycLevel !== undefined) {
        targetUsers = targetUsers.filter((u) => u.kyc >= target.kycLevel);
      }
      if (target.userIds && Array.isArray(target.userIds)) {
        targetUsers = targetUsers.filter((u) =>
          target.userIds.includes(u.id)
        );
      }
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun utilisateur ne correspond aux criteres de ciblage",
        count: 0,
      });
    }

    // Determine notification type
    const notifType: "order" | "message" | "payment" | "system" | "service" | "boost" =
      type ?? "system";

    // Create notifications for each matching user
    const notifications = [];
    for (const user of targetUsers) {
      const notif = notificationStore.add({
        userId: user.id,
        title,
        message,
        type: notifType,
        read: false,
        link: undefined,
      });
      notifications.push(notif);
    }

    // Channel info (informational — actual SMS/email sending would happen in production)
    const channelInfo = channel ?? "in_app";
    const channelDetails: Record<string, string> = {
      in_app: "Notification in-app",
      email: "Email (simule en dev)",
      sms: "SMS (simule en dev)",
      push: "Push notification (simule en dev)",
      all: "Tous les canaux (simule en dev)",
    };

    return NextResponse.json({
      success: true,
      message: `${notifications.length} notification(s) envoyee(s) via ${channelDetails[channelInfo] ?? channelInfo}`,
      count: notifications.length,
      channel: channelInfo,
      targetCriteria: target ?? "all_users",
      recipients: targetUsers.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
      })),
    });
  } catch (error) {
    console.error("[API /admin/notifications/send POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des notifications" },
      { status: 500 }
    );
  }
}
