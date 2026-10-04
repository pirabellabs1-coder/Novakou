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
import { prisma } from "@/lib/prisma";

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

/**
 * Compteur de vues d'une fiche (produit / formation) — déplacé ici depuis les
 * API publiques de fiche, désormais mises en cache CDN (elles ne s'exécutent
 * plus à chaque visite). `updateMany` + statut ACTIF : une fiche non publiée
 * (aperçu admin) ou un id inconnu n'incrémente rien.
 */
function compterVue(evt: TrackBody) {
  if (!evt.entityId) return;
  if (evt.type === "product_view" && evt.entityType === "product") {
    prisma.digitalProduct
      .updateMany({ where: { id: evt.entityId, status: "ACTIF" }, data: { viewsCount: { increment: 1 } } })
      .catch(() => null);
  } else if (evt.type === "formation_view" && evt.entityType === "formation") {
    prisma.formation
      .updateMany({ where: { id: evt.entityId, status: "ACTIF" }, data: { viewsCount: { increment: 1 } } })
      .catch(() => null);
  }
}

export async function POST(req: NextRequest) {
  let brut: unknown;
  try {
    brut = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  // Accepte un événement seul OU un lot `{ events: [...] }` : une fiche émet
  // « vue de page » + « vue produit » au même instant, envoyées en UNE requête
  // (chaque requête est une exécution de fonction facturée).
  const lot = (brut as { events?: unknown })?.events;
  const evenements = (Array.isArray(lot) ? lot.slice(0, 10) : [brut]) as TrackBody[];
  const valides = evenements.filter((e) => e && e.type && e.sessionId && e.path);
  if (valides.length === 0) {
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
  const premier = valides[0];

  // Start (or upsert) the session — idempotent
  await trackingStore.startSession({
    sessionId: premier.sessionId!,
    userId,
    entryPath: premier.path!,
    deviceType,
    referrer: premier.referrer ?? null,
    utmSource: premier.utmSource ?? null,
    utmMedium: premier.utmMedium ?? null,
    utmCampaign: premier.utmCampaign ?? null,
    country,
    userAgent: ua ?? null,
    isBot: false,
  });

  for (const body of valides) {
    await trackingStore.track({
      eventId: body.eventId,
      type: body.type!,
      userId,
      sessionId: body.sessionId!,
      path: body.path!,
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
    compterVue(body);
  }

  return NextResponse.json({ ok: true });
}
