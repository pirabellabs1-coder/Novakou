/**
 * Tracker client — déclencheur léger qui POST sur /api/track.
 *
 * Côté serveur (RSC, route handler) : utilise plutôt `trackingStore.track()`
 * directement (db-backed, pas de round-trip réseau).
 *
 * Côté client : import { tracker } from "@/lib/tracking/tracker"
 *               tracker.track("formation_view", { entityId: "..." });
 */

import type { TrackingEventType, TrackerOpts } from "./types";

const SESSION_KEY = "nk_session_id";

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = genId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return genId();
  }
}

export const tracker = {
  /**
   * Fire un event tracking. No-op côté serveur, fire côté client.
   * Idempotent / non-bloquant : aucun await, aucune exception.
   */
  track(type: TrackingEventType | string, opts: TrackerOpts = {}): void {
    if (typeof window === "undefined") return;
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    const payload = {
      eventId: genId(),
      type,
      path: window.location.pathname,
      sessionId,
      entityType: opts.entityType,
      entityId: opts.entityId,
      referrer: document.referrer || undefined,
      metadata: opts.metadata,
    };
    const body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        const ok = navigator.sendBeacon(
          "/api/track",
          new Blob([body], { type: "application/json" }),
        );
        if (ok) return;
      }
    } catch {
      /* fallthrough */
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => null);
  },
};
