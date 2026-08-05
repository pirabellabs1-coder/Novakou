// FeexPay — encaissement (push Mobile Money) et versement.
// Docs : https://docs.feexpay.me/
//
// Les codes réseau viennent du registre (lib/payments/registry.ts), source
// unique du routage. Les endpoints d'encaissement ont été relevés sur le SDK
// officiel : la doc REST publique ne les décrit pas.
//
// Particularité V2 : un payout renvoie TOUJOURS le statut "PENDING" au
// lancement. Il FAUT ensuite interroger l'endpoint de statut pour connaître le
// résultat final (SUCCESSFUL / FAILED). Le webhook confirme aussi de son côté.

import { PayoutNeverSentError, codeSysteme, payoutFetch } from "@/lib/payout/proxy-fetch";
import { routeFor } from "@/lib/payments/registry";
import { credential, hasCredentials } from "@/lib/payments/credentials";

const FEEXPAY_API_BASE = "https://api-v2.feexpay.me";

async function getApiKey(): Promise<string> {
  const key = await credential("feexpay", "apiKey");
  if (!key) throw new Error("Clé API FeexPay absente (admin ou FEEXPAY_API_KEY)");
  return key;
}

async function getShopId(): Promise<string> {
  const shop = await credential("feexpay", "shopId");
  if (!shop) throw new Error("Identifiant boutique FeexPay absent (admin ou FEEXPAY_SHOP_ID)");
  return shop;
}

/** FeexPay est utilisable seulement si la clé ET l'ID de boutique sont fournis. */
export function isFeexpayConfigured(): Promise<boolean> {
  return hasCredentials("feexpay");
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
  const apiKey = await getApiKey();
  const shop = await getShopId();

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

  const res = await payoutFetch(`${FEEXPAY_API_BASE}/api/payouts/public/${params.endpoint}`, {
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
  const apiKey = await getApiKey();
  const res = await payoutFetch(`${FEEXPAY_API_BASE}/api/payouts/status/public/${encodeURIComponent(reference)}`, {
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
// Même vocabulaire de catégories que les autres passerelles, pour que
// l'orchestrateur traite tous les fournisseurs de façon uniforme.

export type FeexpayErrorCategory =
  | "insufficient_funds"
  | "validation"
  | "network"
  | "not_available"
  /** La requête n'a JAMAIS atteint le fournisseur : basculer est sans danger. */
  | "never_sent"
  | "unknown";

export function classifyFeexpayError(
  msg: string,
  err?: unknown,
): { category: FeexpayErrorCategory; userMessage: string } {
  // Connexion jamais établie (DNS, refus, proxy injoignable) : la requête n'a
  // pas atteint le fournisseur, donc aucun versement n'a pu partir. On peut
  // essayer une autre passerelle sans risquer de payer deux fois.
  if (err instanceof PayoutNeverSentError) {
    return {
      category: "never_sent",
      userMessage: `FeexPay n'a pas pu être contacté (${err.code}). Une autre passerelle va être essayée.`,
    };
  }
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
    // Le code système est conservé dans le message : sans lui, impossible de
    // distinguer une panne de proxy d'une panne de fournisseur — c'est ce qui
    // a rendu l'incident du 4 août 2026 illisible pendant des heures.
    const code = codeSysteme(err);
    return {
      category: "network",
      userMessage: `FeexPay est temporairement injoignable${code ? ` (${code})` : ""}. Réessayez.`,
    };
  }
  return { category: "unknown", userMessage: `Erreur FeexPay : ${msg}` };
}

/** Normalise un statut FeexPay vers le vocabulaire interne. */
export function normalizeFeexpayStatus(s: FeexpayPayoutStatus | string): "success" | "failed" | "pending" {
  const up = String(s).toUpperCase();
  if (up === "SUCCESSFUL") return "success";
  if (up === "FAILED") return "failed";
  return "pending";
}

// ─── ENCAISSEMENT (collect) ──────────────────────────────────────────────────
//
// Endpoints relevés dans le SDK React officiel publié par FeexPay
// (@feexpay/react-sdk, dist/index.cjs.js) — leur documentation REST n'étant
// pas publique. Aucun code inventé : URL, noms de champs et valeurs de réseau
// proviennent tous du code du fournisseur.
//
//   POST /api/transactions/requesttopay/integration      → push Mobile Money
//   GET  /api/transactions/getrequesttopay/integration/{id} → statut
//
// L'appel sort par le proxy à IP fixe : FeexPay filtre par IP, et les IP de
// Vercel sont dynamiques (même contrainte que pour le versement).

// MÊME hôte que le versement. L'encaissement pointait sur `api.feexpay.me`,
// qui répond 502 sur TOUTES ses routes : chaque paiement FeexPay échouait donc
// avant même d'être tenté. Ce n'était pas une panne du fournisseur — c'était
// la mauvaise adresse. Vérifié sur le même chemin : `api.feexpay.me` → 502,
// `api-v2.feexpay.me` → 401 sans clé (donc la route existe et attend l'auth).
const FEEXPAY_COLLECT_BASE = FEEXPAY_API_BASE;

/**
 * Valeur du champ `reseau` attendue par FeexPay, par code opérateur interne.
 * Reprise telle quelle du SDK : ne PAS inventer de variante — un réseau
 * inconnu de FeexPay fait échouer la transaction.
 */
/**
 * Réseau FeexPay pour cet opérateur, ou null si FeexPay ne le sert pas.
 *
 * La valeur vient du REGISTRE, source unique de vérité du routage. Cette table
 * était auparavant dupliquée ici : deux listes à maintenir pour la même chose,
 * et un jour l'une des deux qui dérive. Or un mauvais réseau n'échoue pas
 * toujours proprement — il peut viser le mauvais opérateur.
 */
export function feexpayNetworkFor(operator: string): string | null {
  return routeFor(operator, "feexpay", "collect")?.code ?? null;
}

export type FeexpayCollectParams = {
  /** Code opérateur interne (ex. "orange_ci"). */
  operator: string;
  amount: number;
  /** Numéro complet, chiffres uniquement, indicatif compris. */
  phoneNumber: string;
  currency?: string;
  description: string;
  /** Notre référence interne — renvoyée telle quelle par le webhook. */
  customId: string;
  firstName?: string;
  email?: string;
};

export type FeexpayCollectResult = {
  reference: string;
  status: "success" | "failed" | "pending";
  raw: unknown;
};

/**
 * Déclenche un paiement Mobile Money : l'acheteur reçoit une demande de
 * confirmation sur son téléphone. Le statut définitif arrive par le webhook,
 * ou en interrogeant checkCollectStatus.
 */
export async function initCollect(params: FeexpayCollectParams): Promise<FeexpayCollectResult> {
  const apiKey = await getApiKey();
  const shop = await getShopId();

  const reseau = feexpayNetworkFor(params.operator);
  if (!reseau) {
    throw new Error(`FeexPay ne sert pas l'opérateur "${params.operator}"`);
  }

  // Le SDK retire le « + » et corrige les indicatifs doublés (« 229229… »).
  let phone = params.phoneNumber.replace(/\D/g, "");
  if (phone.length >= 8) {
    const p3 = phone.slice(0, 3);
    if (phone.startsWith(p3 + p3)) phone = phone.slice(p3.length);
  }

  // MTN refuse les caractères spéciaux dans le libellé (comportement du SDK).
  let description = params.description || "Novakou";
  if (reseau.startsWith("MTN")) description = description.replace(/[^a-zA-Z0-9 ]/g, "");

  const body = {
    phoneNumber: phone,
    amount: Math.round(params.amount),
    reseau,
    description,
    customId: params.customId,
    shop,
    token: apiKey,
    payment_interface: "API",
    callback_info: { ref: params.customId },
    currency: params.currency || "XOF",
    first_name: params.firstName || "Client",
    email: params.email || "",
    otp: "",
  };

  const res = await payoutFetch(`${FEEXPAY_COLLECT_BASE}/api/transactions/requesttopay/integration`, {
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
    transaction_id?: string;
    status?: string;
    message?: string;
    code?: string;
  };

  const reference = json.reference || json.transaction_id;
  if (!res.ok || !reference) {
    const parts = [json.code, json.message, `HTTP ${res.status}`].filter(Boolean);
    throw new Error(parts.join(" — ") || "FeexPay collect init failed");
  }

  return { reference, status: normalizeFeexpayStatus(json.status ?? "PENDING"), raw: json };
}

/** Statut d'un encaissement FeexPay. À appeler depuis le webhook pour re-vérifier. */
export async function checkCollectStatus(
  reference: string,
): Promise<{ status: "success" | "failed" | "pending"; raw: unknown }> {
  // ⚠️ La clé est INDISPENSABLE ici. Cet appel partait sans `Authorization`,
  // alors que l'initiation du paiement l'envoie bien. Résultat : la demande
  // arrivait sur le téléphone de l'acheteur, il confirmait — et nous ne
  // pouvions JAMAIS lire le résultat. La page « Confirmez sur votre
  // téléphone » tournait indéfiniment et le produit n'était jamais livré,
  // sans la moindre erreur pour l'expliquer.
  const apiKey = await getApiKey();
  const res = await payoutFetch(
    // Chemin de CONSULTATION, différent de celui qui lance le paiement.
    // `/api/transactions/getrequesttopay/integration/{ref}` n'existe pas sur
    // api-v2 : le serveur y répond « Cannot GET », c'est-à-dire aucune route.
    // Un achat de 300 F est resté bloqué là-dessus — le paiement partait, et
    // nous ne pouvions jamais lire son résultat.
    //
    // Le bon chemin a été trouvé en sondant : seul celui-ci répond 401 sans
    // clé (donc la route existe et attend l'authentification), les autres
    // répondent « Cannot GET ».
    `${FEEXPAY_COLLECT_BASE}/api/transactions/public/single/status/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
    },
  );
  const json = (await res.json().catch(() => ({}))) as { status?: string; message?: string };
  if (!res.ok || !json.status) {
    throw new Error(json.message || `FeexPay collect status failed (HTTP ${res.status})`);
  }
  return { status: normalizeFeexpayStatus(json.status), raw: json };
}
