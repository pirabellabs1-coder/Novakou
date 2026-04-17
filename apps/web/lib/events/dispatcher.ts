/**
 * Novakou — Event Dispatcher
 * Point d'entree unique pour emettre des evenements (notification + email).
 *
 * Usage :
 *   import { emitEvent } from "@/lib/events/dispatcher";
 *   await emitEvent("order.created", { ... });
 */

import type { EventName, EventPayloadMap, NotificationOutput } from "./types";
import { EVENT_REGISTRY } from "./registry";
import { createNotification, createNotifications, toNotificationInputs } from "@/lib/notifications/service";

/**
 * Emet un evenement et execute en parallele :
 * 1. Creation de notification(s) in-app
 * 2. Envoi d'email(s) via le template associe
 *
 * Les erreurs sont loguees mais jamais propagees — le caller n'est pas bloque.
 */
export async function emitEvent<E extends EventName>(
  event: E,
  payload: EventPayloadMap[E]
): Promise<void> {
  const entry = EVENT_REGISTRY[event];

  if (!entry) {
    console.warn(`[EventDispatcher] Event "${event}" has no registry entry — skipped`);
    return;
  }

  const tasks: Promise<void>[] = [];

  // ── Notification(s) ──
  if (entry.notification) {
    tasks.push(
      (async () => {
        try {
          const result = entry.notification!(payload);
          if (Array.isArray(result)) {
            await createNotifications(toNotificationInputs(result));
          } else if (result) {
            await createNotification({
              userId: result.userId,
              title: result.title,
              message: result.message,
              type: result.type,
              link: result.link,
            });
          }
        } catch (err) {
          console.error(`[EventDispatcher] Notification error for "${event}":`, err);
        }
      })()
    );
  }

  // ── Email ──
  if (entry.email) {
    tasks.push(
      (async () => {
        try {
          await entry.email!(payload);
        } catch (err) {
          console.error(`[EventDispatcher] Email error for "${event}":`, err);
        }
      })()
    );
  }

  // Execute en parallele — ne bloque pas le caller
  await Promise.allSettled(tasks);

  console.log(`[EventDispatcher] Event "${event}" dispatched`);
}
