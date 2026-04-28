/**
 * POST /api/track
 *
 * Public endpoint that the client-side tracker hits to record page views,
 * product views, formation views, mentor profile views, etc. Idempotent
 * via eventId; bot-filtered; geo-enriched from Vercel headers.
 *
 * Body: {
 *   eventId?: string,   // for dedup
 *   type: string,       // "page_view" | "product_view" | "formation_view" | "shop_view" | "mentor_view" | "cta_click" | "add_to_cart" | "checkout_started" | "purchase"
 *   path: string,
 *   sessionId: string,
 *   entityType?: string,
 *   entityId?: string,
 *   referrer?: string,
 *   utmSource?: string, utmMedium?: string, utmCampaign?: string,
 *   metadata?: Record<string, unknown>,
 * }
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { trackingStore, type DeviceType } from "@/lib/tracking/tracking-store";

export const runtime = "nodejs";
// Avoid Vercel caching this endpoint.
export const dynamic = "force-dynamic";

// ── Bot detection (basic) ─────────────────────────────────────────────
const BOT_RE = /bot|crawl|spider|slurp|baiduspider|bingbot|googlebot|yandex|duckduckbot|facebookexternalhit|whatsapp|twitterbot|linkedinbot|preview|fetch|monitor|prerender|headless|lighthouse|pingdom/i;
function isBot(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return BOT_RE.test(ua);
}

// ── Device detection (basic UA regex) ────────────────────────────────
function detectDevice(ua: string | null | undefined): DeviceType {
  if (!ua) return "desktop";
  if (/iPad|Tablet|PlayBook/i.test(ua)) return "tablet";
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

// ── Country (Vercel sets x-vercel-ip-country, CF sets cf-ipcountry) ─
function detectCountry(req: NextRequest): string | null {
  const v = req.headers.get("x-vercel-ip-country");
  if (v && v.length === 2) return v.toUpperCase();
  const c = req.headers.get("cf-ipcountry");
  if (c && c.length === 2) return c.toUpperCase();
  return null;
}

interface TrackBody {
  eventId?: string;
  type?: string;
  path?: string;
  sessionId?: string;
  entityType?: string;
  entityId?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  let body: TrackBody = {};
  try {
    body = (await req.json()) as TrackBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  if (!body.type || !body.sessionId || !body.path) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const ua = req.headers.get("user-agent");
  if (isBot(ua)) {
    // Silently accept and drop — return 204 to avoid wasted retries
    return new NextResponse(null, { status: 204 });
  }

  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id ?? null;

  const country = detectCountry(req);
  const deviceType = detectDevice(ua);

  // Start (or upsert) the session — idempotent
  await trackingStore.startSession({
    sessionId: body.sessionId,
    userId,
    entryPath: body.path,
    deviceType,
    referrer: body.referrer ?? null,
    utmSource: body.utmSource ?? null,
    utmMedium: body.utmMedium ?? null,
    utmCampaign: body.utmCampaign ?? null,
    country,
    userAgent: ua ?? null,
    isBot: false,
  });

  await trackingStore.track({
    eventId: body.eventId,
    type: body.type,
    userId,
    sessionId: body.sessionId,
    path: body.path,
    entityType: body.entityType ?? null,
    entityId: body.entityId ?? null,
    referrer: body.referrer ?? null,
    utmSource: body.utmSource ?? null,
    utmMedium: body.utmMedium ?? null,
    utmCampaign: body.utmCampaign ?? null,
    deviceType,
    country,
    userAgent: ua ?? null,
    metadata: body.metadata ?? null,
  });

  return NextResponse.json({ ok: true });
}
