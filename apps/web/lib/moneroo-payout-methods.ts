/**
 * Catalogue des méthodes de retrait Moneroo par pays.
 *
 * Sources :
 *   - https://docs.moneroo.io/api-reference/payouts/supported-methods
 *   - https://docs.moneroo.io/api-reference/payouts/initialize
 *
 * IMPORTANT : les codes méthode sont ceux exigés par l'API Moneroo.
 * Ils sont de la forme `provider_countrycode` (pas de "_money_" dans le nom).
 * Exemple : `orange_ci` (correct) PAS `orange_money_ci` (incorrect).
 *
 * Pour tous les mobile money, le champ `recipient` attendu est :
 *   { msisdn: "221771234567" }   // digits only, international format, SANS le +
 */

export type PayoutField = "msisdn" | "account_number";

export interface PayoutMethodDef {
  /** Code Moneroo — passé tel quel à initPayout */
  id: string;
  /** Libellé affiché à l'utilisateur */
  label: string;
  /** Icône material-symbol */
  icon: string;
  /** Devise (XOF, XAF, KES, TZS, etc.) */
  currency: string;
  /** Pays (codes ISO-2) où la méthode est utilisable */
  countries: string[];
  /** Champs requis dans `recipient` (envoyés à Moneroo) */
  requiredFields: PayoutField[];
  /** Placeholder pour les champs */
  placeholder: Record<PayoutField, string>;
  /** Montant minimum supporté (dans la devise) */
  minAmount: number;
  /** Délai de traitement indicatif */
  processingTime: string;
  /** Catégorie pour grouper l'affichage */
  category: "mobile_money";
}

/**
 * Catalogue officiel Moneroo — mis à jour depuis docs.moneroo.io.
 * ⚠️ Ne pas inventer de codes, seulement utiliser ceux listés dans la doc.
 * Pour les méthodes non listées (Free Money Côte d'Ivoire, etc.), contacter Moneroo.
 */
export const PAYOUT_METHODS: PayoutMethodDef[] = [
  // ─── Sénégal (XOF) ───────────────────────────────────────
  {
    id: "wave_sn",
    label: "Wave (Sénégal)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "221771234567", account_number: "" },
    minAmount: 500,
    processingTime: "Instantané — quelques minutes",
    category: "mobile_money",
  },
  {
    id: "orange_sn",
    label: "Orange Money (Sénégal)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "221771234567", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "freemoney_sn",
    label: "Free Money (Sénégal)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "221771234567", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "e_money_sn",
    label: "E-Money (Sénégal)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "221771234567", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "djamo_sn",
    label: "Djamo (Sénégal)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "221771234567", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Côte d'Ivoire (XOF) ─────────────────────────────────
  {
    id: "wave_ci",
    label: "Wave (Côte d'Ivoire)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "2250712345678", account_number: "" },
    minAmount: 500,
    processingTime: "Instantané",
    category: "mobile_money",
  },
  {
    id: "orange_ci",
    label: "Orange Money (Côte d'Ivoire)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "2250712345678", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "mtn_ci",
    label: "MTN Mobile Money (Côte d'Ivoire)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "2250512345678", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "moov_ci",
    label: "Moov Money (Côte d'Ivoire)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "2250112345678", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "djamo_ci",
    label: "Djamo (Côte d'Ivoire)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "2250712345678", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Bénin (XOF) ─────────────────────────────────────────
  {
    id: "mtn_bj",
    label: "MTN Mobile Money (Bénin)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BJ"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "22951345020", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "moov_bj",
    label: "Moov Money (Bénin)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BJ"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "22994345020", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Togo (XOF) ──────────────────────────────────────────
  {
    id: "moov_tg",
    label: "Moov Money (Togo)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["TG"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "22890345020", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "togocel",
    label: "Togocel Money (Togo)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["TG"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "22890345020", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Mali (XOF) ──────────────────────────────────────────
  {
    id: "orange_ml",
    label: "Orange Money (Mali)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["ML"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "22370345020", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Cameroun (XAF) ──────────────────────────────────────
  {
    id: "orange_cm",
    label: "Orange Money (Cameroun)",
    icon: "phone_iphone",
    currency: "XAF",
    countries: ["CM"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "237690345020", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "mtn_cm",
    label: "MTN Mobile Money (Cameroun)",
    icon: "phone_iphone",
    currency: "XAF",
    countries: ["CM"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "237670345020", account_number: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Kenya (KES) — M-Pesa ────────────────────────────────
  {
    id: "mpesa_ke",
    label: "M-Pesa (Kenya)",
    icon: "phone_iphone",
    currency: "KES",
    countries: ["KE"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "254712345678", account_number: "" },
    minAmount: 50,
    processingTime: "Instantané",
    category: "mobile_money",
  },

  // ─── Tanzanie (TZS) ──────────────────────────────────────
  {
    id: "mpesa_tz",
    label: "M-Pesa (Tanzanie)",
    icon: "phone_iphone",
    currency: "TZS",
    countries: ["TZ"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "255712345678", account_number: "" },
    minAmount: 500,
    processingTime: "Instantané",
    category: "mobile_money",
  },
  {
    id: "airtel_tz",
    label: "Airtel Money (Tanzanie)",
    icon: "phone_iphone",
    currency: "TZS",
    countries: ["TZ"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "255782345678", account_number: "" },
    minAmount: 500,
    processingTime: "Instantané",
    category: "mobile_money",
  },

  // ─── Autres pays Airtel ─────────────────────────────────
  {
    id: "airtel_ug",
    label: "Airtel Money (Ouganda)",
    icon: "phone_iphone",
    currency: "UGX",
    countries: ["UG"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "256702345678", account_number: "" },
    minAmount: 1000,
    processingTime: "Instantané",
    category: "mobile_money",
  },
  {
    id: "airtel_rw",
    label: "Airtel Money (Rwanda)",
    icon: "phone_iphone",
    currency: "RWF",
    countries: ["RW"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "250782345678", account_number: "" },
    minAmount: 500,
    processingTime: "Instantané",
    category: "mobile_money",
  },
  {
    id: "airtel_zm",
    label: "Airtel Money (Zambie)",
    icon: "phone_iphone",
    currency: "ZMW",
    countries: ["ZM"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "260972345678", account_number: "" },
    minAmount: 5,
    processingTime: "Instantané",
    category: "mobile_money",
  },
];

/**
 * Retourne les méthodes de payout disponibles pour un pays donné.
 * Si le pays est inconnu, retourne toutes les méthodes (l'utilisateur choisit).
 */
export function getAvailablePayoutMethods(country: string | null | undefined): PayoutMethodDef[] {
  if (!country) return PAYOUT_METHODS;
  const upper = country.toUpperCase();
  return PAYOUT_METHODS.filter((m) => m.countries.includes(upper));
}

/** Retourne la définition d'une méthode par son id. */
export function getPayoutMethod(id: string): PayoutMethodDef | undefined {
  return PAYOUT_METHODS.find((m) => m.id === id);
}

/** Libellé court pour l'UI (ex : "Wave", "MTN Mobile Money"). */
export function shortMethodLabel(id: string): string {
  const m = getPayoutMethod(id);
  if (!m) return id;
  return m.label.replace(/\s*\([^)]*\)\s*$/, "");
}

/**
 * Normalise un numéro de téléphone en format `msisdn` Moneroo :
 * digits only, international, SANS le + en tête.
 * Ex : "+221 77 123 45 67" -> "221771234567"
 */
export function normalizeMsisdn(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Mapping des anciens codes (orange_money, wave, mtn_momo...) vers les codes
 * Moneroo exacts selon le pays du vendeur. Nécessaire pour migrer les données
 * déjà enregistrées via PaymentSettingsPanel sans casser la compatibilité.
 */
export function resolveLegacyMethod(legacyId: string, country: string | null | undefined): string | null {
  if (!country) return null;
  const upper = country.toUpperCase();
  const map: Record<string, Record<string, string>> = {
    // Anciens codes -> codes Moneroo officiels
    orange_money: {
      SN: "orange_sn",
      CI: "orange_ci",
      ML: "orange_ml",
      CM: "orange_cm",
    },
    orange: {
      SN: "orange_sn",
      CI: "orange_ci",
      ML: "orange_ml",
      CM: "orange_cm",
    },
    wave: {
      SN: "wave_sn",
      CI: "wave_ci",
    },
    mtn_momo: {
      CI: "mtn_ci",
      BJ: "mtn_bj",
      CM: "mtn_cm",
    },
    mtn: {
      CI: "mtn_ci",
      BJ: "mtn_bj",
      CM: "mtn_cm",
    },
    moov_money: {
      CI: "moov_ci",
      BJ: "moov_bj",
      TG: "moov_tg",
    },
    moov: {
      CI: "moov_ci",
      BJ: "moov_bj",
      TG: "moov_tg",
    },
    free_money: { SN: "freemoney_sn" },
    freemoney: { SN: "freemoney_sn" },
  };
  const perCountry = map[legacyId];
  if (!perCountry) return null;
  return perCountry[upper] || null;
}
