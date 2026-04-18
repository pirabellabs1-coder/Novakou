"use client";

import type { TrackingEvent, TrackingEventType } from "./types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Reads the RGPD consent from localStorage (written by <CookieBanner />).
 * Default: no consent yet → analytics stays OFF. When explicitly saved, we
 * respect the `analytics` flag.
 */
function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("nk_consent");
    if (!raw) return false;
    const c = JSON.parse(raw) as { analytics?: boolean };
    return !!c.analytics;
  } catch {
    return false;
  }
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getUtmParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
}

class Tracker {
  private sessionId: string;
  private buffer: TrackingEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private userId?: string;
  private deviceType: "mobile" | "tablet" | "desktop";
  private utmParams: ReturnType<typeof getUtmParams>;
  private started = false;

  // Duration tracking
  private pageEnterTime: number = 0; // performance.now() when page entered
  private currentPath: string = "";

  // Entity dedup: track which entities have been viewed this session
  private viewedEntities = new Set<string>();

  constructor() {
    this.deviceType = "desktop";
    this.utmParams = {};
    this.sessionId = "";
  }

  start() {
    if (this.started || typeof window === "undefined") return;
    // RGPD : no activity unless the user has consented to analytics.
    if (!hasAnalyticsConsent()) {
      // Re-arm automatically if they later accept.
      window.addEventListener("nk:consent-change", () => this.start(), { once: true });
      return;
    }
    this.started = true;

    // Session ID persisted in sessionStorage
    const existing = sessionStorage.getItem("fh_session_id");
    if (existing) {
      this.sessionId = existing;
    } else {
      this.sessionId = generateId();
      sessionStorage.setItem("fh_session_id", this.sessionId);
    }

    this.deviceType = getDeviceType();
    this.utmParams = getUtmParams();
    this.pageEnterTime = performance.now();
    this.currentPath = window.location.pathname;

    // Start session on server
    this.sendSession("start");

    // Flush buffer every 5 seconds
    this.flushInterval = setInterval(() => this.flush(), 5000);

    // Heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => this.sendSession("heartbeat"), 30000);

    // Flush on visibility change / unload
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("beforeunload", this.handleUnload);
  }

  stop() {
    if (!this.started) return;
    // Send duration for current page before stopping
    this.sendCurrentPageDuration();
    this.flush();
    this.sendSession("end");
    if (this.flushInterval) clearInterval(this.flushInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("beforeunload", this.handleUnload);
    this.started = false;
  }

  setUserId(userId: string | undefined) {
    this.userId = userId;
  }

  track(
    type: TrackingEventType,
    extra?: { entityType?: TrackingEvent["entityType"]; entityId?: string; metadata?: Record<string, string | number> }
  ) {
    if (typeof window === "undefined") return;
    if (!hasAnalyticsConsent()) return;

    const event: TrackingEvent = {
      id: generateId(),
      type,
      userId: this.userId,
      sessionId: this.sessionId,
      path: window.location.pathname,
      deviceType: this.deviceType,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...this.utmParams,
      ...extra,
    };

    this.buffer.push(event);

    // Auto-flush if buffer is large
    if (this.buffer.length >= 20) this.flush();
  }

  trackPageView() {
    // Capture previous page context BEFORE any state changes
    const previousPath = this.currentPath;
    const previousEnterTime = this.pageEnterTime;

    // Reset page enter time for the new page FIRST
    this.pageEnterTime = performance.now();
    this.currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    // Send duration for the PREVIOUS page (using captured values)
    if (previousEnterTime > 0 && previousPath) {
      const durationMs = performance.now() - previousEnterTime;
      const durationSec = Math.round(durationMs / 1000);
      if (durationSec > 0 && durationSec < 1800) {
        this.track("page_view", {
          metadata: {
            duration: durationSec,
            _isDurationEvent: 1,
          },
        });
      }
    }

    // Track the new page view
    this.track("page_view");
  }

  /**
   * Track entity view (service, formation, profile) — deduped per session
   */
  trackEntityView(
    entityType: "service" | "profile" | "formation" | "project" | "blog",
    entityId: string
  ) {
    const key = `${entityType}:${entityId}`;
    if (this.viewedEntities.has(key)) return; // Already viewed this session
    this.viewedEntities.add(key);

    const typeMap: Record<string, TrackingEventType> = {
      service: "service_viewed",
      profile: "profile_viewed",
      formation: "formation_viewed",
      project: "page_view",
      blog: "page_view",
    };

    this.track(typeMap[entityType] || "page_view", { entityType, entityId });
  }

  private sendCurrentPageDuration() {
    if (this.pageEnterTime > 0 && this.currentPath) {
      const durationMs = performance.now() - this.pageEnterTime;
      const durationSec = Math.round(durationMs / 1000);

      // Only send meaningful durations (> 0s and < 30min)
      if (durationSec > 0 && durationSec < 1800) {
        this.track("page_view", {
          metadata: {
            duration: durationSec,
            _isDurationEvent: 1, // Marker to distinguish from regular page_view
          },
        });
      }
    }
  }

  private flush() {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/tracking/event",
        new Blob([JSON.stringify({ events })], { type: "application/json" })
      );
    } else {
      fetch("/api/tracking/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
        keepalive: true,
      }).catch(() => {});
    }
  }

  private sendSession(action: "start" | "heartbeat" | "end") {
    const payload = {
      action,
      sessionId: this.sessionId,
      userId: this.userId,
      deviceType: this.deviceType,
      path: typeof window !== "undefined" ? window.location.pathname : "/",
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      ...this.utmParams,
    };

    if (navigator.sendBeacon && action === "end") {
      navigator.sendBeacon(
        "/api/tracking/sessions",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
    } else {
      fetch("/api/tracking/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      this.flush();
    }
  };

  private handleUnload = () => {
    this.sendCurrentPageDuration();
    this.flush();
    this.sendSession("end");
  };
}

// Singleton
export const tracker = new Tracker();
