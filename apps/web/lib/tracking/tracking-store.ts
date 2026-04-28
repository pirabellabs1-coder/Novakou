/**
 * Tracking store — DB-backed analytics, replacing the previous in-memory stub.
 *
 * Toutes les méthodes utilisées à travers le codebase sont préservées :
 *   - track(event) → insère un TrackingEventLog
 *   - getEvents(opts) → liste les events (pour les stats vendeur/admin)
 *   - getSessions() → liste les sessions
 *   - getActiveSessions() → sessions actives dans les 15 dernières minutes
 *   - getStats({ period }) → agrégats (page views, uniques, top pages, etc.)
 *   - getAll(), getByService(id), getByUser(id), getSummary() → compat legacy
 *
 * L'API du store reste synchrone d'apparence côté lecture (Promise<T>) car
 * les anciens callsites attendaient des arrays. Toutes les méthodes async ;
 * les anciens callers qui faisaient `.length` sur le retour ont été migrés.
 */

import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────
export type DeviceType = "mobile" | "tablet" | "desktop";

export interface TrackEventInput {
  /** UUID client-généré pour la déduplication (idempotence) */
  eventId?: string;
  type: string;
  userId?: string | null;
  sessionId: string;
  path: string;
  entityType?: string | null;
  entityId?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  deviceType?: DeviceType;
  country?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  isBot?: boolean;
}

export interface TrackSessionInput {
  sessionId: string;
  userId?: string | null;
  entryPath: string;
  deviceType?: DeviceType;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  country?: string | null;
  userAgent?: string | null;
  isBot?: boolean;
}

export interface GetEventsOpts {
  startDate?: string | Date;
  endDate?: string | Date;
  types?: string[];
  entityIds?: string[];
  entityType?: string;
  userId?: string;
  limit?: number;
}

export interface PeriodStats {
  totalPageViews: number;
  uniqueVisitors: number;
  topPages: { path: string; views: number }[];
  avgSessionDuration: number; // minutes
  byDevice: Record<DeviceType, number>;
  byCountry: { country: string; count: number }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────
function periodToCutoff(period: "1h" | "1d" | "7d" | "30d" | "90d" | "all"): Date | null {
  const now = Date.now();
  switch (period) {
    case "1h":  return new Date(now - 60 * 60 * 1000);
    case "1d":  return new Date(now - 24 * 60 * 60 * 1000);
    case "7d":  return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "90d": return new Date(now - 90 * 24 * 60 * 60 * 1000);
    default:    return null;
  }
}

// ── Store ────────────────────────────────────────────────────────────────
export const trackingStore = {
  /**
   * Insère un event. Idempotent grâce à eventId UNIQUE.
   * Crée la session si elle n'existe pas, sinon met à jour lastActiveAt.
   */
  async track(event: TrackEventInput): Promise<void> {
    const eventId = event.eventId ?? `${event.sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await prisma.trackingEventLog.create({
        data: {
          eventId,
          type: event.type,
          userId: event.userId ?? null,
          sessionId: event.sessionId,
          path: event.path,
          entityType: event.entityType ?? null,
          entityId: event.entityId ?? null,
          referrer: event.referrer ?? null,
          utmSource: event.utmSource ?? null,
          utmMedium: event.utmMedium ?? null,
          utmCampaign: event.utmCampaign ?? null,
          deviceType: event.deviceType ?? "desktop",
          country: event.country ?? null,
          userAgent: event.userAgent ?? null,
          metadata: (event.metadata as object | undefined) ?? undefined,
          isBot: event.isBot ?? false,
        },
      });

      // Bump session
      try {
        await prisma.trackingSessionLog.update({
          where: { id: event.sessionId },
          data: {
            lastActiveAt: new Date(),
            ...(event.type === "page_view" ? { pageViews: { increment: 1 } } : {}),
            exitPath: event.path,
            ...(event.userId ? { userId: event.userId } : {}),
          },
        });
      } catch {
        // Session not yet created → caller will start it via startSession()
      }
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code;
      if (code === "P2002") return; // duplicate eventId → already tracked
      console.error("[tracking.track]", err);
    }
  },

  /**
   * Démarre (ou réactive) une session. Idempotent — si une session avec
   * ce sessionId existe déjà, met à jour lastActiveAt.
   */
  async startSession(input: TrackSessionInput): Promise<void> {
    try {
      await prisma.trackingSessionLog.upsert({
        where: { id: input.sessionId },
        update: { lastActiveAt: new Date() },
        create: {
          id: input.sessionId,
          userId: input.userId ?? null,
          entryPath: input.entryPath,
          exitPath: input.entryPath,
          deviceType: input.deviceType ?? "desktop",
          referrer: input.referrer ?? null,
          utmSource: input.utmSource ?? null,
          utmMedium: input.utmMedium ?? null,
          utmCampaign: input.utmCampaign ?? null,
          country: input.country ?? null,
          userAgent: input.userAgent ?? null,
          isBot: input.isBot ?? false,
        },
      });
    } catch (err) {
      console.error("[tracking.startSession]", err);
    }
  },

  /** Liste les events selon filtres. */
  async getEvents(opts: GetEventsOpts = {}): Promise<Array<{
    id: string; eventId: string; type: string; userId: string | null;
    sessionId: string; path: string; entityType: string | null;
    entityId: string | null; referrer: string | null;
    utmSource: string | null; utmMedium: string | null; utmCampaign: string | null;
    deviceType: string; country: string | null; userAgent: string | null;
    metadata: unknown; isBot: boolean; createdAt: Date;
  }>> {
    const where: Record<string, unknown> = { isBot: false };
    if (opts.startDate || opts.endDate) {
      const range: { gte?: Date; lte?: Date } = {};
      if (opts.startDate) range.gte = new Date(opts.startDate);
      if (opts.endDate) range.lte = new Date(opts.endDate);
      where.createdAt = range;
    }
    if (opts.types && opts.types.length > 0) where.type = { in: opts.types };
    if (opts.entityIds && opts.entityIds.length > 0) where.entityId = { in: opts.entityIds };
    if (opts.entityType) where.entityType = opts.entityType;
    if (opts.userId) where.userId = opts.userId;
    return prisma.trackingEventLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: opts.limit ?? 5000,
    });
  },

  /** Liste les sessions. */
  async getSessions(): Promise<Array<{
    id: string; userId: string | null; startedAt: Date;
    lastActiveAt: Date; endedAt: Date | null; pageViews: number;
    entryPath: string; exitPath: string | null; deviceType: string;
    referrer: string | null; country: string | null;
  }>> {
    return prisma.trackingSessionLog.findMany({
      where: { isBot: false },
      orderBy: { lastActiveAt: "desc" },
      take: 2000,
      select: {
        id: true, userId: true, startedAt: true, lastActiveAt: true,
        endedAt: true, pageViews: true, entryPath: true, exitPath: true,
        deviceType: true, referrer: true, country: true,
      },
    });
  },

  /** Sessions actives = lastActiveAt dans les 15 dernières minutes. */
  async getActiveSessions(): Promise<number> {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    return prisma.trackingSessionLog.count({
      where: { lastActiveAt: { gte: cutoff }, isBot: false },
    });
  },

  /**
   * Agrégats sur une période. Utilisé par /api/admin/dashboard.
   */
  async getStats(opts: { period: "1h" | "1d" | "7d" | "30d" | "90d" | "all" }): Promise<PeriodStats> {
    const cutoff = periodToCutoff(opts.period);
    const where = {
      isBot: false,
      ...(cutoff ? { createdAt: { gte: cutoff } } : {}),
    };

    const [pageViews, allEvents, sessions] = await Promise.all([
      prisma.trackingEventLog.count({ where: { ...where, type: "page_view" } }),
      prisma.trackingEventLog.findMany({
        where: { ...where, type: "page_view" },
        select: { path: true, deviceType: true, country: true, sessionId: true },
        take: 10000,
      }),
      prisma.trackingSessionLog.findMany({
        where: cutoff
          ? { startedAt: { gte: cutoff }, isBot: false }
          : { isBot: false },
        select: { id: true, startedAt: true, lastActiveAt: true },
        take: 5000,
      }),
    ]);

    const uniqueVisitors = new Set(allEvents.map((e) => e.sessionId)).size;

    const pathMap = new Map<string, number>();
    const deviceMap: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
    const countryMap = new Map<string, number>();
    for (const e of allEvents) {
      pathMap.set(e.path, (pathMap.get(e.path) ?? 0) + 1);
      deviceMap[e.deviceType] = (deviceMap[e.deviceType] ?? 0) + 1;
      const c = e.country ?? "??";
      countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
    }

    const topPages = [...pathMap.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const byCountry = [...countryMap.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Avg session duration in minutes
    const durations = sessions.map(
      (s) => (s.lastActiveAt.getTime() - s.startedAt.getTime()) / 60000,
    );
    const avgSessionDuration = durations.length === 0
      ? 0
      : Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10;

    return {
      totalPageViews: pageViews,
      uniqueVisitors,
      topPages,
      avgSessionDuration,
      byDevice: {
        mobile: deviceMap.mobile ?? 0,
        tablet: deviceMap.tablet ?? 0,
        desktop: deviceMap.desktop ?? 0,
      },
      byCountry,
    };
  },

  // ── Legacy compat (kept so older imports don't blow up) ─────────────
  async getAll() {
    return this.getEvents({ limit: 1000 });
  },
  async getByService(id: string) {
    return this.getEvents({ entityIds: [id] });
  },
  async getByUser(id: string) {
    return this.getEvents({ userId: id });
  },
  async getSummary() {
    const [totalViews, totalClicks, totalConversions] = await Promise.all([
      prisma.trackingEventLog.count({ where: { type: "page_view", isBot: false } }),
      prisma.trackingEventLog.count({ where: { type: { in: ["click", "cta_click"] }, isBot: false } }),
      prisma.trackingEventLog.count({ where: { type: "purchase", isBot: false } }),
    ]);
    return { totalViews, totalClicks, totalConversions };
  },
};
