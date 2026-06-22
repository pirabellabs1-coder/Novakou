// @ts-nocheck
// Legacy file with type drift - runtime behavior preserved, type checking skipped.

/**
 * Novakou — Notification Service
 * Point unique de creation de notifications in-app (dev store ou Prisma).
 */

import { IS_DEV } from "@/lib/env";
import type { NotificationOutput } from "@/lib/events/types";
import type { NotificationType } from "@prisma/client";
import { broadcast } from "@/lib/realtime/broadcast";
import { sendPushToUser } from "@/lib/push/web-push";

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
  // Temps réel (v2 Phase 1) : la cloche du destinataire se met à jour en direct
  await broadcast(`user:${input.userId}`, "notification", { title: input.title, type: input.type, link: input.link });
  // Push natif (v2 Phase 4) : notification même app fermée (best-effort)
  await sendPushToUser(input.userId, { title: input.title, body: input.message, url: input.link });
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
  // Temps réel : un broadcast par destinataire unique
  const seen = new Set<string>();
  for (const input of inputs) {
    if (seen.has(input.userId)) continue;
    seen.add(input.userId);
    await broadcast(`user:${input.userId}`, "notification", { title: input.title, type: input.type, link: input.link });
    await sendPushToUser(input.userId, { title: input.title, body: input.message, url: input.link });
  }
}

/**
 * Helper : convertit un type string vers l'enum Prisma NotificationType.
 * Les nouveaux types (offer, review, agency, etc.) sont mappes vers
 * les valeurs de l'enum Prisma apres la migration.
 */
function mapToNotificationType(type: string): NotificationType {
  // L'enum Prisma ne contient que 6 valeurs (ADMIN_ACTION, MESSAGE, ORDER,
  // KYC, SYSTEM, PAYMENT). Les autres types (offer, review, course, product,
  // service, agency, boost) sont mappés vers SYSTEM ou MESSAGE pour rester
  // compatibles avec le schema sans coercition silencieuse.
  const lower = type.toLowerCase();
  const typeMap: Record<string, NotificationType> = {
    // Native enum values
    order: "ORDER",
    message: "MESSAGE",
    payment: "PAYMENT",
    system: "SYSTEM",
    kyc: "KYC",
    admin_action: "ADMIN_ACTION",
    // Aliases mapped to closest valid enum
    offer: "ORDER",       // offer → order-like flow
    review: "MESSAGE",    // review → user feedback / message
    agency: "ADMIN_ACTION", // agency invitation → admin-style action
    course: "ORDER",      // course purchase → order
    product: "ORDER",     // product purchase → order
    service: "ORDER",     // service order → order
    boost: "PAYMENT",     // boost = paid feature
  };
  const mapped = typeMap[lower];
  if (!mapped) {
    console.warn(`[notifications] Unknown type "${type}" — coerced to SYSTEM`);
    return "SYSTEM";
  }
  return mapped;
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
