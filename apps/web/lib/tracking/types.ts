// Types pour le système de tracking interne Novakou

export type TrackingEventType =
  | "page_view"
  | "session_start"
  | "session_end"
  | "service_viewed"
  | "profile_viewed"
  | "formation_viewed"
  | "search"
  | "sign_up"
  | "sign_in"
  | "order_placed"
  | "order_completed"
  | "message_sent"
  | "service_created"
  | "candidature_sent"
  | "project_created"
  | "button_click";

export interface TrackingEvent {
  id: string;
  type: TrackingEventType;
  userId?: string;
  sessionId: string;
  path: string;
  entityType?: "service" | "profile" | "formation" | "project" | "blog";
  entityId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  deviceType: "mobile" | "tablet" | "desktop";
  userAgent?: string;
  timestamp: string;
  country?: string; // ISO-3166-1 alpha-2 (SN, CI, FR, ...)
  metadata?: Record<string, string | number>;
}

export interface TrackingSession {
  id: string;
  userId?: string;
  startedAt: string;
  lastActiveAt: string;
  endedAt?: string;
  pageViews: number;
  entryPath: string;
  exitPath?: string;
  deviceType: "mobile" | "tablet" | "desktop";
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  country?: string; // ISO-3166-1 alpha-2 — derived from Vercel/Cloudflare geo headers
}

export interface TrackingStats {
  totalPageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  deviceBreakdown: { mobile: number; tablet: number; desktop: number };
  utmBreakdown: Array<{ source: string; medium: string; count: number }>;
  pageViewsTrend: Array<{ date: string; views: number }>;
  sessionsTrend: Array<{ date: string; sessions: number }>;
}

export interface TrackingEventFilter {
  type?: TrackingEventType;
  userId?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  path?: string;
}

export interface TrackingStatsQuery {
  period: "1d" | "7d" | "30d" | "90d";
  space?: "admin" | "freelance" | "client" | "formations" | "public";
  userId?: string;
  entityType?: string;
  entityId?: string;
}
