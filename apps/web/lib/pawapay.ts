// ═══════════════════════════════════════════════════════════════════════════
// PAWAPAY — encaissement Mobile Money multi-pays.
// ═══════════════════════════════════════════════════════════════════════════
//
// Contrat relevé dans leur documentation publique (docs.pawapay.io, API v2) :
//   POST /v2/deposits              → initier un encaissement
//   GET  /v2/deposits/{depositId}  → constater son état
//   GET  /v2/active-conf           → pays et opérateurs ACTIVÉS sur le compte
//
// ─── POURQUOI AUCUN CODE OPÉRATEUR N'EST ÉCRIT ICI ─────────────────────────
// PawaPay identifie un opérateur par un code du type « MTN_MOMO_BEN » —
// réseau + pays en ISO-3. Le motif est régulier, donc tentant à extrapoler.
// On ne le fait pas : `/v2/active-conf` renvoie la liste exacte de ce que
// NOTRE compte peut encaisser. Une liste devinée serait fausse le jour où
// PawaPay ouvre un pays, et surtout elle proposerait à l'acheteur des
// opérateurs que notre contrat ne couvre pas.
//
// ─── LE MONTANT EST EN DEVISE LOCALE ───────────────────────────────────────
// Leur documentation est explicite : `amount` est exprimé dans la devise de
// l'opérateur, et `currency` doit l'accompagner. Nos prix étant stockés en
// FCFA, tout appel DOIT passer par `montantAFacturer()` — sans quoi un
// produit à 5 000 FCFA vendu en Ouganda débiterait 5 000 UGX, soit environ
// 800 FCFA. C'est le même piège que Monetbil, et il ne laisse aucune trace :
// la vente est « réussie ».

import crypto from "crypto";
import { credential, isSandbox } from "@/lib/payments/credentials";

const BASE_PROD = "https://api.pawapay.io";
const BASE_SANDBOX = "https://api.sandbox.pawapay.io";

/**
 * Le jeton et le mode viennent de l'ADMIN (chiffrés en base), avec repli sur
 * l'environnement — comme toutes les autres passerelles. Les lire ici depuis
 * process.env uniquement aurait oblige a un redeploiement a chaque rotation de
 * jeton, et rendu le reglage admin mensonger.
 */
async function config() {
  const [jeton, bacASable] = await Promise.all([
    credential("pawapay", "apiToken"),
    isSandbox("pawapay"),
  ]);
  if (!jeton) throw new Error("Jeton PawaPay absent (admin ou PAWAPAY_API_TOKEN)");
  return { jeton, base: bacASable ? BASE_SANDBOX : BASE_PROD };
}

export function isPawapayConfigured(): Promise<boolean> {
  return credential("pawapay", "apiToken").then((v) => Boolean(v));
}

async function appel<T>(chemin: string, init?: RequestInit): Promise<T> {
  const { jeton, base } = await config();
  const r = await fetch(`${base}${chemin}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${jeton}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const texte = await r.text();
  let corps: unknown = null;
  try {
    corps = texte ? JSON.parse(texte) : null;
  } catch {
    // Réponse non-JSON : on garde le texte brut pour le diagnostic.
  }
  if (!r.ok) {
    throw new Error(`PawaPay ${chemin} → HTTP ${r.status} : ${texte.slice(0, 300)}`);
  }
  return corps as T;
}

// ─── Couverture réelle du compte ───────────────────────────────────────────

export type PawapayOperateur = {
  /** Code exact attendu par l'API, ex. « MTN_MOMO_BEN ». */
  provider: string;
  /** Pays ISO-3 tel que PawaPay le renvoie, ex. « BEN ». */
  pays: string;
  /** Devise dans laquelle CET opérateur facture. */
  devise: string;
  /** Logo officiel héberg é par PawaPay, s'ils en fournissent un. */
  logo?: string;
};

/**
 * Pays et opérateurs réellement activés sur notre compte.
 *
 * C'est la source de vérité de la couverture : elle vient de PawaPay, pas
 * d'une table que nous tiendrions à jour à la main et qui divergerait.
 */
export async function activeConfiguration(): Promise<PawapayOperateur[]> {
  type Rep = {
    countries?: Array<{
      country?: string;
      providers?: Array<{
        provider?: string;
        logo?: string;
        currencies?: Array<{ currency?: string }>;
      }>;
    }>;
  };
  const rep = await appel<Rep>("/v2/active-conf");
  const out: PawapayOperateur[] = [];
  for (const p of rep.countries ?? []) {
    for (const op of p.providers ?? []) {
      const devise = op.currencies?.[0]?.currency;
      if (p.country && op.provider && devise) {
        out.push({ provider: op.provider, pays: p.country, devise, logo: op.logo });
      }
    }
  }
  return out;
}

// ─── Encaissement ──────────────────────────────────────────────────────────

export type PawapayStatut = "success" | "failed" | "pending";

/**
 * Initie un encaissement.
 *
 * @param amount DÉJÀ converti dans `currency` par `montantAFacturer()`.
 *               Passer un montant en FCFA ici débiterait l'acheteur d'une
 *               somme fausse sans qu'aucune erreur ne le signale.
 */
export async function initCollect(params: {
  provider: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  /** Notre référence interne, pour recoller la transaction. */
  paymentRef: string;
  /** Libellé vu par l'acheteur sur son téléphone — 4 à 22 caractères. */
  customerMessage?: string;
}): Promise<{ reference: string; accepted: boolean; reason?: string }> {
  // PawaPay exige un UUID. Notre référence interne n'en est pas un : on la
  // transmet à part, en `clientReferenceId`, plutôt que de la déformer.
  const depositId = crypto.randomUUID();

  type Rep = {
    depositId?: string;
    status?: "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";
    failureReason?: { failureCode?: string; failureMessage?: string };
  };

  const rep = await appel<Rep>("/v2/deposits", {
    method: "POST",
    body: JSON.stringify({
      depositId,
      payer: {
        type: "MMO",
        accountDetails: { phoneNumber: params.phoneNumber, provider: params.provider },
      },
      // Leur API attend des chaînes, pas des nombres.
      amount: String(Math.round(params.amount)),
      currency: params.currency,
      clientReferenceId: params.paymentRef,
      ...(params.customerMessage
        ? { customerMessage: params.customerMessage.slice(0, 22) }
        : {}),
    }),
  });

  // DUPLICATE_IGNORED signale un renvoi du MÊME depositId : la transaction
  // d'origine suit son cours, ce n'est pas un échec.
  const accepted = rep.status === "ACCEPTED" || rep.status === "DUPLICATE_IGNORED";
  return {
    reference: rep.depositId ?? depositId,
    accepted,
    reason: accepted ? undefined : rep.failureReason?.failureMessage ?? rep.status,
  };
}

/**
 * Constate l'état réel d'un encaissement auprès de PawaPay.
 *
 * Renvoie le montant DANS LA DEVISE DE L'OPÉRATEUR : l'appelant doit le
 * ramener en FCFA (`montantVersFcfa`) avant toute comparaison de prix.
 */
export async function checkCollectStatus(
  reference: string,
): Promise<{ status: PawapayStatut; amount: number | null; currency: string | null }> {
  type Rep = {
    status?: "FOUND" | "NOT_FOUND";
    data?: { status?: string; amount?: string; currency?: string };
  };
  const rep = await appel<Rep>(`/v2/deposits/${encodeURIComponent(reference)}`);

  // Introuvable : surtout pas « échoué ». Une transaction que PawaPay n'a pas
  // encore enregistrée serait déclarée perdue, et l'acheteur privé de son
  // produit alors qu'il a peut-être payé.
  if (rep.status !== "FOUND" || !rep.data) {
    return { status: "pending", amount: null, currency: null };
  }

  const brut = rep.data.amount == null ? null : Number(rep.data.amount);
  const montant = brut != null && Number.isFinite(brut) ? Math.round(brut) : null;

  // IN_RECONCILIATION est un état TRANSITOIRE de leur côté : la traiter comme
  // un échec annulerait des ventes en cours de confirmation.
  switch (rep.data.status) {
    case "COMPLETED":
      return { status: "success", amount: montant, currency: rep.data.currency ?? null };
    case "FAILED":
      return { status: "failed", amount: montant, currency: rep.data.currency ?? null };
    default:
      return { status: "pending", amount: montant, currency: rep.data.currency ?? null };
  }
}

// ─── Versement (décaissement vers un vendeur) ──────────────────────────────
//
// Contrat relevé dans leur documentation : POST /v2/payouts, symétrique du
// dépôt. `GET /v2/payouts/{payoutId}` en donne l'état.

/**
 * Envoie de l'argent vers un compte Mobile Money.
 *
 * @param amount DÉJÀ converti dans `currency` par `montantAFacturer()`.
 *               Ici l'erreur est PIRE qu'à l'encaissement : envoyer un montant
 *               FCFA brut à un vendeur ougandais lui verserait 5 000 UGX au
 *               lieu de ~32 000 — on le paierait six fois moins que son dû, et
 *               le virement serait pourtant marqué réussi.
 */
export async function initPayout(params: {
  provider: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  /** Notre référence interne, pour recoller le versement. */
  payoutRef: string;
  customerMessage?: string;
}): Promise<{ reference: string; accepted: boolean; reason?: string }> {
  const payoutId = crypto.randomUUID();

  type Rep = {
    payoutId?: string;
    status?: "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";
    failureReason?: { failureCode?: string; failureMessage?: string };
  };

  const rep = await appel<Rep>("/v2/payouts", {
    method: "POST",
    body: JSON.stringify({
      payoutId,
      recipient: {
        type: "MMO",
        accountDetails: { phoneNumber: params.phoneNumber, provider: params.provider },
      },
      amount: String(Math.round(params.amount)),
      currency: params.currency,
      clientReferenceId: params.payoutRef,
      ...(params.customerMessage
        ? { customerMessage: params.customerMessage.slice(0, 22) }
        : {}),
    }),
  });

  const accepted = rep.status === "ACCEPTED" || rep.status === "DUPLICATE_IGNORED";
  return {
    reference: rep.payoutId ?? payoutId,
    accepted,
    reason: accepted ? undefined : rep.failureReason?.failureMessage ?? rep.status,
  };
}

/**
 * État réel d'un versement. Mêmes précautions qu'à l'encaissement :
 * NOT_FOUND et IN_RECONCILIATION ne valent pas échec — conclure trop vite
 * ferait rejouer un virement déjà parti.
 */
export async function checkPayoutStatus(
  reference: string,
): Promise<{ status: PawapayStatut; amount: number | null; currency: string | null }> {
  type Rep = {
    status?: "FOUND" | "NOT_FOUND";
    data?: { status?: string; amount?: string; currency?: string };
  };
  const rep = await appel<Rep>(`/v2/payouts/${encodeURIComponent(reference)}`);
  if (rep.status !== "FOUND" || !rep.data) {
    return { status: "pending", amount: null, currency: null };
  }
  const brut = rep.data.amount == null ? null : Number(rep.data.amount);
  const montant = brut != null && Number.isFinite(brut) ? Math.round(brut) : null;
  switch (rep.data.status) {
    case "COMPLETED":
      return { status: "success", amount: montant, currency: rep.data.currency ?? null };
    case "FAILED":
      return { status: "failed", amount: montant, currency: rep.data.currency ?? null };
    default:
      return { status: "pending", amount: montant, currency: rep.data.currency ?? null };
  }
}
