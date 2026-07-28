/**
 * API de Conversion (server-side) — envoie les conversions serveur-à-serveur
 * vers Meta (Conversions API) et TikTok (Events API). Bien plus fiable que le
 * pixel navigateur (résiste aux bloqueurs de pub et aux restrictions iOS/ATT).
 *
 * Déduplication : chaque évènement porte un `eventId` PARTAGÉ avec l'évènement
 * du pixel navigateur (même `event_id`/`eventID`) → Meta/TikTok fusionnent les
 * deux et ne comptent qu'une conversion.
 *
 * Ne lève JAMAIS : toutes les erreurs sont avalées (fire-and-forget). Ne doit
 * jamais bloquer le fulfillment d'un paiement.
 */

import crypto from "crypto";

const META_API_VERSION = "v20.0";

function sha256(v: string): string {
  return crypto.createHash("sha256").update(v).digest("hex");
}
function hashEmail(email?: string | null): string | undefined {
  const e = email?.trim().toLowerCase();
  return e ? sha256(e) : undefined;
}
function hashPhone(phone?: string | null): string | undefined {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits ? sha256(digits) : undefined;
}

export type CapiPlatform = "FACEBOOK" | "TIKTOK";

export interface CapiPixel {
  type: CapiPlatform;
  pixelId: string;
  accessToken: string;
  testEventCode?: string | null;
}

export interface ServerEvent {
  /** Nomenclature Meta ; mappée vers TikTok en interne. */
  eventName: "Purchase" | "InitiateCheckout" | "Lead" | "CompleteRegistration";
  /** Identifiant partagé avec le pixel navigateur pour la déduplication. */
  eventId: string;
  eventTimeSec?: number;
  value?: number;
  currency?: string;
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  eventSourceUrl?: string | null;
  contentIds?: string[];
}

// Meta → TikTok event name mapping.
const TIKTOK_EVENT: Record<ServerEvent["eventName"], string> = {
  Purchase: "CompletePayment",
  InitiateCheckout: "InitiateCheckout",
  Lead: "SubmitForm",
  CompleteRegistration: "CompleteRegistration",
};

async function sendMeta(pixel: CapiPixel, ev: ServerEvent): Promise<void> {
  const user_data: Record<string, unknown> = {};
  const em = hashEmail(ev.email);
  const ph = hashPhone(ev.phone);
  if (em) user_data.em = [em];
  if (ph) user_data.ph = [ph];
  if (ev.clientIp) user_data.client_ip_address = ev.clientIp;
  if (ev.userAgent) user_data.client_user_agent = ev.userAgent;

  const custom_data: Record<string, unknown> = { currency: ev.currency ?? "XOF" };
  if (typeof ev.value === "number") custom_data.value = ev.value;
  if (ev.contentIds?.length) { custom_data.content_ids = ev.contentIds; custom_data.content_type = "product"; }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: ev.eventName,
        event_time: ev.eventTimeSec ?? Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: "website",
        ...(ev.eventSourceUrl ? { event_source_url: ev.eventSourceUrl } : {}),
        user_data,
        custom_data,
      },
    ],
  };
  if (pixel.testEventCode) payload.test_event_code = pixel.testEventCode;

  const url = `https://graph.facebook.com/${META_API_VERSION}/${pixel.pixelId}/events?access_token=${encodeURIComponent(pixel.accessToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[capi.meta]", pixel.pixelId, res.status, t.slice(0, 300));
  }
}

async function sendTiktok(pixel: CapiPixel, ev: ServerEvent): Promise<void> {
  const user: Record<string, unknown> = {};
  const em = hashEmail(ev.email);
  const ph = hashPhone(ev.phone);
  if (em) user.email = em;
  if (ph) user.phone = ph;
  if (ev.clientIp) user.ip = ev.clientIp;
  if (ev.userAgent) user.user_agent = ev.userAgent;

  const properties: Record<string, unknown> = { currency: ev.currency ?? "XOF" };
  if (typeof ev.value === "number") properties.value = ev.value;
  if (ev.contentIds?.length) {
    properties.contents = ev.contentIds.map((id) => ({ content_id: id, content_type: "product" }));
  }

  const payload = {
    event_source: "web",
    event_source_id: pixel.pixelId,
    data: [
      {
        event: TIKTOK_EVENT[ev.eventName],
        event_time: ev.eventTimeSec ?? Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        user,
        properties,
        ...(ev.eventSourceUrl ? { page: { url: ev.eventSourceUrl } } : {}),
      },
    ],
  };

  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Access-Token": pixel.accessToken },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[capi.tiktok]", pixel.pixelId, res.status, t.slice(0, 300));
  }
}

/** Pixels de la PLATEFORME (pubs Novakou) — configurés par variables d'env. */
export function platformCapiPixels(): CapiPixel[] {
  const out: CapiPixel[] = [];
  if (process.env.META_PIXEL_ID && process.env.META_CAPI_TOKEN) {
    out.push({
      type: "FACEBOOK",
      pixelId: process.env.META_PIXEL_ID,
      accessToken: process.env.META_CAPI_TOKEN,
      testEventCode: process.env.META_TEST_EVENT_CODE ?? null,
    });
  }
  if (process.env.TIKTOK_PIXEL_ID && process.env.TIKTOK_CAPI_TOKEN) {
    out.push({ type: "TIKTOK", pixelId: process.env.TIKTOK_PIXEL_ID, accessToken: process.env.TIKTOK_CAPI_TOKEN });
  }
  return out;
}

/**
 * Envoie un évènement serveur à tous les pixels fournis (Meta + TikTok).
 * Renvoie une promesse À ATTENDRE par l'appelant : en serverless (Vercel), un
 * fetch non attendu est tué au retour de la fonction → l'évènement se perdrait.
 * N'échoue jamais (chaque envoi avale ses erreurs).
 */
export function fireServerConversion(pixels: CapiPixel[], ev: ServerEvent): Promise<unknown> {
  const valid = pixels.filter((p) => p.pixelId && p.accessToken);
  if (valid.length === 0) return Promise.resolve();
  return Promise.allSettled(
    valid.map((p) => (p.type === "FACEBOOK" ? sendMeta(p, ev) : sendTiktok(p, ev))),
  );
}
