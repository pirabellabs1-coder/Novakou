// FreelanceHigh — Analytics event tracking (internal tracker + GA fallback)

import { tracker } from "./tracking/tracker";
import type { TrackingEventType } from "./tracking/types";

type GAEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

export function trackEvent({ action, category, label, value }: GAEvent) {
  if (typeof window === "undefined") return;

  // Internal tracker
  tracker.track(action as TrackingEventType, {
    metadata: {
      category,
      ...(label ? { label } : {}),
      ...(value !== undefined ? { value } : {}),
    },
  });

  // GA fallback
  if (window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

// Pre-defined events
export const analytics = {
  // Auth
  signUp: (method: string) => trackEvent({ action: "sign_up", category: "auth", label: method }),
  signIn: (method: string) => trackEvent({ action: "sign_in", category: "auth", label: method }),

  // Services
  serviceCreated: (category: string) => trackEvent({ action: "service_created", category: "services", label: category }),
  serviceViewed: (serviceId: string) => {
    tracker.track("service_viewed", { entityType: "service", entityId: serviceId });
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "service_viewed", { event_category: "services", event_label: serviceId });
    }
  },

  // Profiles
  profileViewed: (userId: string) => {
    tracker.track("profile_viewed", { entityType: "profile", entityId: userId });
  },

  // Formations
  formationViewed: (formationId: string) => {
    tracker.track("formation_viewed", { entityType: "formation", entityId: formationId });
  },

  // Orders
  orderPlaced: (amount: number) => trackEvent({ action: "order_placed", category: "orders", value: amount }),
  orderCompleted: (amount: number) => trackEvent({ action: "order_completed", category: "orders", value: amount }),

  // Messaging
  messageSent: () => trackEvent({ action: "message_sent", category: "messaging" }),

  // Search
  searchPerformed: (query: string) => trackEvent({ action: "search", category: "search", label: query }),
};

// Extend window type for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
