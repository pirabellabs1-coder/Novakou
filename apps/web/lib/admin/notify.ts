/**
 * Admin notification helper
 * Broadcasts notifications to all admin users
 */

import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { devStore } from "@/lib/dev/dev-store";
import { notificationStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";

interface AdminNotification {
  title: string;
  message: string;
  type?: string;
  link?: string;
}

/**
 * Send a notification to all admin users.
 * Non-blocking — errors are logged but never propagated.
 */
export async function notifyAdmins(notification: AdminNotification): Promise<void> {
  try {
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // devStore est structuré par entité : `devStore.users.getAll()`.
      // notificationStore est créé via createStore<any>() → expose `create`,
      // pas `add` (legacy nom). On utilise `create` partout.
      const admins = devStore.users
        .getAll()
        .filter((u: { role?: string }) => u.role === "admin");
      for (const admin of admins) {
        notificationStore.create({
          userId: admin.id,
          title: notification.title,
          message: notification.message,
          type: notification.type || "system",
          read: false,
          link: notification.link,
        });
      }
      return;
    }

    // Production: Prisma
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: notification.title,
          message: notification.message,
          type: "SYSTEM" as const,
          link: notification.link,
        })),
      });
    }
  } catch (err) {
    console.error("[notifyAdmins]", err);
  }
}
