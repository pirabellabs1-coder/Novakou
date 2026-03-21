import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { notificationStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV) {
      const notifications = notificationStore.getByUser(session.user.id);
      const unreadCount = notificationStore.getUnreadCount(session.user.id);

      return NextResponse.json({ notifications, unreadCount });
    } else {
      const dbNotifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const notifications = dbNotifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        link: n.link || undefined,
        createdAt: n.createdAt.toISOString(),
      }));

      const unreadCount = notifications.filter((n) => !n.read).length;

      return NextResponse.json({ notifications, unreadCount });
    }
  } catch (error) {
    console.error("[API /notifications GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { id, all, create, title, message, type, link } = body;

    // Create a new notification
    if (create && title && message) {
      if (IS_DEV) {
        notificationStore.add({
          userId: session.user.id,
          title,
          message,
          type: type || "system",
          read: false,
          link,
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title,
            message,
            type: type?.toUpperCase() || "SYSTEM",
            link,
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    if (IS_DEV) {
      if (all) {
        notificationStore.markAllRead(session.user.id);
      } else if (id) {
        notificationStore.markRead(id);
      } else {
        return NextResponse.json(
          { error: "Parametres invalides : fournir 'id' ou 'all: true'" },
          { status: 400 }
        );
      }

      const notifications = notificationStore.getByUser(session.user.id);
      const unreadCount = notificationStore.getUnreadCount(session.user.id);

      return NextResponse.json({ notifications, unreadCount });
    } else {
      if (all) {
        await prisma.notification.updateMany({
          where: { userId: session.user.id, read: false },
          data: { read: true },
        });
      } else if (id) {
        await prisma.notification.update({
          where: { id },
          data: { read: true },
        });
      } else {
        return NextResponse.json(
          { error: "Parametres invalides : fournir 'id' ou 'all: true'" },
          { status: 400 }
        );
      }

      const dbNotifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const notifications = dbNotifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        link: n.link || undefined,
        createdAt: n.createdAt.toISOString(),
      }));

      const unreadCount = notifications.filter((n) => !n.read).length;

      return NextResponse.json({ notifications, unreadCount });
    }
  } catch (error) {
    console.error("[API /notifications POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour des notifications" },
      { status: 500 }
    );
  }
}
