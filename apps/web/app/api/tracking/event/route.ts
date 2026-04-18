import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackingStore } from "@/lib/tracking/tracking-store";
import type { TrackingEvent } from "@/lib/tracking/types";
import { getCountryFromRequest } from "@/lib/tracking/geo";

// Rate limiting simple en memoire
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_MIN = 100;

// Deduplication: Map of recent event IDs with timestamp (TTL-based, 1 hour window)
const recentEventIds = new Map<string, number>();
const DEDUP_TTL = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= MAX_PER_MIN) return false;
  entry.count++;
  return true;
}

function isValidEvent(e: unknown): e is TrackingEvent {
  if (!e || typeof e !== "object") return false;
  const ev = e as Record<string, unknown>;
  return !!(ev.id && ev.type && ev.sessionId && ev.path && ev.timestamp);
}

// Very cheap bot heuristic — good enough to keep counters honest.
const BOT_UA_RE = /bot|crawl|spider|headless|facebookexternalhit|whatsapp|telegram|slack|linkedinbot|preview/i;
function looksLikeBot(ua: string | undefined): boolean {
  if (!ua) return true; // no UA at all → probably a script
  return BOT_UA_RE.test(ua);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();
    const events: TrackingEvent[] = body?.events;

    if (!Array.isArray(events) || events.length === 0) {
      // Return 200 with 0 recorded instead of 400 to avoid noisy client errors
      return NextResponse.json({ ok: true, recorded: 0 });
    }

    // Prune expired dedup entries (older than 1 hour)
    const now = Date.now();
    for (const [id, ts] of recentEventIds) {
      if (now - ts > DEDUP_TTL) recentEventIds.delete(id);
    }

    // Validate, deduplicate, stamp geoloc, and limit batch
    const country = getCountryFromRequest(req);
    const reqUA = req.headers.get("user-agent") ?? undefined;
    const batch: TrackingEvent[] = [];
    for (const event of events.slice(0, 50)) {
      if (!isValidEvent(event)) continue;
      if (recentEventIds.has(event.id)) continue; // Skip duplicate

      recentEventIds.set(event.id, now);
      batch.push(country ? { ...event, country: event.country || country } : event);
    }

    if (batch.length === 0) {
      return NextResponse.json({ ok: true, recorded: 0 });
    }

    // ── Dev in-memory store (backwards compat for /admin analytics) ───────────
    trackingStore.recordEvents(batch);

    // ── Persist to DB (best-effort; failures are logged but don't 500) ───────
    try {
      await prisma.trackingEventLog.createMany({
        skipDuplicates: true,
        data: batch.map((e) => {
          const ua = e.userAgent ?? reqUA ?? undefined;
          return {
            eventId: e.id,
            type: e.type,
            userId: e.userId ?? null,
            sessionId: e.sessionId,
            path: e.path,
            entityType: e.entityType ?? null,
            entityId: e.entityId ?? null,
            referrer: e.referrer ?? null,
            utmSource: e.utmSource ?? null,
            utmMedium: e.utmMedium ?? null,
            utmCampaign: e.utmCampaign ?? null,
            deviceType: e.deviceType,
            country: e.country ?? null,
            userAgent: ua ?? null,
            metadata: e.metadata ? (e.metadata as object) : undefined,
            isBot: looksLikeBot(ua),
            createdAt: new Date(e.timestamp),
          };
        }),
      });
    } catch (err) {
      console.error("[tracking/event] DB persist failed:", err);
    }

    // ── Increment denormalized viewsCount on entities (non-bot only) ─────────
    // One-pass grouping to minimize DB writes.
    const incs: {
      formations: Record<string, number>;
      products: Record<string, number>;
      mentors: Record<string, number>;
    } = { formations: {}, products: {}, mentors: {} };

    for (const e of batch) {
      if (looksLikeBot(e.userAgent ?? reqUA ?? undefined)) continue;
      if (!e.entityId) continue;
      if (e.type === "formation_viewed" || (e.entityType === "formation" && e.type === "page_view")) {
        incs.formations[e.entityId] = (incs.formations[e.entityId] ?? 0) + 1;
      } else if (e.type === "service_viewed" && e.entityType === "service") {
        // "service" catches DigitalProduct pages in current taxonomy
        incs.products[e.entityId] = (incs.products[e.entityId] ?? 0) + 1;
      } else if (e.type === "profile_viewed" && e.entityType === "profile") {
        incs.mentors[e.entityId] = (incs.mentors[e.entityId] ?? 0) + 1;
      }
    }

    const tasks: Promise<unknown>[] = [];
    for (const [id, n] of Object.entries(incs.formations)) {
      tasks.push(
        prisma.formation
          .update({ where: { id }, data: { viewsCount: { increment: n } } })
          .catch(() => null),
      );
    }
    for (const [id, n] of Object.entries(incs.products)) {
      tasks.push(
        prisma.digitalProduct
          .update({ where: { id }, data: { viewsCount: { increment: n } } })
          .catch(() => null),
      );
    }
    // MentorProfile has no viewsCount field — skip (keep the data in TrackingEventLog)
    if (tasks.length > 0) await Promise.all(tasks);

    // Increment pageViews in session for ACTUAL page_view events only
    const sessionPageViews = new Map<string, number>();
    for (const ev of batch) {
      if (ev.type === "page_view" && !ev.metadata?._isDurationEvent) {
        sessionPageViews.set(ev.sessionId, (sessionPageViews.get(ev.sessionId) ?? 0) + 1);
      }
    }
    for (const [sessionId, count] of sessionPageViews) {
      const sessions = trackingStore.getSessions();
      const existing = sessions.find((s) => s.id === sessionId);
      if (existing) {
        trackingStore.upsertSession({
          ...existing,
          pageViews: existing.pageViews + count,
        });
      }
      // Keep DB session in sync too
      prisma.trackingSessionLog
        .update({
          where: { id: sessionId },
          data: { pageViews: { increment: count }, lastActiveAt: new Date() },
        })
        .catch(() => null);
    }

    return NextResponse.json({ ok: true, recorded: batch.length });
  } catch (err) {
    console.error("[tracking/event] unexpected:", err);
    return NextResponse.json({ ok: false, recorded: 0 });
  }
}
