/**
 * Catalogue des méthodes de payout PayGenius (GeniusPay).
 *
 * Source : https://pay.genius.ci/docs/payout-api
 *
 * Le payload PayGenius pour un payout exige :
 *   {
 *     destination: {
 *       type: "mobile_money" | "bank_transfer",
 *       provider: "wave" | "orange_money" | "mtn" | "moov",
 *       account: "<phone ou IBAN>",
 *     },
 *     recipient: { name, phone: "+221...", email? },
 *     amount, currency, ...
 *   }
 *
 * IMPORTANT — différences avec Moneroo :
 *   1. PayGenius veut le téléphone bénéficiaire AVEC le `+` en tête (E.164).
 *      Moneroo le voulait SANS le `+` (digits only). On normalise différemment.
 *   2. PayGenius est XOF-natif. Pour les payouts on force XOF.
 *   3. Les codes provider sont génériques (`orange_money`, `mtn`) sans suffixe pays —
 *      PayGenius infère le pays à partir du préfixe téléphone.
 */

export type PayGeniusPayoutField = "msisdn" | "iban";

export type PayGeniusPayoutDestinationType = "mobile_money" | "bank_transfer";
export type PayGeniusPayoutProviderCode = "wave" | "orange_money" | "mtn" | "moov";

export interface PayGeniusPayoutMethodDef {
  /** Code interne stocké côté Novakou (ex: "wave_ci_pg"). On suffixe `_pg` pour
   *  ne pas collisionner avec les codes Moneroo en DB. */
  id: string;
  /** Libellé affiché à l'utilisateur. */
  label: string;
  /** Icône material-symbol. */
  icon: string;
  /** Devise (forcé XOF côté PayGenius). */
  currency: "XOF";
  /** Pays (codes ISO-2). */
  countries: string[];
  /** Type côté PayGenius. */
  destinationType: PayGeniusPayoutDestinationType;
  /** Code provider envoyé à PayGenius dans `destination.provider`. */
  destinationProvider: PayGeniusPayoutProviderCode;
  /** Champs requis dans `recipient`/`destination`. */
  requiredFields: PayGeniusPayoutField[];
  /** Placeholder pour l'UI. */
  placeholder: Record<PayGeniusPayoutField, string>;
  /** Montant minimum supporté (XOF). */
  minAmount: number;
  /** Délai indicatif. */
  processingTime: string;
  /** Catégorie pour grouper l'affichage. */
  category: "mobile_money" | "bank_transfer";
}

/**
 * Catalogue des méthodes PayGenius pour les payouts. Couverture XOF principale
 * (CI / SN / BJ / TG / ML / BF) avec les 4 providers principaux.
 */
export const PAYGENIUS_PAYOUT_METHODS: PayGeniusPayoutMethodDef[] = [
  // ─── Côte d'Ivoire (XOF) ────────────────────────────────────────────────
  {
    id: "wave_ci_pg",
    label: "Wave (Côte d'Ivoire) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    destinationType: "mobile_money",
    destinationProvider: "wave",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+2250709876543", iban: "" },
    minAmount: 200,
    processingTime: "Instantané — quelques minutes",
    category: "mobile_money",
  },
  {
    id: "orange_ci_pg",
    label: "Orange Money (Côte d'Ivoire) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    destinationType: "mobile_money",
    destinationProvider: "orange_money",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+2250709876543", iban: "" },
    minAmount: 200,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "mtn_ci_pg",
    label: "MTN Mobile Money (Côte d'Ivoire) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    destinationType: "mobile_money",
    destinationProvider: "mtn",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+2250709876543", iban: "" },
    minAmount: 200,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "moov_ci_pg",
    label: "Moov Money (Côte d'Ivoire) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["CI"],
    destinationType: "mobile_money",
    destinationProvider: "moov",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+2250709876543", iban: "" },
    minAmount: 200,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Sénégal (XOF) ──────────────────────────────────────────────────────
  {
    id: "wave_sn_pg",
    label: "Wave (Sénégal) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    destinationType: "mobile_money",
    destinationProvider: "wave",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+221771234567", iban: "" },
    minAmount: 200,
    processingTime: "Instantané — quelques minutes",
    category: "mobile_money",
  },
  {
    id: "orange_sn_pg",
    label: "Orange Money (Sénégal) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["SN"],
    destinationType: "mobile_money",
    destinationProvider: "orange_money",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+221771234567", iban: "" },
    minAmount: 200,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Bénin (XOF) ────────────────────────────────────────────────────────
  {
    id: "mtn_bj_pg",
    label: "MTN Mobile Money (Bénin) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BJ"],
    destinationType: "mobile_money",
    destinationProvider: "mtn",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+22951234567", iban: "" },
    minAmount: 200,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "moov_bj_pg",
    label: "Moov Money (Bénin) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BJ"],
    destinationType: "mobile_money",
    destinationProvider: "moov",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+22951234567", iban: "" },
    minAmount: 200,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Togo (XOF) ─────────────────────────────────────────────────────────
  {
    id: "moov_tg_pg",
    label: "Moov Money (Togo) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["TG"],
    destinationType: "mobile_money",
    destinationProvider: "moov",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+22890123456", iban: "" },
    minAmount: 200,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Mali (XOF) ─────────────────────────────────────────────────────────
  {
    id: "orange_ml_pg",
    label: "Orange Money (Mali) — PayGenius",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["ML"],
    destinationType: "mobile_money",
    destinationProvider: "orange_money",
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "+22376123456", iban: "" },
    minAmount: 200,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  // ─── Virement bancaire IBAN (multi-pays) ─────────────────────────────────
  {
    id: "bank_iban_pg",
    label: "Virement bancaire IBAN — PayGenius",
    icon: "account_balance",
    currency: "XOF",
    countries: ["CI", "SN", "BJ", "TG", "ML", "BF"],
    destinationType: "bank_transfer",
    destinationProvider: "wave", // ignoré pour bank_transfer (PayGenius route via banque)
    requiredFields: ["iban"],
    placeholder: { msisdn: "", iban: "FR76 3000 6000 0112 3456 7890 189" },
    minAmount: 1000,
    processingTime: "1-3 jours ouvrés",
    category: "bank_transfer",
  },
];

/** Récupère une méthode par son code. */
export function getPayGeniusPayoutMethod(id: string): PayGeniusPayoutMethodDef | undefined {
  return PAYGENIUS_PAYOUT_METHODS.find((m) => m.id === id);
}

/**
 * Résout un code de méthode legacy/générique (`orange_money`, `wave`, `mtn_momo`,
 * `bank_transfer`, etc.) vers une méthode PayGenius en fonction du pays du vendeur.
 *
 * Retourne `null` si on n'arrive pas à mapper.
 *
 * Cas typiques :
 *   - vendor.method="orange_money", country="CI" → "orange_ci_pg"
 *   - vendor.method="wave",         country="SN" → "wave_sn_pg"
 *   - vendor.method="mtn_momo",     country="BJ" → "mtn_bj_pg"
 *   - vendor.method="bank_transfer"             → "bank_iban_pg" (sans pays)
 *   - vendor.method="wave_sn"                   → "wave_sn_pg" (déjà ciblé)
 */
export function resolvePayGeniusLegacyMethod(rawMethod: string, country: string | null): string | null {
  if (!rawMethod) return null;
  const m = rawMethod.toLowerCase().trim();

  // Si c'est déjà un code _pg, on le retourne tel quel
  if (PAYGENIUS_PAYOUT_METHODS.some((x) => x.id === m)) return m;

  // bank_transfer → IBAN (pays-agnostique)
  if (m === "bank_transfer" || m === "iban" || m === "sepa") return "bank_iban_pg";

  // Mapping famille → provider PayGenius
  const FAMILY: Record<string, PayGeniusPayoutProviderCode> = {
    orange_money: "orange_money",
    orange: "orange_money",
    wave: "wave",
    mtn_momo: "mtn",
    mtn: "mtn",
    moov_money: "moov",
    moov: "moov",
  };
  const provider = FAMILY[m];
  if (!provider || !country) return null;

  // Cherche dans le catalogue une méthode qui matche provider + country
  const match = PAYGENIUS_PAYOUT_METHODS.find(
    (x) => x.destinationProvider === provider && x.countries.includes(country),
  );
  return match ? match.id : null;
}

/** Filtre les méthodes par pays. */
export function getAvailablePayGeniusMethods(country: string | null): PayGeniusPayoutMethodDef[] {
  if (!country) return PAYGENIUS_PAYOUT_METHODS;
  return PAYGENIUS_PAYOUT_METHODS.filter((m) => m.countries.includes(country));
}

/** Libellé court pour notification utilisateur. */
export function shortPayGeniusMethodLabel(id: string): string {
  const m = getPayGeniusPayoutMethod(id);
  return m ? m.label.replace(" — PayGenius", "") : id;
}

/**
 * Normalise un numéro Mobile Money pour PayGenius.
 * PayGenius exige le format E.164 AVEC `+` en tête (ex: "+2250709876543").
 *
 * Cas gérés :
 *  - "+2250709876543"   → "+2250709876543"
 *  - "2250709876543"    → "+2250709876543"
 *  - "0709876543"       → "+2250709876543"  (si on connaît le pays via methodId)
 *  - "07 09 87 65 43"   → "+2250709876543"
 */
export function normalizePayGeniusMsisdn(raw: string, methodId?: string): string {
  if (!raw) return raw;
  // 1. nettoyer espaces / tirets / parenthèses
  const cleaned = raw.replace(/[\s\-().]/g, "");
  // 2. si déjà préfixé "+", garder tel quel après nettoyage
  if (cleaned.startsWith("+")) return cleaned;
  // 3. s'il commence par "00", remplacer par "+"
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  // 4. s'il a déjà un préfixe pays (>= 11 chiffres pour XOF/XAF), juste ajouter "+"
  if (/^\d{11,15}$/.test(cleaned)) return `+${cleaned}`;
  // 5. format local court → on essaie de déduire le pays via methodId
  if (methodId) {
    const m = getPayGeniusPayoutMethod(methodId);
    if (m && m.countries.length > 0) {
      const cc = COUNTRY_DIAL_CODE[m.countries[0]];
      if (cc) {
        // on retire un éventuel zéro initial du numéro local
        const local = cleaned.replace(/^0+/, "");
        return `+${cc}${local}`;
      }
    }
  }
  // 6. fallback : on rend tel quel avec "+" devant
  return `+${cleaned}`;
}

/** Codes téléphoniques internationaux pour les pays supportés. */
const COUNTRY_DIAL_CODE: Record<string, string> = {
  CI: "225",
  SN: "221",
  BJ: "229",
  TG: "228",
  ML: "223",
  BF: "226",
  CM: "237",
  CD: "243",
  GA: "241",
  RW: "250",
  KE: "254",
  UG: "256",
  ZM: "260",
  CG: "242",
  SL: "232",
};
