// FedaPay — intégration PAYOUT (versement vers Mobile Money).
// Docs : https://docs.fedapay.com/  (section « Payouts »)
//
// Ajouté comme 3e fournisseur de payout (après la passerelle et FeexPay) pour la
// bascule automatique — voir lib/payout/execute.ts.
//
// Particularité : un payout FedaPay se fait en DEUX temps —
//   1. POST /v1/payouts        → crée le payout (statut "pending")
//   2. PUT  /v1/payouts/start  → le DÉCLENCHE réellement (sinon rien n'est envoyé)
// puis GET /v1/payouts/{id} pour suivre le statut final (sent / failed).

import { PayoutNeverSentError, codeSysteme, payoutFetch } from "@/lib/payout/proxy-fetch";
import { routeFor } from "@/lib/payments/registry";
import { credential, hasCredentials } from "@/lib/payments/credentials";

function getBaseUrl(): string {
  // FEDAPAY_ENVIRONMENT = "live" | "sandbox" (défaut : live).
  const env = (process.env.FEDAPAY_ENVIRONMENT || "live").toLowerCase();
  return env === "sandbox"
    ? "https://sandbox-api.fedapay.com/v1"
    : "https://api.fedapay.com/v1";
}

async function getSecretKey(): Promise<string> {
  const key = await credential("fedapay", "secretKey");
  if (!key) throw new Error("Clé secrète FedaPay absente (admin ou FEDAPAY_SECRET_KEY)");
  return key;
}

/** FedaPay est utilisable seulement si la clé secrète est fournie. */
export function isFedapayConfigured(): Promise<boolean> {
  return hasCredentials("fedapay");
}

async function authHeaders(): Promise<Record<string, string>> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${await getSecretKey()}`,
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
  const headers = await authHeaders();

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
  // `payoutFetch`, PAS `fetch` : cet appel contournait le proxy à IP fixe et
  // sortait par l'IP dynamique de Vercel. FedaPay ne filtre pas par IP
  // aujourd'hui, donc ça passait — mais le jour où elle le fera, la
  // consultation de statut cesserait de répondre sans que rien ne l'explique,
  // et les versements resteraient « en attente » pour toujours.
  const res = await payoutFetch(`${base}/payouts/${encodeURIComponent(payoutId)}`, {
    method: "GET",
    headers: await authHeaders(),
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

export type FedapayErrorCategory =
  | "insufficient_funds"
  | "validation"
  | "network"
  | "not_available"
  /** La requête n'a JAMAIS atteint le fournisseur : basculer est sans danger. */
  | "never_sent"
  | "unknown";

export function classifyFedapayError(
  msg: string,
  err?: unknown,
): { category: FedapayErrorCategory; userMessage: string } {
  // Connexion jamais établie (DNS, refus, proxy injoignable) : la requête n'a
  // pas atteint le fournisseur, donc aucun versement n'a pu partir. On peut
  // essayer une autre passerelle sans risquer de payer deux fois.
  if (err instanceof PayoutNeverSentError) {
    return {
      category: "never_sent",
      userMessage: `FedaPay n'a pas pu être contacté (${err.code}). Une autre passerelle va être essayée.`,
    };
  }
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
      // Ce refus n'est PAS une panne : le compte fonctionne, mais FedaPay n'a
      // pas encore ouvert le décaissement dessus. Le dire explicitement evite
      // de chercher une erreur technique la ou il n'y en a pas — et donne
      // l'action a mener, qui n'est pas de notre cote.
      userMessage:
        "FedaPay n'a pas encore activé le décaissement sur votre compte. " +
        "Ce n'est pas une panne : demandez-leur l'activation des versements " +
        "(support ou votre gestionnaire de compte). Le retrait pourra être " +
        "relancé ensuite, ou réglé manuellement d'ici là.",
    };
  }
  if (lower.includes("invalid") || lower.includes("validation") || lower.includes("phone") || lower.includes("mode")) {
    return {
      category: "validation",
      userMessage: `Erreur de validation FedaPay : ${msg}. Vérifiez le numéro, l'opérateur et le montant.`,
    };
  }
  if (lower.includes("timeout") || lower.includes("econnrefused") || lower.includes("fetch failed") || lower.includes("502") || lower.includes("503")) {
    // Le code système est conservé dans le message : sans lui, impossible de
    // distinguer une panne de proxy d'une panne de fournisseur — c'est ce qui
    // a rendu l'incident du 4 août 2026 illisible pendant des heures.
    const code = codeSysteme(err);
    return {
      category: "network",
      userMessage: `FedaPay est temporairement injoignable${code ? ` (${code})` : ""}. Réessayez.`,
    };
  }
  return { category: "unknown", userMessage: `Erreur FedaPay : ${msg}` };
}

/** Normalise un statut FedaPay vers le vocabulaire interne. */
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
  const route = routeFor(operator, "fedapay", "collect");
  // Route « hébergée » (carte) : pas de mode de push, l'acheteur est redirigé
  // vers la page sécurisée de FedaPay. Renvoyer un mode ici ferait appeler
  // POST /transactions/hosted, qui n'existe pas.
  if (!route || route.params?.hosted) return null;
  return route.code;
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
  const headers = await authHeaders();

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

  // Endpoint : POST /v1/<mode> — au niveau de la racine, PAS sous
  // /transactions. La forme précédente renvoyait 404 sur chaque encaissement
  // Mobile Money FedaPay. Le corps ne porte QUE le jeton : le numéro vient du
  // client déjà attaché à la transaction créée à l'étape 1.
  const sendRes = await payoutFetch(`${base}/${encodeURIComponent(mode)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ token: tokenJson.token }),
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
/**
 * Statuts d'une TRANSACTION FedaPay (encaissement).
 *
 * À ne pas confondre avec ceux d'un payout : un versement est « sent », un
 * encaissement réussi est « approved ». On interrogeait l'endpoint des
 * versements pour vérifier un encaissement, et on y cherchait « sent » — deux
 * erreurs empilées. Résultat : un paiement bel et bien encaissé restait
 * éternellement « en attente » chez nous, et le produit n'était jamais livré.
 */
/**
 * Statuts d'attente LÉGITIMES, tels que FedaPay les nomme. Les lister permet
 * de distinguer « l'acheteur n'a pas encore confirmé » de « on ne comprend pas
 * la réponse » — deux situations que le repli sur « pending » confondait.
 */
const FEDAPAY_ATTENTE = new Set(["pending", "created", "started", "processing", "sent"]);

export function normalizeFedapayTransactionStatus(s: string | undefined | null): "success" | "failed" | "pending" {
  const v = String(s ?? "").toLowerCase();
  if (v === "approved" || v === "transferred") return "success";
  // « refunded » : l'argent est reparti, il ne faut surtout pas livrer.
  if (v === "declined" || v === "canceled" || v === "cancelled" || v === "refunded") return "failed";

  // Statut ININTELLIGIBLE. On reste sur « pending » — annoncer un échec
  // priverait de son produit un acheteur qui a peut-être payé — mais on le
  // JOURNALISE. Sans cette trace, un statut inconnu était indiscernable d'une
  // attente normale : la réconciliation ne concluait jamais, la page de
  // confirmation tournait jusqu'au délai, et rien n'indiquait pourquoi.
  if (!FEDAPAY_ATTENTE.has(v)) {
    console.error(`[fedapay] statut de transaction inconnu, traité en attente : « ${v || "(vide)"} »`);
  }
  return "pending";
}

/** Statut d'un ENCAISSEMENT. GET /v1/transactions/{id}. */
export async function checkCollectStatus(
  transactionId: string,
): Promise<{ status: "success" | "failed" | "pending"; amount: number | null; raw: unknown }> {
  const base = getBaseUrl();
  const res = await payoutFetch(`${base}/transactions/${encodeURIComponent(transactionId)}`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { message?: string };
  if (!res.ok) {
    throw new Error(json.message || `FedaPay : statut de transaction indisponible (HTTP ${res.status})`);
  }
  // FedaPay enveloppe l'objet sous « v1/transaction ». La forme exacte n'est
  // pas documentée : on accepte aussi « transaction » et la racine nue, plutôt
  // que de rendre « en attente » sur une clé qui aurait changé — c'est ce
  // genre de silence qui laisse une vente encaissée sans livraison.
  const tx = (json["v1/transaction"] ?? json.transaction ?? json) as {
    status?: string;
    amount?: number | string;
  };
  const amount = Number(tx.amount);

  // Aucun champ de statut trouvé, ni sous « v1/transaction », ni sous
  // « transaction », ni à la racine. On journalise la réponse ENTIÈRE : c'est
  // le seul moyen de savoir quelle forme FedaPay renvoie réellement, et donc
  // pourquoi une vente reste bloquée. Le commentaire ci-dessus redoutait ce
  // cas sans jamais le signaler.
  if (tx.status == null) {
    console.error(
      `[fedapay] transaction ${transactionId} sans champ de statut :`,
      JSON.stringify(json).slice(0, 800),
    );
  }

  return {
    status: normalizeFedapayTransactionStatus(tx.status),
    amount: Number.isFinite(amount) ? amount : null,
    raw: json,
  };
}
