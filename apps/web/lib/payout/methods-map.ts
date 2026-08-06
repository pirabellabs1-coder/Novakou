// Table de correspondance des opérateurs de payout.
//
// Novakou stocke l'opérateur choisi par le bénéficiaire dans le champ `method`
// (codes la passerelle : "mtn_bj", "orange_ci"…) et le numéro dans
// `accountDetails.msisdn`. Pour verser via un AUTRE fournisseur (FeexPay,
// FedaPay), il faut traduire ce code interne vers le code natif du fournisseur.
//
// RÈGLE DE SÛRETÉ : on ne met ici QUE des codes CONFIRMÉS par la documentation
// officielle. Un opérateur sans mapping pour un fournisseur = ce fournisseur est
// tout simplement SAUTÉ par la bascule pour cet opérateur (jamais de routage
// deviné vers un mauvais réseau). Compléter au fil des confirmations.

export type FeexpayRoute = {
  /** Suffixe d'endpoint FeexPay (après /api/payouts/public/). */
  endpoint: string;
  /** Étiquette réseau, seulement pour les endpoints multi-opérateurs. */
  network?: string;
};

export type FedapayRoute = {
  /** Code `mode` FedaPay. */
  mode: string;
};

export type PayoutMethodMapping = {
  /** ISO pays minuscule (pour FedaPay phone_number.country). */
  country: string;
  /** Devise ISO (XOF/XAF…). */
  currency: string;
  /** Route FeexPay, si l'opérateur y est supporté (sinon FeexPay est sauté). */
  feexpay?: FeexpayRoute;
  /** Route FedaPay, si CONFIRMÉE (sinon FedaPay est sauté). */
  fedapay?: FedapayRoute;
};

/**
 * Clé = code interne du moyen (cf. lib/payments/payout-catalog.ts).
 *
 * feexpay : codes relevés dans la doc FeexPay 2026-07 (section API > Payout).
 * fedapay : SEULS mtn_bj/moov_bj/togocel sont confirmés par la doc (exemple
 *           `mode:"mtn_open"` country "bj", plus `moov`, `togocel`). Les autres
 *           attendent confirmation dans le dashboard FedaPay → laissés vides.
 */
export const PAYOUT_METHOD_MAP: Record<string, PayoutMethodMapping> = {
  // ── Bénin (XOF) ──
  mtn_bj: {
    country: "bj", currency: "XOF",
    feexpay: { endpoint: "transfer/global", network: "MTN" },
    fedapay: { mode: "mtn_open" },
  },
  moov_bj: {
    country: "bj", currency: "XOF",
    feexpay: { endpoint: "transfer/global", network: "MOOV" },
    fedapay: { mode: "moov" },
  },
  // Celtiis manquait ICI alors que le registre le declarait reversable par
  // FedaPay : deux tables qui se contredisaient. Le moteur de versement lit
  // celle-ci, donc tout retrait Celtiis etait refuse avec « operateur non servi
  // par cette passerelle » — un message qui accusait la passerelle alors que
  // c'est notre table qui etait incomplete.
  //
  // « sbin » n'est PAS devine : c'est l'identifiant FedaPay confirme de Celtiis,
  // deja utilise a l'encaissement. Et chez FedaPay le meme identifiant sert aux
  // deux sens — mtn_open et moov le montrent. Si leur API le refusait malgre
  // tout, le versement echouerait sans deplacer d'argent : le reseau vise est
  // le bon, seule l'acceptation reste a confirmer par un vrai retrait.
  celtiis_bj: {
    country: "bj", currency: "XOF",
    fedapay: { mode: "sbin" },
  },

  // ── Côte d'Ivoire (XOF) ── (FedaPay : à confirmer)
  mtn_ci:   { country: "ci", currency: "XOF", feexpay: { endpoint: "mtn_ci" } },
  orange_ci:{ country: "ci", currency: "XOF", feexpay: { endpoint: "orange_ci" } },
  moov_ci:  { country: "ci", currency: "XOF", feexpay: { endpoint: "moov_ci" } },
  wave_ci:  { country: "ci", currency: "XOF", feexpay: { endpoint: "wave_ci" } },
  // djamo_ci : ni FeexPay ni FedaPay → seulement la passerelle.
  djamo_ci: { country: "ci", currency: "XOF" },

  // ── Sénégal (XOF) ── (FedaPay : à confirmer)
  orange_sn:   { country: "sn", currency: "XOF", feexpay: { endpoint: "orange_sn" } },
  wave_sn:     { country: "sn", currency: "XOF", feexpay: { endpoint: "wave_sn" } },
  freemoney_sn:{ country: "sn", currency: "XOF", feexpay: { endpoint: "free_sn" } },
  // e_money_sn / djamo_sn : pas d'endpoint FeexPay dédié → la passerelle seul.
  e_money_sn:  { country: "sn", currency: "XOF" },
  djamo_sn:    { country: "sn", currency: "XOF" },

  // ── Togo (XOF) ── (endpoint FeexPay multi-opérateur "togo")
  moov_tg: {
    country: "tg", currency: "XOF",
    feexpay: { endpoint: "togo", network: "MOOV TG" },
  },
  togocel: {
    country: "tg", currency: "XOF",
    feexpay: { endpoint: "togo", network: "TOGOCOM TG" },
    fedapay: { mode: "togocel" },
  },

  // ── Mali (XOF) ── (FedaPay : à confirmer)
  orange_ml: { country: "ml", currency: "XOF", feexpay: { endpoint: "orange_ml" } },

  // ── Cameroun (XAF) ── ni FeexPay ni FedaPay confirmés → la passerelle seul.
  orange_cm: { country: "cm", currency: "XAF" },
  mtn_cm:    { country: "cm", currency: "XAF" },
};

/** Retourne le mapping d'un code interne, ou null si inconnu. */
export function getPayoutMapping(internalMethod: string): PayoutMethodMapping | null {
  return PAYOUT_METHOD_MAP[internalMethod] ?? null;
}

/** Le code interne peut porter le suffixe "_mentor" (retraits mentor). On le retire. */
export function baseMethodCode(method: string): string {
  return method.endsWith("_mentor") ? method.slice(0, -"_mentor".length) : method;
}
