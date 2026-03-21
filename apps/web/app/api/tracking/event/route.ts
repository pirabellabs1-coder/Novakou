import { NextRequest, NextResponse } from "next/server";
import { trackingStore } from "@/lib/tracking/tracking-store";
import type { TrackingEvent } from "@/lib/tracking/types";

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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();
    const events: TrackingEvent[] = body.events;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 });
    }

    // Prune expired dedup entries (older than 1 hour)
    const now = Date.now();
    for (const [id, ts] of recentEventIds) {
      if (now - ts > DEDUP_TTL) recentEventIds.delete(id);
    }

    // Validate, deduplicate, and limit batch
    const batch: TrackingEvent[] = [];
    for (const event of events.slice(0, 50)) {
      if (!isValidEvent(event)) continue;
      if (recentEventIds.has(event.id)) continue; // Skip duplicate

      recentEventIds.set(event.id, now);
      batch.push(event);
    }

    if (batch.length > 0) {
      trackingStore.recordEvents(batch);

      // Increment pageViews in session for ACTUAL page_view events only (not duration markers)
      const sessionPageViews = new Map<string, number>();
      for (const ev of batch) {
        if (ev.type === "page_view" && !ev.metadata?._isDurationEvent) {
          sessionPageViews.set(ev.sessionId, (sessionPageViews.get(ev.sessionId) ?? 0) + 1);
        }
      }
      // Update session pageViews based on actual page_view events
      for (const [sessionId, count] of sessionPageViews) {
        const sessions = trackingStore.getSessions();
        const existing = sessions.find((s) => s.id === sessionId);
        if (existing) {
          trackingStore.upsertSession({
            ...existing,
            pageViews: existing.pageViews + count,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, recorded: batch.length });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
