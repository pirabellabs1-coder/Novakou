// iPay Money — encaissement (Niger).
//
// Sources : SDK PHP officiel (elbrahms/ipaymoney) + sondes directes de l'API.
// CONFIRMÉ par sonde le 2026-08-03 :
//   • POST https://i-pay.money/api/v1/payments        → répond (400 sans clé)
//   • GET  https://i-pay.money/api/v1/payments/{ref}  → répond (400 sans clé)
//   • aucun sous-domaine « sandbox » : l'environnement se choisit par EN-TÊTE.
//
// Authentification : `Authorization: Bearer <clé secrète>`.
// En-têtes propres au fournisseur : `Ipay-Payment-Type`, `Ipay-Target-Environment`.
//
// Valeurs confirmées dans les énumérations du SDK officiel :
//   Ipay-Target-Environment : "sandbox" | "live"
//   Ipay-Payment-Type       : "mobile" | "card" | "myNita" | "amanata"
//   statuts                 : "succeeded" | "failed" | "pending"
// Elles restent surchargeables par variable d'environnement, au cas où le
// fournisseur les ferait évoluer sans prévenir.

import { payoutFetch } from "@/lib/payout/proxy-fetch";
import { credential, hasCredentials, isSandbox } from "@/lib/payments/credentials";

const IPAY_API_BASE = "https://i-pay.money";

/** Valeurs d'environnement, surchargeables sans redéploiement. */
function envHeaderValue(sandbox: boolean): string {
  const custom = sandbox ? process.env.IPAYMONEY_ENV_SANDBOX : process.env.IPAYMONEY_ENV_LIVE;
  return custom?.trim() || (sandbox ? "sandbox" : "live");
}

async function getSecretKey(): Promise<string> {
  const k = await credential("ipaymoney", "secretKey");
  if (!k) throw new Error("Clé secrète iPay Money absente (admin ou IPAYMONEY_SECRET_KEY)");
  return k;
}

export function isIpaymoneyConfigured(): Promise<boolean> {
  return hasCredentials("ipaymoney");
}

export type IpaymoneyStatus = "success" | "failed" | "pending";

/** Vocabulaire interne commun à toutes les passerelles. */
/**
 * Statuts d'attente LÉGITIMES. Les lister permet de distinguer « l'acheteur
 * n'a pas encore confirmé » de « on ne comprend pas la réponse » — deux
 * situations que le repli sur « pending » confondait silencieusement.
 */
const IPAY_ATTENTE = new Set(["pending", "initiated", "processing", "in_progress", "created", "waiting"]);

export function normalizeIpaymoneyStatus(s: string | undefined | null): IpaymoneyStatus {
  const v = String(s ?? "").toLowerCase();
  if (v === "succeeded" || v === "success" || v === "successful" || v === "completed") return "success";
  if (v === "failed" || v === "cancelled" || v === "canceled" || v === "rejected") return "failed";

  // Statut ININTELLIGIBLE. On conserve « pending » — annoncer un échec
  // priverait de son produit un acheteur qui a peut-être payé — mais on le
  // JOURNALISE, sinon il reste indiscernable d'une attente normale et la
  // vente se bloque sans que rien n'en explique la raison.
  if (!IPAY_ATTENTE.has(v)) {
    console.error(`[ipaymoney] statut inconnu, traité en attente : « ${v || "(vide)"} »`);
  }
  return "pending";
}

export type IpaymoneyCollectParams = {
  /** "mobile" ou "card" — résolu depuis le registre. */
  paymentType: string;
  amount: number;
  /** Numéro complet, chiffres uniquement (indicatif compris). */
  msisdn?: string;
  /** Notre référence interne : elle revient dans le webhook. */
  transactionId: string;
  customerName?: string;
  /** ISO-2 majuscules (« NE »). Défaut : NE. */
  country?: string;
  /** Devise ISO (« XOF »). Obligatoire côté fournisseur. */
  currency?: string;
};

export type IpaymoneyCollectResult = {
  /** Référence du fournisseur, à interroger ensuite. */
  reference: string;
  status: IpaymoneyStatus;
  /** Page hébergée si le fournisseur en renvoie une (paiement par carte). */
  redirectUrl?: string;
  raw: unknown;
};

/**
 * Déclenche un encaissement. En mobile money, l'acheteur reçoit une demande de
 * confirmation sur son téléphone ; le statut définitif s'obtient ensuite par
 * `checkCollectStatus` (ou par le webhook, qui déclenche la même vérification).
 */
export async function initCollect(params: IpaymoneyCollectParams): Promise<IpaymoneyCollectResult> {
  const [key, sandbox] = await Promise.all([getSecretKey(), isSandbox("ipaymoney")]);

  // Corps exact attendu, relevé sur `PaymentRequest::toPayload()` du SDK :
  // customer_name, currency, country, amount (CHAÎNE), transaction_id, msisdn.
  // `payment_type` ne va PAS dans le corps — c'est un en-tête. Et `currency`
  // est obligatoire : son absence faisait répondre « Missing Body Params ».
  const body: Record<string, unknown> = {
    amount: String(Math.round(params.amount)),
    transaction_id: params.transactionId,
    currency: params.currency || "XOF",
    country: (params.country || "NE").toUpperCase(),
  };
  if (params.msisdn) body.msisdn = params.msisdn.replace(/\D/g, "");
  if (params.customerName) body.customer_name = params.customerName;

  const res = await payoutFetch(`${IPAY_API_BASE}/api/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
      "Ipay-Payment-Type": params.paymentType,
      "Ipay-Target-Environment": envHeaderValue(sandbox),
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    reference?: string;
    external_reference?: string;
    status?: string;
    payment_url?: string;
    url?: string;
    message?: string;
  };

  const reference = json.reference || json.external_reference;
  if (!res.ok || !reference) {
    throw new Error(json.message || `iPay Money : échec d'initialisation (HTTP ${res.status})`);
  }

  return {
    reference,
    status: normalizeIpaymoneyStatus(json.status),
    redirectUrl: json.payment_url || json.url,
    raw: json,
  };
}

/** Statut réel d'un encaissement — seule source de vérité avant livraison. */
export async function checkCollectStatus(
  reference: string,
  paymentType?: string,
): Promise<{ status: IpaymoneyStatus; amount: number | null; raw: unknown }> {
  const [key, sandbox] = await Promise.all([getSecretKey(), isSandbox("ipaymoney")]);
  const res = await payoutFetch(`${IPAY_API_BASE}/api/v1/payments/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
      // `Ipay-Payment-Type` est obligatoire sur TOUS les appels, pas seulement
      // à la création : leur SDK l'ajoute systématiquement. Sans lui, la
      // consultation de statut répond « Bad Request: Missing params », la
      // réconciliation ne conclut jamais, et la vente reste bloquée.
      "Ipay-Payment-Type": paymentType || "mobile",
      "Ipay-Target-Environment": envHeaderValue(sandbox),
    },
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: string;
    amount?: number | string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message || `iPay Money : statut indisponible (HTTP ${res.status})`);
  }
  const amount = Number(json.amount);

  // Aucun champ de statut à la racine : la réponse n'a pas la forme attendue.
  // On journalise l'intégralité — sans elle, impossible de savoir quelle clé
  // lire, et la vente reste bloquée indéfiniment.
  if (json.status == null) {
    console.error(
      `[ipaymoney] paiement ${reference} sans champ de statut :`,
      JSON.stringify(json).slice(0, 800),
    );
  }

  return {
    status: normalizeIpaymoneyStatus(json.status),
    amount: Number.isFinite(amount) ? amount : null,
    raw: json,
  };
}

/** Même vocabulaire de catégories que les autres modules, pour l'orchestrateur. */
export function classifyIpaymoneyError(msg: string): {
  category: "validation" | "network" | "not_available" | "unknown";
  userMessage: string;
} {
  const l = msg.toLowerCase();
  if (l.includes("unauthor") || l.includes("forbidden") || l.includes("401") || l.includes("403")) {
    return { category: "not_available", userMessage: "iPay Money a refusé nos identifiants." };
  }
  if (l.includes("missing params") || l.includes("bad request") || l.includes("invalid") || l.includes("400")) {
    return { category: "validation", userMessage: `Requête refusée par iPay Money : ${msg}` };
  }
  if (l.includes("timeout") || l.includes("fetch failed") || l.includes("gateway")) {
    return { category: "network", userMessage: "iPay Money est temporairement injoignable." };
  }
  return { category: "unknown", userMessage: `Erreur iPay Money : ${msg}` };
}
