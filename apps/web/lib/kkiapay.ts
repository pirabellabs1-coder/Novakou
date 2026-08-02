// KkiaPay — encaissement.
//
// MODÈLE D'INTÉGRATION DIFFÉRENT des autres passerelles, et c'est structurant :
// KkiaPay n'expose AUCUNE API serveur pour débiter un client. Leur SDK serveur
// ne sait que `verify` et `refund` ; « KkiaPay Direct » n'est qu'un générateur
// de liens de paiement (fonction du tableau de bord, pas une API).
//
// L'encaissement passe donc par leur WIDGET JavaScript, ouvert en fenêtre
// modale SUR notre page (pas une redirection vers un autre domaine) :
//   1. le navigateur ouvre le widget, pré-rempli (montant, téléphone, méthode) ;
//   2. l'acheteur paie dans le widget ;
//   3. le widget renvoie un identifiant de transaction ;
//   4. NOUS le vérifions ici, côté serveur, avant de livrer.
//
// L'étape 4 est non négociable : l'identifiant vient du navigateur, donc d'un
// environnement que l'acheteur contrôle. Livrer sur la seule foi du callback
// laisserait n'importe qui réclamer une commande. Seule la réponse de KkiaPay
// à notre appel authentifié fait foi.

const KKIAPAY_API_BASE = "https://api.kkiapay.me";

function getPrivateKey(): string {
  const k = process.env.KKIAPAY_PRIVATE_KEY;
  if (!k) throw new Error("KKIAPAY_PRIVATE_KEY env var is not set");
  return k;
}
function getSecret(): string {
  const k = process.env.KKIAPAY_SECRET;
  if (!k) throw new Error("KKIAPAY_SECRET env var is not set");
  return k;
}
/** Clé PUBLIQUE — la seule exposable au navigateur (elle ouvre le widget). */
export function getKkiapayPublicKey(): string | null {
  return process.env.KKIAPAY_PUBLIC_KEY?.trim() || null;
}

/** KkiaPay est utilisable si les trois clés sont présentes. */
export function isKkiapayConfigured(): boolean {
  return Boolean(
    process.env.KKIAPAY_PUBLIC_KEY && process.env.KKIAPAY_PRIVATE_KEY && process.env.KKIAPAY_SECRET,
  );
}

export type KkiapayStatus = "success" | "failed" | "pending";

/** Normalise un statut KkiaPay vers le vocabulaire interne. */
export function normalizeKkiapayStatus(s: string | undefined): KkiapayStatus {
  const v = String(s ?? "").toUpperCase();
  if (v === "SUCCESS" || v === "SUCCESSFUL") return "success";
  if (v === "FAILED" || v === "CANCELLED" || v === "CANCELED") return "failed";
  return "pending";
}

export type KkiapayVerifyResult = {
  status: KkiapayStatus;
  /** Montant réellement encaissé — À COMPARER au montant attendu. */
  amount: number | null;
  raw: unknown;
};

/**
 * Vérifie une transaction auprès de KkiaPay.
 *
 * Le montant est remonté explicitement : l'appelant DOIT le comparer à celui
 * de la commande. Sans cette comparaison, un acheteur pourrait payer 100 F via
 * le widget et réclamer un produit à 50 000 F — le widget étant ouvert côté
 * navigateur, son paramètre `amount` n'est pas digne de confiance.
 */
export async function verifyTransaction(transactionId: string): Promise<KkiapayVerifyResult> {
  const res = await fetch(`${KKIAPAY_API_BASE}/api/v1/transactions/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getKkiapayPublicKey() ?? "",
      "x-private-key": getPrivateKey(),
      "x-secret-key": getSecret(),
    },
    body: JSON.stringify({ transactionId }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    status?: string;
    amount?: number | string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message || `KkiaPay verify failed (HTTP ${res.status})`);
  }

  const amount = Number(json.amount);
  return {
    status: normalizeKkiapayStatus(json.status),
    amount: Number.isFinite(amount) ? amount : null,
    raw: json,
  };
}

// ─── CLASSIFICATION D'ERREUR ─────────────────────────────────────────────────

export type KkiapayErrorCategory = "validation" | "network" | "not_available" | "unknown";

export function classifyKkiapayError(msg: string): { category: KkiapayErrorCategory; userMessage: string } {
  const l = msg.toLowerCase();
  if (l.includes("unauthorized") || l.includes("401") || l.includes("403") || l.includes("key")) {
    return { category: "not_available", userMessage: "KkiaPay a refusé nos identifiants." };
  }
  if (l.includes("not found") || l.includes("404")) {
    return { category: "validation", userMessage: "Transaction KkiaPay introuvable." };
  }
  if (l.includes("timeout") || l.includes("fetch failed") || l.includes("502") || l.includes("503")) {
    return { category: "network", userMessage: "KkiaPay est temporairement injoignable." };
  }
  return { category: "unknown", userMessage: `Erreur KkiaPay : ${msg}` };
}
