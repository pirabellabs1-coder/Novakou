/**
 * Catalogue des méthodes de retrait Moneroo par pays.
 *
 * Ce fichier définit :
 *   - Les méthodes disponibles (Mobile Money, banque, e-wallet…)
 *   - Les pays où chaque méthode est supportée
 *   - Les champs requis dans `method_details` (phone / iban / email / …)
 *   - Les limites min / max par méthode (garde-fous contre les erreurs de saisie)
 *
 * Source : https://docs.moneroo.io/api/payouts/supported-methods
 * Les codes méthode doivent correspondre EXACTEMENT à ceux attendus par Moneroo.
 */

export type PayoutField = "phone" | "iban" | "bic" | "bank_name" | "account_holder" | "email";

export interface PayoutMethodDef {
  /** Code Moneroo — passé tel quel à initPayout */
  id: string;
  /** Libellé affiché à l'utilisateur */
  label: string;
  /** Icône emoji ou material-symbol */
  icon: string;
  /** Devise (XOF, XAF, EUR, USD) */
  currency: string;
  /** Pays (codes ISO-2) où la méthode est utilisable */
  countries: string[];
  /** Champs requis dans method_details (envoyés à Moneroo) */
  requiredFields: PayoutField[];
  /** Placeholder pour le champ principal */
  placeholder: Record<PayoutField, string>;
  /** Montant minimum supporté (dans la devise) */
  minAmount: number;
  /** Délai de traitement indicatif */
  processingTime: string;
  /** Catégorie pour grouper l'affichage */
  category: "mobile_money" | "bank" | "international";
}

export const PAYOUT_METHODS: PayoutMethodDef[] = [
  // ─── Sénégal ─────────────────────────────────────────────
  {
    id: "wave_sn",
    label: "Wave (Sénégal)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    requiredFields: ["phone"],
    placeholder: { phone: "+221 77 123 45 67", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Instantané — quelques minutes",
    category: "mobile_money",
  },
  {
    id: "orange_money_sn",
    label: "Orange Money (Sénégal)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    requiredFields: ["phone"],
    placeholder: { phone: "+221 77 123 45 67", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "free_money_sn",
    label: "Free Money (Sénégal)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    requiredFields: ["phone"],
    placeholder: { phone: "+221 77 123 45 67", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Côte d'Ivoire ───────────────────────────────────────
  {
    id: "wave_ci",
    label: "Wave (Côte d'Ivoire)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    requiredFields: ["phone"],
    placeholder: { phone: "+225 07 12 34 56 78", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Instantané",
    category: "mobile_money",
  },
  {
    id: "orange_money_ci",
    label: "Orange Money (Côte d'Ivoire)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    requiredFields: ["phone"],
    placeholder: { phone: "+225 07 12 34 56 78", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
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
    requiredFields: ["phone"],
    placeholder: { phone: "+225 05 12 34 56 78", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
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
    requiredFields: ["phone"],
    placeholder: { phone: "+225 01 12 34 56 78", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Bénin ───────────────────────────────────────────────
  {
    id: "mtn_bj",
    label: "MTN Mobile Money (Bénin)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BJ"],
    requiredFields: ["phone"],
    placeholder: { phone: "+229 90 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
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
    requiredFields: ["phone"],
    placeholder: { phone: "+229 94 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "celtis_bj",
    label: "Celtis Cash (Bénin)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BJ"],
    requiredFields: ["phone"],
    placeholder: { phone: "+229 90 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Togo ────────────────────────────────────────────────
  {
    id: "tmoney_tg",
    label: "T-Money (Togo)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["TG"],
    requiredFields: ["phone"],
    placeholder: { phone: "+228 90 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "flooz_tg",
    label: "Flooz (Togo)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["TG"],
    requiredFields: ["phone"],
    placeholder: { phone: "+228 90 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Mali ────────────────────────────────────────────────
  {
    id: "orange_money_ml",
    label: "Orange Money (Mali)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["ML"],
    requiredFields: ["phone"],
    placeholder: { phone: "+223 70 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "moov_ml",
    label: "Moov Money (Mali)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["ML"],
    requiredFields: ["phone"],
    placeholder: { phone: "+223 70 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Burkina Faso ────────────────────────────────────────
  {
    id: "orange_money_bf",
    label: "Orange Money (Burkina)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BF"],
    requiredFields: ["phone"],
    placeholder: { phone: "+226 70 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "moov_bf",
    label: "Moov Money (Burkina)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BF"],
    requiredFields: ["phone"],
    placeholder: { phone: "+226 70 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Niger ───────────────────────────────────────────────
  {
    id: "orange_money_ne",
    label: "Orange Money (Niger)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["NE"],
    requiredFields: ["phone"],
    placeholder: { phone: "+227 90 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "airtel_ne",
    label: "Airtel Money (Niger)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["NE"],
    requiredFields: ["phone"],
    placeholder: { phone: "+227 90 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Cameroun (XAF) ──────────────────────────────────────
  {
    id: "orange_money_cm",
    label: "Orange Money (Cameroun)",
    icon: "phone_iphone",
    currency: "XAF",
    countries: ["CM"],
    requiredFields: ["phone"],
    placeholder: { phone: "+237 6 90 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
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
    requiredFields: ["phone"],
    placeholder: { phone: "+237 6 90 12 34 56", iban: "", bic: "", bank_name: "", account_holder: "", email: "" },
    minAmount: 500,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── International ───────────────────────────────────────
  {
    id: "bank_transfer",
    label: "Virement bancaire",
    icon: "account_balance",
    currency: "XOF", // Moneroo supporte les virements dans plusieurs devises
    countries: ["*"], // Partout
    requiredFields: ["iban", "bic", "bank_name", "account_holder"],
    placeholder: {
      phone: "",
      iban: "FR76 1234 5678 9012 3456 7890 123",
      bic: "BNPAFRPP",
      bank_name: "BNP Paribas",
      account_holder: "Nom Prénom",
      email: "",
    },
    minAmount: 5000,
    processingTime: "1 à 3 jours ouvrés",
    category: "bank",
  },
];

/**
 * Retourne les méthodes de payout disponibles pour un pays donné.
 * Si le pays est inconnu, retourne uniquement les méthodes internationales (bank_transfer).
 */
export function getAvailablePayoutMethods(country: string | null | undefined): PayoutMethodDef[] {
  if (!country) {
    // Sans info pays, on montre tout — l'utilisateur fait le bon choix
    return PAYOUT_METHODS;
  }
  const upper = country.toUpperCase();
  return PAYOUT_METHODS.filter((m) => m.countries.includes("*") || m.countries.includes(upper));
}

/** Retourne la définition d'une méthode par son id. */
export function getPayoutMethod(id: string): PayoutMethodDef | undefined {
  return PAYOUT_METHODS.find((m) => m.id === id);
}

/** Libellé court pour l'UI (ex : "Wave", "MTN Mobile Money"). */
export function shortMethodLabel(id: string): string {
  const m = getPayoutMethod(id);
  if (!m) return id;
  // Retire le nom du pays entre parenthèses
  return m.label.replace(/\s*\([^)]*\)\s*$/, "");
}

/**
 * Mapping des anciens codes (orange_money, wave, mtn…) vers les codes Moneroo exacts
 * selon le pays du vendeur. Utilisé pour migrer les données déjà enregistrées
 * via PaymentSettingsPanel sans casser la compatibilité.
 */
export function resolveLegacyMethod(legacyId: string, country: string | null | undefined): string | null {
  if (!country) return null;
  const upper = country.toUpperCase();
  const map: Record<string, Record<string, string>> = {
    orange_money: {
      SN: "orange_money_sn",
      CI: "orange_money_ci",
      ML: "orange_money_ml",
      BF: "orange_money_bf",
      NE: "orange_money_ne",
      CM: "orange_money_cm",
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
      ML: "moov_ml",
      BF: "moov_bf",
      BJ: "moov_bj",
    },
    moov: {
      CI: "moov_ci",
      ML: "moov_ml",
      BF: "moov_bf",
      BJ: "moov_bj",
    },
    virement: { "*": "bank_transfer" },
    bank_transfer: { "*": "bank_transfer" },
  };
  const perCountry = map[legacyId];
  if (!perCountry) return null;
  return perCountry[upper] || perCountry["*"] || null;
}
