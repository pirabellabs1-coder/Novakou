// FeexPay — intégration PAYOUT (versement vers Mobile Money).
// Docs : https://docs.feexpay.me/  (section « API > Payout »)
//
// Contexte : Moneroo encaisse via FeexPay mais ne sait pas VERSER vers un
// compte FeexPay. Ce module ajoute FeexPay comme fournisseur de payout, à côté
// de Moneroo, pour la bascule automatique (voir lib/payout/execute.ts).
//
// Particularité V2 : un payout renvoie TOUJOURS le statut "PENDING" au
// lancement. Il FAUT ensuite interroger l'endpoint de statut pour connaître le
// résultat final (SUCCESSFUL / FAILED). Le webhook confirme aussi de son côté.

const FEEXPAY_API_BASE = "https://api-v2.feexpay.me";

function getApiKey(): string {
  const key = process.env.FEEXPAY_API_KEY;
  if (!key) throw new Error("FEEXPAY_API_KEY env var is not set");
  return key;
}

function getShopId(): string {
  const shop = process.env.FEEXPAY_SHOP_ID;
  if (!shop) throw new Error("FEEXPAY_SHOP_ID env var is not set");
  return shop;
}

/** FeexPay est utilisable seulement si la clé ET l'ID de boutique sont fournis. */
export function isFeexpayConfigured(): boolean {
  return Boolean(process.env.FEEXPAY_API_KEY && process.env.FEEXPAY_SHOP_ID);
}

// ─── PAYOUT ──────────────────────────────────────────────────────────────────

export type FeexpayPayoutStatus = "PENDING" | "SUCCESSFUL" | "FAILED";

export type FeexpayPayoutInitParams = {
  /**
   * Suffixe d'endpoint résolu depuis la table de correspondance (methods-map).
   * Ex : "orange_ci", "wave_sn", "transfer/global" (Bénin MTN/Moov), "togo".
   * L'URL finale est `${FEEXPAY_API_BASE}/api/payouts/public/${endpoint}`.
   */
  endpoint: string;
  /**
   * Étiquette réseau, UNIQUEMENT pour les endpoints multi-opérateurs
   * (Bénin "transfer/global" → "MTN" | "MOOV" ; Togo "togo" → "TOGOCOM TG" | "MOOV TG").
   * Les endpoints mono-opérateur (orange_ci…) n'en ont pas besoin.
   */
  network?: string;
  /** Numéro complet, indicatif compris, chiffres uniquement (ex "2290166000000"). */
  phoneNumber: string;
  amount: number;                 // entier, minimum 100 XOF
  motif: string;                  // ≤ 30 caractères, sans caractères spéciaux
  /** Renvoyé tel quel par le webhook — on y met notre id de retrait interne. */
  callbackInfo?: string;
  email?: string;
};

export type FeexpayPayoutResult = {
  reference: string;
  status: FeexpayPayoutStatus;
  raw: unknown;
};

/**
 * Lance un payout FeexPay. Retourne la référence + le statut initial (PENDING).
 * En cas d'échec API (clé, solde, IP…), lève une Error dont le message contient
 * le `code` FeexPay quand il existe (ex "ERR_INSUFFICIENT_BALANCE"), pour que
 * l'orchestrateur puisse décider de basculer vers un autre fournisseur.
 */
export async function initPayout(params: FeexpayPayoutInitParams): Promise<FeexpayPayoutResult> {
  const apiKey = getApiKey();
  const shop = getShopId();

  // `motif` : FeexPay refuse les caractères spéciaux et coupe à 30. On assainit.
  const motif = (params.motif || "Novakou")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30) || "Novakou";

  const body: Record<string, unknown> = {
    shop,
    amount: Math.round(params.amount),
    phoneNumber: params.phoneNumber,
    motif,
  };
  if (params.network) body.network = params.network;
  if (params.callbackInfo) body.callback_info = params.callbackInfo;
  if (params.email) body.email = params.email;

  const res = await fetch(`${FEEXPAY_API_BASE}/api/payouts/public/${params.endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    reference?: string;
    status?: FeexpayPayoutStatus;
    message?: string;
    code?: string;
    statusCode?: number;
  };

  if (!res.ok || !json.reference) {
    // On préfixe par le code métier pour que classifyFeexpayError le détecte.
    const parts = [json.code, json.message, `HTTP ${res.status}`].filter(Boolean);
    throw new Error(parts.join(" — ") || "FeexPay payout init failed");
  }

  return {
    reference: json.reference,
    status: json.status ?? "PENDING",
    raw: json,
  };
}

/**
 * Statut d'un payout FeexPay. À appeler après initPayout (V2 renvoie PENDING au
 * lancement) et depuis le webhook pour re-confirmer.
 * GET /api/payouts/status/public/<reference>
 */
export async function checkPayoutStatus(reference: string): Promise<{ status: FeexpayPayoutStatus; raw: unknown }> {
  const apiKey = getApiKey();
  const res = await fetch(`${FEEXPAY_API_BASE}/api/payouts/status/public/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  const json = (await res.json().catch(() => ({}))) as { status?: FeexpayPayoutStatus; message?: string };
  if (!res.ok || !json.status) {
    throw new Error(json.message || `FeexPay status check failed (HTTP ${res.status})`);
  }
  return { status: json.status, raw: json };
}

// ─── CLASSIFICATION D'ERREUR ─────────────────────────────────────────────────
// Même vocabulaire de catégories que classifyMonerooError, pour que
// l'orchestrateur traite tous les fournisseurs de façon uniforme.

export type FeexpayErrorCategory = "insufficient_funds" | "validation" | "network" | "not_available" | "unknown";

export function classifyFeexpayError(msg: string): { category: FeexpayErrorCategory; userMessage: string } {
  const lower = msg.toLowerCase();
  if (lower.includes("insufficient") || lower.includes("balance") || lower.includes("solde")) {
    return {
      category: "insufficient_funds",
      userMessage: "Le solde de votre compte FeexPay est insuffisant pour ce virement.",
    };
  }
  // IP non autorisée / payout non activé → FeexPay indisponible pour ce virement
  // → l'orchestrateur bascule vers un autre fournisseur (ce n'est pas une erreur
  // définitive du retrait lui-même).
  if (
    lower.includes("ip_not_authorized") || lower.includes("ip not allowed") ||
    lower.includes("ip_not_allowed") || lower.includes("payout_not_enabled") ||
    lower.includes("network_unavailable") || lower.includes("network unavailable")
  ) {
    return {
      category: "not_available",
      userMessage: "FeexPay est temporairement indisponible pour ce versement.",
    };
  }
  if (lower.includes("invalid_phone") || lower.includes("invalid phone") || lower.includes("invalid_amount") || lower.includes("validation")) {
    return {
      category: "validation",
      userMessage: `Erreur de validation FeexPay : ${msg}. Vérifiez le numéro et le montant.`,
    };
  }
  if (lower.includes("timeout") || lower.includes("econnrefused") || lower.includes("fetch failed") || lower.includes("bad gateway")) {
    return { category: "network", userMessage: "FeexPay est temporairement injoignable. Réessayez." };
  }
  return { category: "unknown", userMessage: `Erreur FeexPay : ${msg}` };
}

/** Normalise un statut FeexPay vers le vocabulaire interne (comme Moneroo). */
export function normalizeFeexpayStatus(s: FeexpayPayoutStatus | string): "success" | "failed" | "pending" {
  const up = String(s).toUpperCase();
  if (up === "SUCCESSFUL") return "success";
  if (up === "FAILED") return "failed";
  return "pending";
}
