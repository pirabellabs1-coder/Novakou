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

import { payoutFetch } from "@/lib/payout/proxy-fetch";
import { routeFor } from "@/lib/payments/registry";

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

  const createRes = await payoutFetch(`${base}/payouts`, {
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
  const startRes = await payoutFetch(`${base}/payouts/start`, {
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
  // « Opération non autorisée », 401/403, décaissement non activé : le compte
  // n'a pas le droit de verser. C'est un refus AVANT tout mouvement d'argent →
  // catégorie `not_available` (bascule propre / arrêt net, PAS ambigu).
  if (
    lower.includes("autoris") || lower.includes("unauthorized") || lower.includes("not authorized") ||
    lower.includes("forbidden") || lower.includes("403") || lower.includes("401") ||
    lower.includes("not enabled") || lower.includes("disburs") || lower.includes("décaiss") || lower.includes("decaiss")
  ) {
    return {
      category: "not_available",
      userMessage: "FedaPay n'est pas autorisé à effectuer ce versement (compte ou fonction de décaissement non activée).",
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

// ─── ENCAISSEMENT (collect) ──────────────────────────────────────────────────
//
// Documentation officielle (docs.fedapay.com/api-reference/transactions/*).
// Trois appels enchaînés :
//   1. POST /transactions            → crée la transaction, renvoie {id}
//   2. POST /transactions/{id}/token → renvoie {token, url}
//   3. POST /transactions/{mode}     → {token, phone_number} : push sur le
//                                      téléphone de l'acheteur
//
// La carte n'utilise PAS l'étape 3 : on renvoie l'`url` de l'étape 2, page
// bancaire hébergée par FedaPay. Aucune donnée de carte ne transite chez nous
// (périmètre PCI-DSS).
//
// Sortie par le proxy à IP fixe, comme le versement.

/**
 * Valeur du champ `mode` attendue par FedaPay, par code opérateur interne.
 * ⚠️ N'inscrire QUE des modes confirmés par la doc : un mode inconnu route le
 * paiement vers le mauvais réseau. Compléter au fil des confirmations dans le
 * tableau de bord FedaPay (Décaissements → sélecteur opérateur).
 */
/**
 * Mode FedaPay pour cet opérateur, ou null si non confirmé.
 *
 * Lu dans le REGISTRE, source unique du routage. Cette table y était dupliquée :
 * deux listes pour la même chose, dont une qui finit par dériver.
 */
export function fedapayModeFor(operator: string): string | null {
  return routeFor(operator, "fedapay", "collect")?.code ?? null;
}

export type FedapayCollectParams = {
  /** Code opérateur interne ; absent/inconnu ⇒ paiement par page hébergée. */
  operator?: string;
  amount: number;
  currencyIso: string;
  description: string;
  /** Numéro international AVEC le « + » (ex "+2290166000000"). */
  phoneNumber?: string;
  countryIso?: string;
  customer: { firstname: string; lastname: string; email: string };
  /** Notre référence interne, tracée par FedaPay. */
  merchantReference: string;
  callbackUrl?: string;
};

export type FedapayCollectResult = {
  reference: string;
  status: "success" | "failed" | "pending";
  /** Renseignée pour un paiement par page hébergée (carte). */
  redirectUrl?: string;
  raw: unknown;
};

/**
 * Lance un encaissement FedaPay.
 * - opérateur Mobile Money connu → push direct sur le téléphone.
 * - sinon → renvoie l'URL de la page de paiement hébergée.
 */
export async function initCollect(params: FedapayCollectParams): Promise<FedapayCollectResult> {
  const base = getBaseUrl();
  const headers = authHeaders();

  // 1) Créer la transaction.
  const createRes = await payoutFetch(`${base}/transactions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      description: params.description.slice(0, 100),
      amount: Math.round(params.amount),
      currency: { iso: params.currencyIso },
      merchant_reference: params.merchantReference,
      ...(params.callbackUrl ? { callback_url: params.callbackUrl } : {}),
      customer: {
        firstname: params.customer.firstname,
        lastname: params.customer.lastname,
        email: params.customer.email,
        ...(params.phoneNumber && params.countryIso
          ? { phone_number: { number: params.phoneNumber, country: params.countryIso } }
          : {}),
      },
    }),
  });
  const createJson = (await createRes.json().catch(() => ({}))) as {
    "v1/transaction"?: { id?: number | string };
    transaction?: { id?: number | string };
    message?: string;
    errors?: unknown;
  };
  const created = createJson["v1/transaction"] || createJson.transaction;
  if (!createRes.ok || !created?.id) {
    const detail = createJson.errors ? ` — ${JSON.stringify(createJson.errors)}` : "";
    throw new Error((createJson.message || "FedaPay transaction create failed") + detail);
  }
  const txId = String(created.id);

  // 2) Générer le jeton de paiement (+ l'URL hébergée).
  const tokenRes = await payoutFetch(`${base}/transactions/${encodeURIComponent(txId)}/token`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  const tokenJson = (await tokenRes.json().catch(() => ({}))) as {
    token?: string;
    url?: string;
    message?: string;
  };
  if (!tokenRes.ok || !tokenJson.token) {
    throw new Error(tokenJson.message || `FedaPay token failed (HTTP ${tokenRes.status})`);
  }

  // 3) Mobile Money : push direct. Sinon on rend la main à la page hébergée.
  const mode = params.operator ? fedapayModeFor(params.operator) : null;
  if (!mode || !params.phoneNumber || !params.countryIso) {
    return { reference: txId, status: "pending", redirectUrl: tokenJson.url, raw: { createJson, tokenJson } };
  }

  const sendRes = await payoutFetch(`${base}/transactions/${encodeURIComponent(mode)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      token: tokenJson.token,
      phone_number: { number: params.phoneNumber, country: params.countryIso },
    }),
  });
  const sendJson = (await sendRes.json().catch(() => ({}))) as { message?: string; status?: string };
  if (!sendRes.ok) {
    throw new Error(sendJson.message || `FedaPay send-payment failed (HTTP ${sendRes.status})`);
  }

  // Statut le plus frais possible ; le webhook confirmera de toute façon.
  const after = await checkPayoutStatus(txId).catch(() => null);
  return {
    reference: txId,
    status: after ? normalizeFedapayStatus(after.status) : "pending",
    raw: { createJson, tokenJson, sendJson },
  };
}

/** Statut d'un encaissement — même endpoint que pour un versement. */
export async function checkCollectStatus(
  transactionId: string,
): Promise<{ status: "success" | "failed" | "pending"; raw: unknown }> {
  const r = await checkPayoutStatus(transactionId);
  return { status: normalizeFedapayStatus(r.status), raw: r.raw };
}
