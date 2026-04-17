import fs from "fs";
import path from "path";
import type {
  TrackingEvent,
  TrackingSession,
  TrackingStats,
  TrackingEventFilter,
  TrackingStatsQuery,
} from "./types";

const DEV_DIR = path.join(process.cwd(), "lib", "dev");
const EVENTS_FILE = path.join(DEV_DIR, "tracking-events.json");
const SESSIONS_FILE = path.join(DEV_DIR, "tracking-sessions.json");
const MAX_AGE_DAYS = 90;

// LRU cache simple (TTL 60s)
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000;

function cached<T>(key: string, fn: () => T): T {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  const data = fn();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

function invalidateCache() {
  cache.clear();
}

function ensureDir() {
  if (!fs.existsSync(DEV_DIR)) fs.mkdirSync(DEV_DIR, { recursive: true });
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Auto-nettoyage des événements > 90 jours
function cleanOldEvents(events: TrackingEvent[]): TrackingEvent[] {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return events.filter((e) => new Date(e.timestamp).getTime() > cutoff);
}

function cleanOldSessions(sessions: TrackingSession[]): TrackingSession[] {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => new Date(s.startedAt).getTime() > cutoff);
}

export const trackingStore = {
  // ── Events ──
  getEvents(filter?: TrackingEventFilter): TrackingEvent[] {
    let events = readJson<TrackingEvent[]>(EVENTS_FILE, []);
    if (filter) {
      if (filter.type) events = events.filter((e) => e.type === filter.type);
      if (filter.userId) events = events.filter((e) => e.userId === filter.userId);
      if (filter.entityType) events = events.filter((e) => e.entityType === filter.entityType);
      if (filter.entityId) events = events.filter((e) => e.entityId === filter.entityId);
      if (filter.path) events = events.filter((e) => e.path === filter.path);
      if (filter.startDate) {
        const start = new Date(filter.startDate).getTime();
        events = events.filter((e) => new Date(e.timestamp).getTime() >= start);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate).getTime();
        events = events.filter((e) => new Date(e.timestamp).getTime() <= end);
      }
    }
    return events;
  },

  recordEvents(newEvents: TrackingEvent[]) {
    const events = readJson<TrackingEvent[]>(EVENTS_FILE, []);
    const cleaned = cleanOldEvents([...events, ...newEvents]);
    writeJson(EVENTS_FILE, cleaned);
    invalidateCache();
  },

  // ── Sessions ──
  getSessions(): TrackingSession[] {
    return readJson<TrackingSession[]>(SESSIONS_FILE, []);
  },

  upsertSession(session: TrackingSession) {
    const sessions = readJson<TrackingSession[]>(SESSIONS_FILE, []);
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = { ...sessions[idx], ...session };
    } else {
      sessions.push(session);
    }
    const cleaned = cleanOldSessions(sessions);
    writeJson(SESSIONS_FILE, cleaned);
    invalidateCache();
  },

  endSession(sessionId: string) {
    const sessions = readJson<TrackingSession[]>(SESSIONS_FILE, []);
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx >= 0) {
      sessions[idx].endedAt = new Date().toISOString();
      writeJson(SESSIONS_FILE, sessions);
      invalidateCache();
    }
  },

  // ── Vues par entité ──
  getServiceViews(serviceId: string): number {
    return cached(`sv:${serviceId}`, () =>
      this.getEvents({ type: "service_viewed", entityId: serviceId }).length
    );
  },

  getProfileViews(userId: string): number {
    return cached(`pv:${userId}`, () =>
      this.getEvents({ type: "profile_viewed", entityId: userId }).length
    );
  },

  getFormationViews(formationId: string): number {
    return cached(`fv:${formationId}`, () =>
      this.getEvents({ type: "formation_viewed", entityId: formationId }).length
    );
  },

  // ── Temps moyen par page ──
  getAvgTimeOnPage(pagePath: string): number {
    return cached(`atp:${pagePath}`, () => {
      const events = this.getEvents({ type: "page_view", path: pagePath });
      const durations = events
        .filter((e) => e.metadata && typeof e.metadata.duration === "number" && e.metadata.duration > 0)
        .map((e) => e.metadata!.duration as number);
      if (durations.length === 0) return 0;
      return Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
    });
  },

  // ── Conversion rate par service ──
  getConversionRate(serviceId: string): { views: number; orders: number; rate: number } {
    return cached(`cr:${serviceId}`, () => {
      const views = this.getEvents({ type: "service_viewed", entityId: serviceId }).length;
      const orders = this.getEvents({ type: "order_placed", entityId: serviceId }).length;
      const rate = views > 0 ? Math.round((orders / views) * 10000) / 100 : 0;
      return { views, orders, rate };
    });
  },

  // ── Créer un événement conversion server-side ──
  trackConversion(
    type: "order_placed" | "order_completed" | "sign_up",
    entityId: string,
    metadata: Record<string, string | number>
  ) {
    const event: TrackingEvent = {
      id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      sessionId: "server",
      path: "",
      entityType: type === "order_placed" || type === "order_completed" ? "service" : undefined,
      entityId,
      deviceType: "desktop",
      timestamp: new Date().toISOString(),
      metadata,
    };
    this.recordEvents([event]);
  },

  // ── Stats agrégées ──
  getStats(query: TrackingStatsQuery): TrackingStats {
    const cacheKey = `stats:${JSON.stringify(query)}`;
    return cached(cacheKey, () => this._computeStats(query));
  },

  _computeStats(query: TrackingStatsQuery): TrackingStats {
    const periodDays = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 }[query.period] || 30;
    const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

    const filter: TrackingEventFilter = { startDate: cutoff };
    if (query.userId) filter.userId = query.userId;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;

    // Filter by space (path prefix)
    const spacePrefix: Record<string, string> = {
      admin: "/admin",
      freelance: "/dashboard",
      client: "/client",
      formations: "/",
      public: "/",
    };

    let events = this.getEvents(filter);
    if (query.space && query.space !== "public") {
      const prefix = spacePrefix[query.space];
      events = events.filter((e) => e.path.startsWith(prefix));
    }

    const pageViews = events.filter((e) => e.type === "page_view");
    const uniqueSessionIds = new Set(events.map((e) => e.sessionId));
    const uniqueUserIds = new Set(events.filter((e) => e.userId).map((e) => e.userId));

    // Sessions dans la période
    const sessions = this.getSessions().filter(
      (s) => new Date(s.startedAt).toISOString() >= cutoff
    );

    // Durée moyenne des sessions
    const completedSessions = sessions.filter((s) => s.endedAt);
    const avgDuration =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (sum, s) => sum + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()),
            0
          ) / completedSessions.length / 1000
        : 0;

    // Bounce rate (sessions avec 1 seule page vue)
    const singlePageSessions = sessions.filter((s) => s.pageViews <= 1).length;
    const bounceRate = sessions.length > 0 ? (singlePageSessions / sessions.length) * 100 : 0;

    // Top pages
    const pageCounts = new Map<string, number>();
    pageViews.forEach((e) => pageCounts.set(e.path, (pageCounts.get(e.path) || 0) + 1));
    const topPages = [...pageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([p, v]) => ({ path: p, views: v }));

    // Top referrers
    const refCounts = new Map<string, number>();
    events
      .filter((e) => e.referrer)
      .forEach((e) => refCounts.set(e.referrer!, (refCounts.get(e.referrer!) || 0) + 1));
    const topReferrers = [...refCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([r, c]) => ({ referrer: r, count: c }));

    // Device breakdown
    const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0 };
    sessions.forEach((s) => deviceBreakdown[s.deviceType]++);

    // UTM breakdown
    const utmCounts = new Map<string, number>();
    events
      .filter((e) => e.utmSource)
      .forEach((e) => {
        const key = `${e.utmSource}|${e.utmMedium || "direct"}`;
        utmCounts.set(key, (utmCounts.get(key) || 0) + 1);
      });
    const utmBreakdown = [...utmCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, c]) => {
        const [source, medium] = k.split("|");
        return { source, medium, count: c };
      });

    // Trends
    const dayMs = 24 * 60 * 60 * 1000;
    const pageViewsTrend: Array<{ date: string; views: number }> = [];
    const sessionsTrend: Array<{ date: string; sessions: number }> = [];

    for (let i = periodDays - 1; i >= 0; i--) {
      const dayStart = new Date(Date.now() - i * dayMs);
      const dateStr = dayStart.toISOString().split("T")[0];
      const dayViews = pageViews.filter((e) => e.timestamp.startsWith(dateStr)).length;
      const daySessions = sessions.filter((s) => s.startedAt.startsWith(dateStr)).length;
      pageViewsTrend.push({ date: dateStr, views: dayViews });
      sessionsTrend.push({ date: dateStr, sessions: daySessions });
    }

    return {
      totalPageViews: pageViews.length,
      uniqueVisitors: Math.max(uniqueUserIds.size, uniqueSessionIds.size),
      totalSessions: sessions.length,
      avgSessionDuration: Math.round(avgDuration),
      bounceRate: Math.round(bounceRate * 10) / 10,
      topPages,
      topReferrers,
      deviceBreakdown,
      utmBreakdown,
      pageViewsTrend,
      sessionsTrend,
    };
  },

  // ── Active sessions (dernière activité < 5 min) ──
  getActiveSessions(): number {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const sessions = this.getSessions();
    return sessions.filter((s) => !s.endedAt && s.lastActiveAt >= fiveMinAgo).length;
  },
};
