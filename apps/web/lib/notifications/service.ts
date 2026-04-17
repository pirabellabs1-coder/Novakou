/**
 * Novakou — Notification Service
 * Point unique de creation de notifications in-app (dev store ou Prisma).
 */

import { IS_DEV } from "@/lib/env";
import type { NotificationOutput } from "@/lib/events/types";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

/**
 * Cree une notification in-app pour un utilisateur.
 * Dev mode → notificationStore JSON. Prod → Prisma.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (IS_DEV) {
    const { notificationStore } = await import("@/lib/dev/data-store");
    notificationStore.add({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type as "order" | "message" | "payment" | "system" | "service" | "boost" | "offer" | "review" | "agency" | "course" | "product",
      read: false,
      link: input.link,
    });
    return;
  }

  // Production — Prisma
  const { prisma } = await import("@/lib/prisma");
  await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: mapToNotificationType(input.type),
      link: input.link,
    },
  });
}

/**
 * Cree des notifications pour plusieurs destinataires en une fois.
 */
export async function createNotifications(inputs: CreateNotificationInput[]): Promise<void> {
  if (inputs.length === 0) return;

  if (IS_DEV) {
    const { notificationStore } = await import("@/lib/dev/data-store");
    for (const input of inputs) {
      notificationStore.add({
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type as "order" | "message" | "payment" | "system" | "service" | "boost" | "offer" | "review" | "agency" | "course" | "product",
        read: false,
        link: input.link,
      });
    }
    return;
  }

  // Production — Prisma batch
  const { prisma } = await import("@/lib/prisma");
  await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: mapToNotificationType(input.type),
      link: input.link,
    })),
  });
}

/**
 * Helper : convertit un type string vers l'enum Prisma NotificationType.
 * Les nouveaux types (offer, review, agency, etc.) sont mappes vers
 * les valeurs de l'enum Prisma apres la migration.
 */
function mapToNotificationType(type: string): NotificationType {
  const typeMap: Record<string, NotificationType> = {
    order: "ORDER",
    message: "MESSAGE",
    payment: "PAYMENT",
    system: "SYSTEM",
    kyc: "KYC",
    admin_action: "ADMIN_ACTION",
    offer: "OFFER",
    review: "REVIEW",
    agency: "AGENCY",
    course: "COURSE",
    product: "PRODUCT",
    service: "SERVICE",
    boost: "BOOST",
  };
  return typeMap[type] || "SYSTEM";
}

/**
 * Helper : convertit un NotificationOutput[] vers des CreateNotificationInput[].
 */
export function toNotificationInputs(outputs: NotificationOutput[]): CreateNotificationInput[] {
  return outputs.map((o) => ({
    userId: o.userId,
    title: o.title,
    message: o.message,
    type: o.type,
    link: o.link,
  }));
}
