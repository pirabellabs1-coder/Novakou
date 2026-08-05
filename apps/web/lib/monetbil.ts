import { payoutFetch } from "@/lib/payout/proxy-fetch";
import { credential, hasCredentials } from "@/lib/payments/credentials";

/**
 * Monetbil — encaissement Mobile Money, principalement Cameroun et zone XAF.
 *
 * Contrat établi par SONDAGE de leur API, champ par champ, puis recoupé avec
 * leur documentation officielle (widget v2.1) :
 *
 *   POST /payment/v1/placePayment   sans `service`      → MISSING_SERVICE
 *                                   sans `phonenumber`  → MISSING_MSISDN
 *                                   avec une fausse clé → SERVICE_NOT_FOUND
 *   POST /payment/v1/checkPayment   → { paymentId, message } même sans clé
 *
 * On a délibérément écarté leur WIDGET (redirection vers
 * `api.monetbil.com/pay/v2.1/<service_key>`) : il emmène l'acheteur sur une
 * page qui n'est pas la nôtre. L'API directe pousse la demande sur son
 * téléphone et il reste chez nous — le même parcours que FeexPay et iPay.
 *
 * ⚠️ AUCUN endpoint de VERSEMENT n'existe sur cette API : onze variantes
 * plausibles répondent toutes 404. Monetbil est donc déclarée en
 * ENCAISSEMENT SEUL tant qu'ils ne nous auront pas communiqué le leur — on
 * n'invente jamais une adresse qui déplace de l'argent.
 */

const MONETBIL_API_BASE = "https://api.monetbil.com";

/** Monetbil est utilisable seulement si la clé de service est fournie. */
export function isMonetbilConfigured(): Promise<boolean> {
  return hasCredentials("monetbil");
}

async function getServiceKey(): Promise<string> {
  const key = await credential("monetbil", "serviceKey");
  if (!key) throw new Error("Clé de service Monetbil absente (admin ou MONETBIL_SERVICE_KEY)");
  return key;
}

export type MonetbilStatus = "success" | "failed" | "pending";

/**
 * Traduit le statut Monetbil vers notre vocabulaire interne.
 *
 * Leur API rend un entier : 0 en cours, 1 réussi, le reste en échec. Traiter
 * un « en cours » comme un échec fermerait une vente que l'acheteur est en
 * train de confirmer sur son téléphone.
 */
export function normalizeMonetbilStatus(s: unknown): MonetbilStatus {
  const n = typeof s === "number" ? s : Number.parseInt(String(s ?? ""), 10);
  if (n === 1) return "success";
  if (n === 0 || Number.isNaN(n)) return "pending";
  return "failed";
}

export type MonetbilCollectResult = {
  reference: string;
  status: MonetbilStatus;
  raw: unknown;
};

/**
 * Lance un encaissement : la demande part sur le téléphone de l'acheteur.
 *
 * `phoneNumber` doit porter l'indicatif pays, chiffres seuls (ex 237690000000).
 */
export async function initCollect(params: {
  amount: number;
  phoneNumber: string;
  /** Notre référence interne — sert au rapprochement et au webhook. */
  paymentRef: string;
  /** Adresse appelée par Monetbil à la confirmation. */
  notifyUrl?: string;
  itemName?: string;
}): Promise<MonetbilCollectResult> {
  const service = await getServiceKey();
  const res = await payoutFetch(`${MONETBIL_API_BASE}/payment/v1/placePayment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      service,
      // Leur API attend `phonenumber` en un seul mot — vérifié par sondage :
      // sans lui, elle répond MISSING_MSISDN.
      phonenumber: params.phoneNumber.replace(/\D/g, ""),
      amount: String(Math.round(params.amount)),
      payment_ref: params.paymentRef,
      ...(params.itemName ? { item_ref: params.itemName.slice(0, 60) } : {}),
      ...(params.notifyUrl ? { notify_url: params.notifyUrl } : {}),
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
    paymentId?: string;
    payment_id?: string;
    transaction_id?: string;
  };

  const reference = json.paymentId || json.payment_id || json.transaction_id || "";
  if (!res.ok || !reference) {
    // On remonte le statut ET le message : « REQUEST_ACCEPTED » sans référence
    // ne veut pas dire la même chose que « SERVICE_NOT_FOUND ».
    throw new Error(
      `${json.status || "MONETBIL_ERROR"} — ${json.message || `HTTP ${res.status}`}`,
    );
  }

  return { reference, status: "pending", raw: json };
}

/** Consulte l'état réel d'un encaissement auprès de Monetbil. */
export async function checkCollectStatus(
  reference: string,
): Promise<{ status: MonetbilStatus; amount: number | null; raw: unknown }> {
  const service = await getServiceKey();
  const res = await payoutFetch(`${MONETBIL_API_BASE}/payment/v1/checkPayment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ service, paymentId: reference }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    transaction?: { status?: number | string; amount?: number | string };
    status?: number | string;
    amount?: number | string;
    message?: string;
  };
  const tx = json.transaction ?? json;
  const brut = tx.amount;
  return {
    status: normalizeMonetbilStatus(tx.status),
    amount: brut == null ? null : Math.round(Number(brut)),
    raw: json,
  };
}

/** Traduit une erreur Monetbil en catégorie exploitable par l'orchestrateur. */
export type MonetbilErrorCategory =
  | "insufficient_funds"
  | "validation"
  | "network"
  | "not_available"
  | "unknown";

export function classifyMonetbilError(
  msg: string,
): { category: MonetbilErrorCategory; userMessage: string } {
  const bas = msg.toLowerCase();
  if (bas.includes("service_not_found") || bas.includes("service not found")) {
    return {
      category: "not_available",
      userMessage: "Monetbil n'est pas configuré pour ce service.",
    };
  }
  if (bas.includes("missing") || bas.includes("invalid")) {
    return {
      category: "validation",
      userMessage: `Erreur de validation Monetbil : ${msg}. Vérifiez le numéro et le montant.`,
    };
  }
  if (bas.includes("insufficient") || bas.includes("balance")) {
    return { category: "insufficient_funds", userMessage: "Solde insuffisant." };
  }
  if (bas.includes("timeout") || bas.includes("fetch failed") || bas.includes("econnrefused")) {
    return { category: "network", userMessage: "Monetbil est temporairement injoignable. Réessayez." };
  }
  return { category: "unknown", userMessage: `Erreur Monetbil : ${msg}` };
}
