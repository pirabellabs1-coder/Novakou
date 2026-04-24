// Moneroo payment integration — https://docs.moneroo.io/

const MONEROO_API_BASE = "https://api.moneroo.io/v1";

function getApiKey(): string {
  const key = process.env.MONEROO_SECRET_KEY;
  if (!key) {
    throw new Error("MONEROO_SECRET_KEY env var is not set");
  }
  return key;
}

export type MonerooInitParams = {
  amount: number;            // integer in the smallest currency unit per Moneroo conventions (use unit per their docs)
  currency: string;          // e.g. "XOF" for FCFA, "EUR", "USD"
  description: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  return_url: string;        // where Moneroo redirects after payment
  /**
   * Moneroo exige que chaque valeur metadata soit string / boolean / integer.
   * On accepte `unknown` ici et on sanitize dans initPayment — les arrays sont
   * sérialisés CSV, les objets en JSON, les null/undefined deviennent "".
   */
  metadata?: Record<string, unknown>;
  methods?: string[];        // optional payment method codes
};

/**
 * Sanitize la metadata pour respecter les contraintes Moneroo :
 * - string / boolean / integer uniquement (pas d'array, pas d'objet, pas de null)
 * - clés ignorées si la valeur est undefined/null/objet vide
 * - les arrays sont joints en CSV (ex: ["a","b"] → "a,b")
 * - les objets sont JSON-stringifiés
 * - tous les autres types sont coercés en String()
 */
function sanitizeMetadata(meta?: Record<string, unknown>): Record<string, string | number | boolean> | undefined {
  if (!meta) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(meta)) {
    // Skip null / undefined (Moneroo n'accepte pas les values null)
    if (v === null || v === undefined) continue;

    let coerced: string | number | boolean | undefined;

    if (typeof v === "boolean") {
      coerced = v;
    } else if (typeof v === "number") {
      coerced = Number.isFinite(v) ? v : String(v);
    } else if (typeof v === "string") {
      coerced = v;
    } else if (Array.isArray(v)) {
      // Array → comma-separated string (le webhook parse avec parseIdList)
      coerced = v.filter((x) => x !== null && x !== undefined).map((x) => String(x)).join(",");
    } else if (typeof v === "object") {
      try {
        coerced = JSON.stringify(v);
      } catch {
        coerced = String(v);
      }
    } else {
      coerced = String(v);
    }

    // Skip empty strings (Moneroo rejette "" dans metadata)
    if (typeof coerced === "string" && coerced.length === 0) continue;
    if (coerced === undefined) continue;

    out[k] = coerced;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export type MonerooInitResponse = {
  message: string;
  data: {
    id: string;
    checkout_url: string;
  };
};

export type MonerooPaymentStatus = "pending" | "success" | "failed" | "cancelled" | "initiated";

export type MonerooRetrieveResponse = {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: MonerooPaymentStatus;
    amount: number;
    currency: string;
    customer: { email: string };
    metadata: Record<string, string | number>;
  };
};

/** Initialize a Moneroo payment session. Returns the checkout URL to redirect to. */
export async function initPayment(params: MonerooInitParams): Promise<MonerooInitResponse["data"]> {
  const apiKey = getApiKey();

  // Build clean payload : metadata sanitized, customer required fields, amount rounded
  const payload = {
    amount: Math.round(params.amount),
    currency: params.currency,
    description: params.description,
    customer: params.customer,
    return_url: params.return_url,
    metadata: sanitizeMetadata(params.metadata),
    ...(params.methods && params.methods.length > 0 ? { methods: params.methods } : {}),
  };

  const res = await fetch(`${MONEROO_API_BASE}/payments/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as MonerooInitResponse | { message?: string; error?: string; errors?: Record<string, string[]> };
  if (!res.ok || !("data" in json) || !json.data?.checkout_url) {
    // Moneroo renvoie parfois un champ `errors` avec détails par champ (ex: metadata.formationIds)
    let msg = ("message" in json && json.message) || ("error" in json && json.error) || "Moneroo init failed";
    if ("errors" in json && json.errors && typeof json.errors === "object") {
      const details = Object.entries(json.errors as Record<string, string[]>)
        .map(([k, arr]) => `${k}: ${Array.isArray(arr) ? arr.join(" / ") : String(arr)}`)
        .join(" | ");
      if (details) msg = `${msg} — ${details}`;
    }
    throw new Error(msg);
  }
  return json.data;
}

/** Retrieve a payment status by id. */
export async function retrievePayment(paymentId: string): Promise<MonerooRetrieveResponse["data"]> {
  const apiKey = getApiKey();
  const res = await fetch(`${MONEROO_API_BASE}/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  const json = (await res.json()) as MonerooRetrieveResponse | { message?: string };
  if (!res.ok || !("data" in json)) {
    throw new Error(("message" in json && json.message) || "Moneroo retrieve failed");
  }
  return json.data;
}

/** Helper to know if Moneroo is configured (env var present). */
export function isMonerooConfigured(): boolean {
  return Boolean(process.env.MONEROO_SECRET_KEY);
}

// ─── PAYOUTS (sortants : vendeur reçoit son argent) ──────────────────────────
// Docs : https://docs.moneroo.io/api/payouts
//
// Le flow est le suivant :
//   1. On appelle initPayout() avec la méthode + les détails du bénéficiaire
//   2. Moneroo valide et commence le processus (status "pending" puis "processing")
//   3. Moneroo envoie un webhook quand le statut final est atteint (success/failed)
//   4. On peut aussi poller retrievePayout() pour vérifier le statut
// ─────────────────────────────────────────────────────────────────────────────

export type MonerooPayoutMethod =
  // Côte d'Ivoire
  | "orange_money_ci" | "mtn_ci" | "moov_ci" | "wave_ci"
  // Sénégal
  | "orange_money_sn" | "wave_sn" | "free_money_sn" | "expresso_sn"
  // Mali
  | "orange_money_ml" | "moov_ml"
  // Burkina Faso
  | "orange_money_bf" | "moov_bf"
  // Niger
  | "orange_money_ne" | "airtel_ne"
  // Bénin
  | "mtn_bj" | "moov_bj" | "celtis_bj"
  // Togo
  | "tmoney_tg" | "flooz_tg"
  // Cameroun
  | "orange_money_cm" | "mtn_cm"
  // Congo / Gabon
  | "airtel_cg" | "airtel_ga"
  // International
  | "bank_transfer" | "paypal" | "wise";

export type MonerooPayoutInitParams = {
  amount: number;
  currency: string;                       // "XOF", "XAF", "EUR", "USD"
  description: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
  };
  method: MonerooPayoutMethod | string;
  // Détails spécifiques à la méthode. Ex :
  //   - Mobile Money : { phone: "+221 77 123 45 67" }
  //   - Bank transfer : { iban, bic, bank_name, account_holder }
  //   - PayPal : { email }
  method_details: Record<string, string>;
  metadata?: Record<string, unknown>;
};

export type MonerooPayoutStatus = "pending" | "processing" | "success" | "failed" | "cancelled";

export type MonerooPayoutResponse = {
  message?: string;
  data: {
    id: string;
    reference?: string;
    status: MonerooPayoutStatus;
    amount: number;
    currency: string;
    method: string;
    created_at?: string;
  };
};

/**
 * Initialise un payout (retrait) via Moneroo.
 * Le bénéficiaire recevra les fonds sur son compte (Mobile Money, banque, PayPal, etc.)
 * selon la méthode choisie.
 *
 * Retourne l'objet Moneroo avec `id` et `status` — le statut initial peut être
 * "pending" ou "processing" et finalisera via webhook.
 */
export async function initPayout(params: MonerooPayoutInitParams): Promise<MonerooPayoutResponse["data"]> {
  const apiKey = getApiKey();

  const payload = {
    amount: Math.round(params.amount),
    currency: params.currency,
    description: params.description,
    customer: params.customer,
    method: params.method,
    method_details: params.method_details,
    metadata: sanitizeMetadata(params.metadata),
  };

  const res = await fetch(`${MONEROO_API_BASE}/payouts/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as MonerooPayoutResponse | { message?: string; error?: string; errors?: Record<string, string[]> };
  if (!res.ok || !("data" in json) || !json.data?.id) {
    let msg = ("message" in json && json.message) || ("error" in json && json.error) || "Moneroo payout init failed";
    if ("errors" in json && json.errors && typeof json.errors === "object") {
      const details = Object.entries(json.errors as Record<string, string[]>)
        .map(([k, arr]) => `${k}: ${Array.isArray(arr) ? arr.join(" / ") : String(arr)}`)
        .join(" | ");
      if (details) msg = `${msg} — ${details}`;
    }
    throw new Error(msg);
  }
  return json.data;
}

/** Récupère le statut d'un payout existant. Utilisé pour confirmer / poller. */
export async function retrievePayout(payoutId: string): Promise<MonerooPayoutResponse["data"]> {
  const apiKey = getApiKey();
  const res = await fetch(`${MONEROO_API_BASE}/payouts/${payoutId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  const json = (await res.json()) as MonerooPayoutResponse | { message?: string };
  if (!res.ok || !("data" in json)) {
    throw new Error(("message" in json && json.message) || "Moneroo payout retrieve failed");
  }
  return json.data;
}
