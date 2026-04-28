/**
 * Types partagés pour le tracking client/server.
 */

export type TrackingEventType =
  // Page-level
  | "page_view"
  // Domain-specific views
  | "product_view"
  | "formation_view"
  | "shop_view"
  | "mentor_view"
  | "affiliate_landing_view"
  | "service_viewed"      // legacy
  | "formation_viewed"    // legacy
  | "profile_viewed"
  // Conversion funnel
  | "cta_click"
  | "click"
  | "add_to_cart"
  | "checkout_started"
  | "purchase"
  | "order_placed"
  | "order_completed"
  // Auth
  | "sign_up"
  | "sign_in"
  // Engagement
  | "search"
  | "message_sent"
  | "service_created";

export interface TrackerOpts {
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
