// FedaPay — intégration PAYOUT (versement vers Mobile Money).
// Docs : https://docs.fedapay.com/  (section « Payouts »)
//
// Ajouté comme 3e fournisseur de payout (après Moneroo et FeexPay) pour la
// bascule automatique — voir lib/payout/execute.ts.
//
// Particularité : un payout FedaPay se fait en DEUX temps —
//   1. POST /v1/payouts        → crée le payout (statut "pending")
//   2. PUT  /v1/payouts/start  → le DÉCLENCHE réellement (sinon rien n'est envoyé)
// puis GET /v1/payouts/{id} pour suivre le statut final (sent / failed).

function getBaseUrl(): string {
  // FEDAPAY_ENVIRONMENT = "live" | "sandbox" (défaut : live).
  const env = (process.env.FEDAPAY_ENVIRONMENT || "live").toLowerCase();
  return env === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";
}

function getSecretKey(): string {
  const key = process.env.FEDAPAY_SECRET_KEY;
  if (!key) throw new Error("FEDAPAY_SECRET_KEY env var is not set");
  return key;
}

/** FedaPay est utilisable seulement si la clé secrète est fournie. */
export function isFedapayConfigured(): boolean {
  return Boolean(process.env.FEDAPAY_SECRET_KEY);
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getSecretKey()}`,
    Accept: "application/json",
  };
}

// ─── PAYOUT ──────────────────────────────────────────────────────────────────

// pending → started → processing → sent (succès) | failed | canceled
export type FedapayPayoutStatus =
  | "pending" | "started" | "processing" | "sent" | "failed" | "canceled";

export type FedapayPayoutInitParams = {
  amount: number;                 // entier
  currencyIso: string;            // "XOF", "XAF"…
  /** Code opérateur FedaPay (ex "mtn_open", "moov", "togocel"). Résolu via methods-map. */
  mode: string;
  /** Numéro international avec le + (ex "+2290166000000"). */
  phoneNumber: string;
  countryIso: string;             // "bj", "ci", "sn"…
  customer: { firstname: string; lastname: string; email: string };
  description?: string;
  /** Identifiant unique côté marchand, tracé par FedaPay — notre id de retrait. */
  merchantReference?: string;
};

export type FedapayPayoutResult = {
  id: string;                     // id numérique FedaPay (stringifié)
  status: FedapayPayoutStatus;
  raw: unknown;
};

type FedapayPayoutObject = {
  id?: number | string;
  status?: FedapayPayoutStatus;
  reference?: string;
};

/**
 * Crée PUIS déclenche un payout FedaPay (les deux appels enchaînés).
 * Retourne l'id FedaPay + le statut après déclenchement.
 * Lève une Error (message = message FedaPay) en cas d'échec — l'orchestrateur
 * décide alors de basculer vers un autre fournisseur.
 */
export async function initPayout(params: FedapayPayoutInitParams): Promise<FedapayPayoutResult> {
  const base = getBaseUrl();
  const headers = authHeaders();

  // 1) Créer le payout
  const createBody = {
    amount: Math.round(params.amount),
    currency: { iso: params.currencyIso },
    mode: params.mode,
    ...(params.merchantReference ? { merchant_reference: params.merchantReference } : {}),
    ...(params.description ? { description: params.description.slice(0, 100) } : {}),
    customer: {
      firstname: params.customer.firstname,
      lastname: params.customer.lastname,
      email: params.customer.email,
      phone_number: { number: params.phoneNumber, country: params.countryIso },
    },
  };

  const createRes = await fetch(`${base}/payouts`, {
    method: "POST",
    headers,
    body: JSON.stringify(createBody),
  });
  const createJson = (await createRes.json().catch(() => ({}))) as {
    "v1/payout"?: FedapayPayoutObject;
    payout?: FedapayPayoutObject;
    message?: string;
    errors?: unknown;
  };
  // FedaPay enveloppe l'objet sous "v1/payout" (ou "payout" selon la version).
  const created = createJson["v1/payout"] || createJson.payout;
  if (!createRes.ok || !created?.id) {
    const detail = createJson.errors ? ` — ${JSON.stringify(createJson.errors)}` : "";
    throw new Error((createJson.message || "FedaPay payout create failed") + detail);
  }
  const payoutId = String(created.id);

  // 2) Déclencher (sendNow). Sans ce PUT, le payout reste "pending" sans jamais partir.
  const startRes = await fetch(`${base}/payouts/start`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ payouts: [{ id: Number(payoutId) }] }),
  });
  const startJson = (await startRes.json().catch(() => ({}))) as { message?: string };
  if (!startRes.ok) {
    // Le payout existe mais n'a pas pu être déclenché : on remonte l'erreur avec
    // l'id, pour trace/réconciliation manuelle.
    throw new Error(`FedaPay payout ${payoutId} start failed: ${startJson.message || `HTTP ${startRes.status}`}`);
  }

  // Statut le plus frais possible après déclenchement.
  const after = await checkPayoutStatus(payoutId).catch(() => null);
  return {
    id: payoutId,
    status: after?.status ?? created.status ?? "started",
    raw: { create: createJson, start: startJson },
  };
}

/** Statut d'un payout FedaPay : GET /v1/payouts/{id}. */
export async function checkPayoutStatus(payoutId: string): Promise<{ status: FedapayPayoutStatus; raw: unknown }> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/payouts/${encodeURIComponent(payoutId)}`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = (await res.json().catch(() => ({}))) as {
    "v1/payout"?: FedapayPayoutObject;
    payout?: FedapayPayoutObject;
    message?: string;
  };
  const obj = json["v1/payout"] || json.payout;
  if (!res.ok || !obj?.status) {
    throw new Error(json.message || `FedaPay status check failed (HTTP ${res.status})`);
  }
  return { status: obj.status, raw: json };
}

// ─── CLASSIFICATION D'ERREUR ─────────────────────────────────────────────────

export type FedapayErrorCategory = "insufficient_funds" | "validation" | "network" | "not_available" | "unknown";

export function classifyFedapayError(msg: string): { category: FedapayErrorCategory; userMessage: string } {
  const lower = msg.toLowerCase();
  if (lower.includes("insufficient") || lower.includes("balance") || lower.includes("solde") || lower.includes("fund")) {
    return {
      category: "insufficient_funds",
      userMessage: "Le solde de votre compte FedaPay est insuffisant pour ce virement.",
    };
  }
  if (lower.includes("invalid") || lower.includes("validation") || lower.includes("phone") || lower.includes("mode")) {
    return {
      category: "validation",
      userMessage: `Erreur de validation FedaPay : ${msg}. Vérifiez le numéro, l'opérateur et le montant.`,
    };
  }
  if (lower.includes("timeout") || lower.includes("econnrefused") || lower.includes("fetch failed") || lower.includes("502") || lower.includes("503")) {
    return { category: "network", userMessage: "FedaPay est temporairement injoignable. Réessayez." };
  }
  return { category: "unknown", userMessage: `Erreur FedaPay : ${msg}` };
}

/** Normalise un statut FedaPay vers le vocabulaire interne (comme Moneroo). */
export function normalizeFedapayStatus(s: FedapayPayoutStatus | string): "success" | "failed" | "pending" {
  const v = String(s).toLowerCase();
  if (v === "sent") return "success";
  if (v === "failed" || v === "canceled") return "failed";
  return "pending";
}
