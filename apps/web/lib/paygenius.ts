// PayGenius (GeniusPay) payment integration — https://pay.genius.ci/docs/api
//
// Architecture parallèle à lib/moneroo.ts :
//   - initPayment / retrievePayment : checkout client
//   - initPayout / retrievePayout   : retrait vendeur (cashout)
//   - verifyPayGeniusSignature      : HMAC-SHA256 utilisé par le webhook
//
// Différences vs Moneroo :
//   1. Auth = headers X-API-Key + X-API-Secret (PAS Bearer)
//   2. Devise par défaut = XOF (PayGenius est XOF-natif)
//   3. Téléphone bénéficiaire = format E.164 AVEC le `+` en tête
//   4. Statuts API = "completed/failed/cancelled" (on normalise en "success/..."
//      pour rester compatible avec le pipeline webhook existant)
//   5. Payouts = nécessite un `wallet_id` PayGenius pré-financé (env var)

import crypto from "crypto";

const PAYGENIUS_API_BASE =
  process.env.PAYGENIUS_BASE_URL?.replace(/\/+$/, "") ||
  "https://pay.genius.ci/api/v1/merchant";

const PAYGENIUS_REPLAY_WINDOW_SECONDS = 300; // 5 min — recommandé par la doc

function getCredentials(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.PAYGENIUS_API_KEY;
  const apiSecret = process.env.PAYGENIUS_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("PAYGENIUS_API_KEY / PAYGENIUS_API_SECRET non configurés");
  }
  return { apiKey, apiSecret };
}

function authHeaders(): HeadersInit {
  const { apiKey, apiSecret } = getCredentials();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-API-Key": apiKey,
    "X-API-Secret": apiSecret,
  };
}

/** Helper pour savoir si PayGenius est configuré (clés présentes). */
export function isPayGeniusConfigured(): boolean {
  return Boolean(process.env.PAYGENIUS_API_KEY && process.env.PAYGENIUS_API_SECRET);
}

// ─── METADATA SANITIZE ───────────────────────────────────────────────────────
// PayGenius accepte un objet metadata libre, mais on garde la même politique
// que Moneroo (string/number/boolean uniquement) pour rester portable.
function sanitizeMetadata(meta?: Record<string, unknown>): Record<string, string | number | boolean> | undefined {
  if (!meta) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === null || v === undefined) continue;
    let coerced: string | number | boolean | undefined;
    if (typeof v === "boolean") coerced = v;
    else if (typeof v === "number") coerced = Number.isFinite(v) ? v : String(v);
    else if (typeof v === "string") coerced = v;
    else if (Array.isArray(v)) coerced = v.filter((x) => x !== null && x !== undefined).map((x) => String(x)).join(",");
    else if (typeof v === "object") {
      try { coerced = JSON.stringify(v); } catch { coerced = String(v); }
    } else coerced = String(v);
    if (typeof coerced === "string" && coerced.length === 0) continue;
    if (coerced === undefined) continue;
    out[k] = coerced;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

// ─── PAYMENTS (entrants : client paie) ───────────────────────────────────────

export type PayGeniusInitParams = {
  amount: number;
  currency?: string; // défaut XOF
  description: string;
  customer: {
    email: string;
    name: string;
    phone?: string; // format international recommandé (+221...)
    country?: string; // ISO2
  };
  return_url: string;
  error_url?: string;
  metadata?: Record<string, unknown>;
  /** Restreindre à une méthode précise (sinon page de checkout multi-méthodes). */
  payment_method?: "wave" | "pawapay" | "paystack" | "orange_money" | "mtn_money" | "card" | string;
};

/** Statut tel que renvoyé par l'API PayGenius. */
export type PayGeniusRawStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

/**
 * Statut normalisé pour rester compatible avec le pipeline webhook hérité de
 * Moneroo. On mappe `completed` → `success`, le reste passe tel quel.
 */
export type PayGeniusStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

export function normalizePaymentStatus(s?: string | null): PayGeniusStatus {
  const v = (s ?? "").toLowerCase();
  if (v === "completed" || v === "succeeded" || v === "success") return "success";
  if (v === "failed" || v === "error") return "failed";
  if (v === "cancelled" || v === "canceled") return "cancelled";
  if (v === "refunded") return "refunded";
  if (v === "expired") return "expired";
  if (v === "processing") return "processing";
  return "pending";
}

export type PayGeniusInitResponse = {
  success: boolean;
  data: {
    id: number | string;
    reference: string;        // ex: "MTX-A1B2C3D4E5"
    amount: number;
    currency: string;
    fees?: number;
    net_amount?: number;
    status: PayGeniusRawStatus;
    checkout_url?: string;    // si payment_method non précisé
    payment_url?: string;     // si payment_method précisé
    gateway?: string;
    environment?: "sandbox" | "live";
    metadata?: Record<string, unknown>;
    expires_at?: string;
  };
};

/** Initialise un paiement PayGenius. Retourne l'URL de checkout à rediriger. */
export async function initPayment(params: PayGeniusInitParams): Promise<{
  reference: string;
  id: string;
  checkout_url: string;
  raw: PayGeniusInitResponse["data"];
}> {
  const payload: Record<string, unknown> = {
    amount: Math.round(params.amount),
    currency: params.currency || "XOF",
    description: params.description,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      phone: params.customer.phone,
      country: params.customer.country,
    },
    success_url: params.return_url,
    error_url: params.error_url || params.return_url,
    metadata: sanitizeMetadata(params.metadata),
  };
  if (params.payment_method) payload.payment_method = params.payment_method;

  const res = await fetch(`${PAYGENIUS_API_BASE}/payments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  // Lecture safe : la réponse peut ne pas être du JSON (5xx HTML, body vide).
  const rawBody = await res.text();
  let json: PayGeniusInitResponse | { success: false; error?: { code: string; message: string }; message?: string } | null = null;
  try {
    json = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    json = null;
  }

  if (!res.ok || !json || !("data" in json) || !json.data) {
    // Log complet côté serveur pour permettre à l'admin de diagnostiquer
    // une 5xx provider — visible uniquement dans les logs Vercel/Sentry,
    // jamais renvoyé au client (pas de fuite d'info technique).
    console.error("[paygenius.initPayment] failed", {
      status: res.status,
      statusText: res.statusText,
      bodyPreview: rawBody.slice(0, 500),
      amountSent: payload.amount,
      currencySent: payload.currency,
    });

    // Message court et actionnable côté utilisateur.
    const providerMsg =
      (json && "error" in json && (json as { error?: { message?: string } }).error?.message) ||
      (json && "message" in json && (json as { message?: string }).message) ||
      null;

    // 5xx → message générique "indisponible" car probablement transient.
    // 4xx avec message → on remonte le message provider (validation, etc.).
    if (res.status >= 500) {
      throw new Error(
        providerMsg
          ? `Provider temporairement indisponible (${providerMsg}). Essayez Moneroo ou réessayez dans 1 minute.`
          : `Provider temporairement indisponible (HTTP ${res.status}). Essayez Moneroo ou réessayez dans 1 minute.`,
      );
    }
    throw new Error(providerMsg || `PayGenius init failed (HTTP ${res.status})`);
  }

  const url = json.data.checkout_url || json.data.payment_url;
  if (!url) {
    throw new Error("PayGenius n'a pas renvoyé de checkout_url ni de payment_url");
  }

  return {
    reference: json.data.reference,
    id: String(json.data.id),
    checkout_url: url,
    raw: json.data,
  };
}

export type PayGeniusRetrieveResponse = {
  success: boolean;
  data: {
    id: number | string;
    reference: string;
    amount: number;
    currency: string;
    fees?: number;
    net_amount?: number;
    status: PayGeniusRawStatus;
    payment_method?: string;
    payment_provider?: string;
    environment?: "sandbox" | "live";
    customer?: { name?: string; email?: string; phone?: string };
    metadata?: Record<string, unknown>;
    created_at?: string;
    completed_at?: string;
  };
};

/** Récupère un paiement par sa référence (format MTX-XXXXXXXXXX). */
export async function retrievePayment(reference: string): Promise<{
  reference: string;
  id: string;
  status: PayGeniusStatus;
  amount: number;
  currency: string;
  customer: { email: string };
  metadata: Record<string, unknown>;
  raw: PayGeniusRetrieveResponse["data"];
}> {
  const res = await fetch(`${PAYGENIUS_API_BASE}/payments/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = (await res.json()) as PayGeniusRetrieveResponse | { success: false; error?: { message: string }; message?: string };
  if (!res.ok || !("data" in json) || !json.data) {
    const errObj = (json as { error?: { message?: string } }).error;
    const msgField = (json as { message?: string }).message;
    const msg =
      ("error" in json && errObj?.message) ||
      ("message" in json && msgField) ||
      `PayGenius retrieve failed (HTTP ${res.status})`;
    throw new Error(String(msg));
  }
  return {
    reference: json.data.reference,
    id: String(json.data.id),
    status: normalizePaymentStatus(json.data.status),
    amount: json.data.amount,
    currency: json.data.currency,
    customer: { email: json.data.customer?.email || "" },
    metadata: (json.data.metadata ?? {}) as Record<string, unknown>,
    raw: json.data,
  };
}

// ─── PAYOUTS (sortants : vendeur reçoit son argent) ──────────────────────────
// Endpoint : POST /api/v1/merchant/payouts
// Le wallet_id débité est lu dans PAYGENIUS_PAYOUT_WALLET_ID (env serveur).

export type PayGeniusPayoutDestinationType = "mobile_money" | "bank_transfer";
export type PayGeniusPayoutProvider = "wave" | "orange_money" | "mtn" | "moov" | string;

export type PayGeniusPayoutInitParams = {
  amount: number;
  currency?: string; // défaut XOF
  description?: string;
  recipient: {
    name: string;
    phone: string; // E.164 avec "+" (ex: "+2250709876543")
    email?: string;
  };
  destination: {
    type: PayGeniusPayoutDestinationType;
    provider: PayGeniusPayoutProvider;
    /** Pour mobile_money : numéro MM ; pour bank_transfer : IBAN/RIB. */
    account: string;
  };
  metadata?: Record<string, unknown>;
  /** Idempotence : passer le même key pour éviter un double payout. */
  idempotency_key?: string;
};

export type PayGeniusPayoutRawStatus = "pending" | "processing" | "completed" | "failed";
export type PayGeniusPayoutStatus = "pending" | "processing" | "success" | "failed" | "cancelled";

export function normalizePayoutStatus(s?: string | null): PayGeniusPayoutStatus {
  const v = (s ?? "").toLowerCase();
  if (v === "completed" || v === "succeeded" || v === "success") return "success";
  if (v === "failed" || v === "error") return "failed";
  if (v === "cancelled" || v === "canceled") return "cancelled";
  if (v === "processing") return "processing";
  return "pending";
}

export type PayGeniusPayoutResponse = {
  success: boolean;
  data: {
    payout: {
      id: string;
      reference: string; // ex: "PYT-260209-XYZ789"
      status: PayGeniusPayoutRawStatus;
      amount: number;
      fees?: number;
      net_amount?: number;
      created_at?: string;
    };
  };
};

/** Initialise un payout (retrait) via PayGenius. */
export async function initPayout(params: PayGeniusPayoutInitParams): Promise<{
  id: string;
  reference: string;
  status: PayGeniusPayoutStatus;
  amount: number;
  raw: PayGeniusPayoutResponse["data"]["payout"];
}> {
  const walletId = process.env.PAYGENIUS_PAYOUT_WALLET_ID;
  if (!walletId) {
    throw new Error("PAYGENIUS_PAYOUT_WALLET_ID non configuré (UUID du wallet à débiter)");
  }

  const payload = {
    wallet_id: walletId,
    amount: Math.round(params.amount),
    currency: params.currency || "XOF",
    description: params.description ?? `Retrait Novakou`,
    recipient: {
      name: params.recipient.name,
      phone: params.recipient.phone,
      email: params.recipient.email,
    },
    destination: {
      type: params.destination.type,
      provider: params.destination.provider,
      account: params.destination.account,
    },
    metadata: sanitizeMetadata(params.metadata),
    idempotency_key: params.idempotency_key,
  };

  const res = await fetch(`${PAYGENIUS_API_BASE}/payouts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as PayGeniusPayoutResponse | { success: false; error?: { code: string; message: string }; message?: string };
  // Type guard : on extrait `data.payout` proprement quand il existe.
  const payoutData = (json as PayGeniusPayoutResponse).data?.payout;
  if (!res.ok || !("data" in json) || !payoutData?.id) {
    const errObj = (json as { error?: { message?: string } }).error;
    const msgField = (json as { message?: string }).message;
    const msg =
      ("error" in json && errObj?.message) ||
      ("message" in json && msgField) ||
      `PayGenius payout init failed (HTTP ${res.status})`;
    throw new Error(String(msg));
  }
  const p = payoutData;
  return {
    id: String(p.id),
    reference: p.reference,
    status: normalizePayoutStatus(p.status),
    amount: p.amount,
    raw: p,
  };
}

/** Récupère un payout par sa référence (PYT-XXXXXX-XXX). */
export async function retrievePayout(reference: string): Promise<{
  id: string;
  reference: string;
  status: PayGeniusPayoutStatus;
  amount: number;
  raw: PayGeniusPayoutResponse["data"]["payout"];
}> {
  const res = await fetch(`${PAYGENIUS_API_BASE}/payouts/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = (await res.json()) as PayGeniusPayoutResponse | { success: false; error?: { message: string }; message?: string };
  const payoutData = (json as PayGeniusPayoutResponse).data?.payout;
  if (!res.ok || !("data" in json) || !payoutData) {
    const errObj = (json as { error?: { message?: string } }).error;
    const msgField = (json as { message?: string }).message;
    const msg =
      ("error" in json && errObj?.message) ||
      ("message" in json && msgField) ||
      `PayGenius payout retrieve failed (HTTP ${res.status})`;
    throw new Error(String(msg));
  }
  const p = (json as PayGeniusPayoutResponse).data.payout;
  return {
    id: String(p.id),
    reference: p.reference,
    status: normalizePayoutStatus(p.status),
    amount: p.amount,
    raw: p,
  };
}

// ─── WEBHOOK SIGNATURE ───────────────────────────────────────────────────────
// Format : signature = HMAC-SHA256(timestamp + "." + json_payload, webhook_secret)
// Headers fournis par PayGenius :
//   - X-Webhook-Signature   : la signature HMAC en hex
//   - X-Webhook-Timestamp   : Unix timestamp (secondes)
//   - X-Webhook-Event       : nom de l'event
//   - X-Webhook-Delivery    : id unique
//   - X-Webhook-Environment : "sandbox" | "live"
//
// Replay protection : on rejette si |now - timestamp| > 300s.

export function verifyPayGeniusSignature(rawBody: string, headers: Headers): {
  ok: boolean;
  reason?: string;
} {
  const secret = process.env.PAYGENIUS_WEBHOOK_SECRET;
  if (!secret) {
    // SECURITY (production) : si le secret est absent en production, on
    // REFUSE le webhook (sinon replay attack possible). En dev on accepte
    // (le re-check via retrievePayment/retrievePayout garde un filet).
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[PayGenius Webhook] CRITICAL: PAYGENIUS_WEBHOOK_SECRET missing in production — refusing webhook to prevent replay attack",
      );
      return { ok: false, reason: "missing-secret-in-prod" };
    }
    return { ok: true, reason: "no-secret" };
  }

  const provided = (headers.get("x-webhook-signature") || "").replace(/^sha256=/i, "").trim();
  const tsStr = headers.get("x-webhook-timestamp") || "";
  if (!provided) return { ok: false, reason: "missing-signature" };
  if (!tsStr) return { ok: false, reason: "missing-timestamp" };

  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return { ok: false, reason: "invalid-timestamp" };
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > PAYGENIUS_REPLAY_WINDOW_SECONDS) {
    return { ok: false, reason: "timestamp-skew" };
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}.${rawBody}`)
    .digest("hex");

  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return { ok: false, reason: "length-mismatch" };
    return crypto.timingSafeEqual(a, b)
      ? { ok: true }
      : { ok: false, reason: "signature-mismatch" };
  } catch {
    return { ok: false, reason: "hex-decode-error" };
  }
}

// ─── ERROR CLASSIFICATION ────────────────────────────────────────────────────

export type PayGeniusErrorCategory = "insufficient_funds" | "validation" | "network" | "unknown";

export function classifyPayGeniusError(msg: string): { category: PayGeniusErrorCategory; userMessage: string } {
  const lower = msg.toLowerCase();
  if (
    lower.includes("insufficient") ||
    lower.includes("balance") ||
    lower.includes("solde") ||
    lower.includes("wallet") && lower.includes("low")
  ) {
    return {
      category: "insufficient_funds",
      userMessage: "Le solde du wallet PayGenius est insuffisant pour effectuer ce virement. Rechargez le wallet PayGenius puis relancez.",
    };
  }
  if (
    lower.includes("invalid") ||
    lower.includes("validation") ||
    lower.includes("recipient") ||
    lower.includes("phone") ||
    lower.includes("country_not_supported")
  ) {
    return {
      category: "validation",
      userMessage: `Erreur de validation PayGenius : ${msg}. Vérifiez les informations du bénéficiaire.`,
    };
  }
  if (
    lower.includes("timeout") ||
    lower.includes("econnrefused") ||
    lower.includes("network") ||
    lower.includes("fetch failed")
  ) {
    return {
      category: "network",
      userMessage: "PayGenius est temporairement indisponible. Réessayez dans quelques minutes.",
    };
  }
  return {
    category: "unknown",
    userMessage: `Erreur PayGenius : ${msg}`,
  };
}
