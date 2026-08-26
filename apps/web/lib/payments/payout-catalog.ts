/**
 * Catalogue des moyens de retrait, par pays.
 *
 * Sources :
 *
 * IMPORTANT : les codes méthode sont ceux exigés par l'API la passerelle.
 * Ils sont de la forme `provider_countrycode` (pas de "_money_" dans le nom).
 * Exemple : `orange_ci` (correct) PAS `orange_money_ci` (incorrect).
 *
 * Pour tous les mobile money, le champ `recipient` attendu est :
 *   { msisdn: "221771234567" }   // digits only, international format, SANS le +
 */

import { COUNTRIES } from "@/lib/countries";
import { isSupported } from "@/lib/payments/registry";

export type PayoutField = "msisdn" | "account_number";

export interface PayoutMethodDef {
  /** Code la passerelle — passé tel quel à initPayout */
  id: string;
  /** Libellé affiché à l'utilisateur */
  label: string;
  /** Icône material-symbol */
  icon: string;
  /** Devise (XOF, XAF, KES, TZS, etc.) */
  currency: string;
  /** Pays (codes ISO-2) où la méthode est utilisable */
  countries: string[];
  /** Champs requis dans `recipient` (envoyés à la passerelle) */
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
 * Catalogue HISTORIQUE des moyens de retrait.
 *
 * Il décrit des moyens qui existent dans le monde, pas ceux par lesquels NOUS
 * savons envoyer de l'argent : c'est le registre des passerelles qui en décide,
 * via `getAvailablePayoutMethods`. Les entrées non servables restent ici pour
 * que l'historique des retraits déjà versés garde ses libellés.
 *
 * ⚠️ Ne jamais inventer de code : un code erroné envoie l'argent sur le mauvais
 * réseau. Seuls les codes confirmés par la documentation ou le SDK officiel
 * d'une passerelle ont leur place ici.
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },

  {
    id: "celtiis_bj",
    label: "Celtiis Cash (Bénin)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["BJ"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "22941234567", account_number: "" },
    minAmount: 100,
    processingTime: "Instantané — quelques minutes",
    category: "mobile_money",
  },
  // ─── Niger (XOF) ───────────────────────────────────────
  {
    id: "airtel_ne",
    label: "Airtel Money (Niger)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["NE"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "22790123456", account_number: "" },
    minAmount: 100,
    processingTime: "Instantané — quelques minutes",
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
    minAmount: 100,
    processingTime: "Quelques minutes",
    category: "mobile_money",
  },
  {
    id: "togocel",
    // id `togocel` conservé (routage) ; libellé aligné sur le rebranding
    // Togocel → T-Money (Togocom / « Mixx by Yas »).
    label: "T-Money (Togo)",
    icon: "phone_iphone",
    currency: "XOF",
    countries: ["TG"],
    requiredFields: ["msisdn"],
    placeholder: { msisdn: "22890345020", account_number: "" },
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
    minAmount: 100,
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
/**
 * Vrai si au moins une passerelle ACTIVE sait réellement verser sur ce moyen.
 *
 * Le catalogue ci-dessus est historique : il décrit des moyens qui existent
 * dans le monde, pas ceux par lesquels NOUS pouvons envoyer de l'argent
 * aujourd'hui. Le registre des passerelles, lui, dit la vérité — c'est lui qui
 * fait foi.
 *
 * Sans ce filtre, un vendeur camerounais ou kényan choisissait un moyen que
 * personne ne pouvait payer : sa demande partait, puis restait indéfiniment
 * « en attente » d'une intervention admin. Proposer un moyen qu'on ne sait pas
 * honorer, c'est promettre un versement qu'on ne fera pas.
 */
export function isPayoutMethodServable(methodId: string): boolean {
  return isSupported(methodId, "payout");
}

/**
 * Moyens de retrait réellement disponibles pour un pays.
 *
 * Deux filtres se cumulent, et les deux sont nécessaires :
 *   • le pays du moyen ;
 *   • l'existence d'une route de versement chez une passerelle.
 */
export function getAvailablePayoutMethods(country: string | null | undefined): PayoutMethodDef[] {
  const servables = PAYOUT_METHODS.filter((m) => isPayoutMethodServable(m.id));
  if (!country) return servables;
  const code = resolveCountryCode(country);
  // Pays non reconnu (libellé inconnu) → on montre tout ce qu'on sait verser.
  if (!code) return servables;
  // Pays reconnu → uniquement ses méthodes (peut être vide = pays non couvert).
  return servables.filter((m) => m.countries.includes(code));
}

/**
 * Normalise un pays en code ISO-2. Accepte un code ISO-2 ("BJ") OU un libellé
 * ("Bénin", "benin", "Côte d'Ivoire") — le profil utilisateur stocke le NOM du
 * pays (CountrySelect valueKey="name"), pas le code, d'où la nécessité de
 * résoudre avant de filtrer les méthodes (sinon « Aucune méthode disponible »
 * alors que le pays est bien couvert).
 */
function resolveCountryCode(country: string): string | null {
  const raw = (country ?? "").trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper.length === 2 && COUNTRIES.some((c) => c.code === upper)) return upper;
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  const target = norm(raw);
  const match = COUNTRIES.find((c) => norm(c.name) === target);
  return match?.code ?? null;
}

/** Retourne la définition d'une méthode par son id. */
export function getPayoutMethod(id: string): PayoutMethodDef | undefined {
  return PAYOUT_METHODS.find((m) => m.id === id);
}

/**
 * Un pays est fermé au retrait quand AUCUNE passerelle ne sait y verser.
 *
 * C'était auparavant une liste écrite à la main — Sénégal, Cameroun, Côte
 * d'Ivoire — héritée de l'époque où une seule passerelle existait. Elle est
 * restée en place après l'arrivée de FeexPay et FedaPay : le Sénégal et la
 * Côte d'Ivoire sont donc restés fermés alors qu'on savait parfaitement y
 * envoyer l'argent, et un vendeur ivoirien lisait « bientôt disponible » pour
 * un moyen déjà opérationnel.
 *
 * En le dérivant du registre, la question ne peut plus se reposer : brancher
 * une route ouvre le pays, la retirer le ferme, sans que personne ait à penser
 * à mettre une liste à jour.
 */
export function isPayoutCountryDisabled(country: string | null | undefined): boolean {
  const code = resolveCountryCode(country ?? "");
  // Pays non reconnu (ou aucun encore choisi) → on ne bloque pas : ce serait
  // refuser avant même que la personne ait indiqué où elle veut être payée.
  if (!code) return false;
  const duPays = PAYOUT_METHODS.filter((m) => m.countries.includes(code));
  // `every` sur une liste vide vaut `true` — et c'est bien ce qu'on veut ici :
  // un pays absent du catalogue n'a évidemment aucune route, donc il est fermé.
  return duPays.every((m) => !isPayoutMethodServable(m.id));
}

/**
 * Montant minimum d'un retrait, en FCFA — VALABLE PARTOUT.
 *
 * Il valait 100 côté admin, 1 000 côté vendeur, 5 000 côté mentor et affilié :
 * quatre espaces, trois seuils, aucun ne l'expliquant à l'écran. Un vendeur
 * voyait son bouton grisé sans savoir pourquoi.
 *
 * Une seule valeur, importée partout : elle ne peut plus diverger.
 */
export const MIN_WITHDRAWAL_XOF = 100;

/** Message affiché quand un pays n'a encore aucun moyen de versement. */
export const PAYOUT_DISABLED_MESSAGE =
  "Le retrait vers ce pays n'est pas encore disponible. Nous y travaillons.";

/** Vrai si le moyen vise un pays sans aucune route de versement. */
export function isPayoutMethodDisabled(methodId: string | null | undefined): boolean {
  if (!methodId) return false;
  const m = getPayoutMethod(methodId);
  if (!m) return false;
  return m.countries.some((c) => isPayoutCountryDisabled(c));
}

/** Libellé court pour l'UI (ex : "Wave", "MTN Mobile Money"). */
export function shortMethodLabel(id: string): string {
  const m = getPayoutMethod(id);
  if (!m) return id;
  return m.label.replace(/\s*\([^)]*\)\s*$/, "");
}

/**
 * Table des préfixes téléphoniques internationaux par code pays ISO-2.
 * Utilisée pour convertir un numéro local en format international msisdn.
 */
const COUNTRY_DIAL_CODES: Record<string, string> = {
  BJ: "229", SN: "221", CI: "225", CM: "237", TG: "228", ML: "223",
  KE: "254", TZ: "255", UG: "256", RW: "250", ZM: "260",
  NG: "234", CD: "243", MW: "265", GH: "233",
};

/**
 * Normalise un numéro de téléphone au format `msisdn` international :
 * digits only, international, SANS le + en tête.
 *
 * Si `methodId` est fourni, on détecte le pays via le catalogue et on
 * ajoute le préfixe international si le numéro est en format local.
 *
 * Ex : normalizeMsisdn("57335726", "mtn_bj")  -> "22957335726"
 * Ex : normalizeMsisdn("+229 57 33 57 26")     -> "22957335726"
 * Ex : normalizeMsisdn("22957335726")           -> "22957335726"
 * Ex : normalizeMsisdn("0157335726", "mtn_bj") -> "22957335726"  (strip leading 0, add prefix)
 */
export function normalizeMsisdn(phone: string, methodId?: string): string {
  // Step 1: strip all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Step 2: strip leading "00" (international dialing prefix)
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Step 3: if we know the method, resolve expected country prefix
  if (methodId) {
    const methodDef = getPayoutMethod(methodId);
    if (methodDef && methodDef.countries.length > 0) {
      const countryCode = methodDef.countries[0];
      const dialCode = COUNTRY_DIAL_CODES[countryCode];
      if (dialCode) {
        // On retire l'indicatif s'il est déjà là, on normalise la partie
        // locale, puis on le remet. Sans cette étape, un numéro DÉJÀ préfixé
        // ressortait intact et le préfixe se retrouvait doublé.
        if (digits.startsWith(dialCode)) {
          digits = digits.slice(dialCode.length);
        }

        // ── Bénin : le « 01 » FAIT PARTIE du numéro ─────────────────────────
        // Depuis le passage au plan à 10 chiffres, un numéro béninois s'écrit
        // « 0157335726 » et le « 01 » est OBLIGATOIRE : au national comme à
        // l'international, il ne se retire pas. Le format attendu est donc
        // « 2290157335726 ».
        //
        // On le retirait, sur la foi d'un commentaire hérité de l'ANCIEN plan
        // de numérotation. Résultat : « 22957335726 » — un numéro qui n'existe
        // plus. FeexPay acceptait le versement, puis le transfert échouait, et
        // le motif affiché parlait de « coordonnées à vérifier » alors que le
        // vendeur avait saisi le bon numéro.
        if (countryCode !== "BJ" && digits.startsWith("0")) {
          // Ailleurs, le 0 de tête est un préfixe national qui ne se
          // transporte pas à l'international.
          digits = digits.slice(1);
        }

        digits = dialCode + digits;
      }
    }
  }

  return digits;
}

/**
 * Mapping des anciens codes (orange_money, wave, mtn_momo...) vers les codes
 * la passerelle exacts selon le pays du vendeur. Nécessaire pour migrer les données
 * déjà enregistrées via PaymentSettingsPanel sans casser la compatibilité.
 */
export function resolveLegacyMethod(legacyId: string, country: string | null | undefined): string | null {
  if (!country) return null;
  const upper = country.toUpperCase();
  const map: Record<string, Record<string, string>> = {
    // Anciens codes -> codes officiels des passerelles
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
