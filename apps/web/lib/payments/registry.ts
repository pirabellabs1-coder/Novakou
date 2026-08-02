// ═══════════════════════════════════════════════════════════════════════════
// REGISTRE UNIQUE DES MOYENS DE PAIEMENT — encaissement ET versement.
// ═══════════════════════════════════════════════════════════════════════════
//
// POURQUOI : jusqu'ici la connaissance était éclatée en trois endroits qui ne
// se parlaient pas — l'encaissement câblé en dur sur une seule passerelle, les
// codes de versement dans `payout/methods-map.ts`, le catalogue de retrait dans
// `moneroo-payout-methods.ts`. Résultat : un opérateur pouvait être encaissable
// sans être versable (ou l'inverse) sans que rien ne le signale.
//
// Ce fichier est la SOURCE UNIQUE : pour chaque opérateur, qui sait encaisser,
// qui sait reverser, et avec quel code natif.
//
// ─── EXTENSIBLE PAR CONCEPTION ─────────────────────────────────────────────
// Les fournisseurs ne sont PAS codés en dur dans les types : `collect` et
// `payout` sont des dictionnaires ouverts `providerId -> route`. Intégrer une
// nouvelle passerelle demande seulement :
//   1. son module (init/verify), comme lib/moneroo.ts ou lib/feexpay.ts ;
//   2. son entrée dans PROVIDERS ci-dessous ;
//   3. ses codes dans la colonne correspondante des opérateurs qu'elle couvre.
// Aucune signature, aucun type, aucun orchestrateur n'est à modifier.
//
// ─── RÈGLE DE SÛRETÉ (argent réel) ─────────────────────────────────────────
// On n'inscrit QUE des codes CONFIRMÉS par la documentation du fournisseur.
// Absence de code = ce fournisseur est simplement SAUTÉ pour cet opérateur
// dans cette direction. On ne devine JAMAIS un routage : un code inventé
// envoie l'argent sur le mauvais réseau ou casse la transaction.

export type PaymentDirection = "collect" | "payout";

/** Identifiant de passerelle. Volontairement ouvert : toute nouvelle intégration
 *  s'ajoute sans modifier ce type. */
export type ProviderId = string;

export type ProviderRoute = {
  /** Code natif du fournisseur pour cet opérateur, dans cette direction. */
  code: string;
  /** Paramètres propres au fournisseur (endpoint, network, mode…). */
  params?: Record<string, string>;
};

export type ProviderMeta = {
  id: ProviderId;
  label: string;
  /** Directions réellement implémentées côté code aujourd'hui. */
  directions: PaymentDirection[];
  /** Nom des variables d'env requises — sert au diagnostic admin. */
  envVars: string[];
};

/** Passerelles connues du registre. Ajouter ici toute nouvelle intégration. */
export const PROVIDERS: ProviderMeta[] = [
  {
    id: "moneroo",
    label: "Moneroo",
    directions: ["collect", "payout"],
    envVars: ["MONEROO_SECRET_KEY"],
  },
  {
    id: "feexpay",
    label: "FeexPay",
    // Encaissement implémenté (lib/feexpay.ts → initCollect). Endpoints relevés
    // dans le SDK React officiel du fournisseur, leur doc REST n'étant pas
    // publique.
    directions: ["collect", "payout"],
    envVars: ["FEEXPAY_API_KEY", "FEEXPAY_SHOP_ID"],
  },
  {
    id: "fedapay",
    label: "FedaPay",
    // Encaissement implémenté (lib/fedapay.ts → initCollect), d'après la
    // documentation officielle.
    directions: ["collect", "payout"],
    envVars: ["FEDAPAY_SECRET_KEY"],
  },
];

export type OperatorEntry = {
  /** Libellé affiché à l'utilisateur. */
  label: string;
  /** Pays ISO-2 minuscule. */
  country: string;
  /** Devise de l'opérateur. */
  currency: "XOF" | "XAF";
  /** Famille, pour regrouper l'UI (mobile money, carte…). */
  family: "mobile_money" | "card";
  /** providerId → route d'ENCAISSEMENT. Vide = personne n'encaisse. */
  collect: Record<ProviderId, ProviderRoute>;
  /** providerId → route de VERSEMENT. Vide = personne ne reverse. */
  payout: Record<ProviderId, ProviderRoute>;
};

/**
 * Clé = code interne stable de l'opérateur (celui qu'on stocke en base).
 *
 * Sources des codes :
 *  - moneroo.collect : liste officielle des méthodes de paiement Moneroo.
 *  - moneroo.payout  : catalogue de `moneroo-payout-methods.ts`.
 *  - feexpay/fedapay.payout : `payout/methods-map.ts` (codes confirmés doc).
 *  - feexpay.collect  : valeurs du champ `reseau` relevées dans le SDK React
 *    officiel de FeexPay (leur doc REST n'est pas publique).
 *  - fedapay.collect  : SEULS mtn_bj / moov_bj / togocel sont confirmés. Les
 *    autres attendent les codes `mode` exacts du tableau de bord FedaPay —
 *    laissés vides plutôt que devinés (voir la règle de sûreté ci-dessus).
 */
export const OPERATORS: Record<string, OperatorEntry> = {
  // ───────────────────────── Bénin (XOF) ─────────────────────────
  mtn_bj: {
    label: "MTN Mobile Money (Bénin)", country: "bj", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "mtn_bj" }, feexpay: { code: "MTN" }, fedapay: { code: "mtn_open" } },
    payout: {
      moneroo: { code: "mtn_bj" },
      feexpay: { code: "transfer/global", params: { network: "MTN" } },
      fedapay: { code: "mtn_open" },
    },
  },
  moov_bj: {
    label: "Moov Money (Bénin)", country: "bj", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "moov_bj" }, feexpay: { code: "MOOV" }, fedapay: { code: "moov" } },
    payout: {
      moneroo: { code: "moov_bj" },
      feexpay: { code: "transfer/global", params: { network: "MOOV" } },
      fedapay: { code: "moov" },
    },
  },

  // ────────────────────── Côte d'Ivoire (XOF) ─────────────────────
  orange_ci: {
    label: "Orange Money (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "orange_ci" }, feexpay: { code: "ORANGE CI" } },
    payout: { moneroo: { code: "orange_ci" }, feexpay: { code: "orange_ci" } },
  },
  wave_ci: {
    label: "Wave (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "wave_ci" }, feexpay: { code: "WAVE CI" } },
    payout: { moneroo: { code: "wave_ci" }, feexpay: { code: "wave_ci" } },
  },
  mtn_ci: {
    label: "MTN Mobile Money (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "mtn_ci" }, feexpay: { code: "MTN CI" } },
    payout: { moneroo: { code: "mtn_ci" }, feexpay: { code: "mtn_ci" } },
  },
  moov_ci: {
    label: "Moov Money (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "moov_ci" }, feexpay: { code: "MOOV CI" } },
    payout: { moneroo: { code: "moov_ci" }, feexpay: { code: "moov_ci" } },
  },
  djamo_ci: {
    label: "Djamo (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: {}, // pas de shortcode d'encaissement Moneroo confirmé
    payout: { moneroo: { code: "djamo_ci" } },
  },

  // ───────────────────────── Sénégal (XOF) ────────────────────────
  orange_sn: {
    label: "Orange Money (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "orange_sn" }, feexpay: { code: "ORANGE SN" } },
    payout: { moneroo: { code: "orange_sn" }, feexpay: { code: "orange_sn" } },
  },
  wave_sn: {
    label: "Wave (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "wave_sn" } },
    payout: { moneroo: { code: "wave_sn" }, feexpay: { code: "wave_sn" } },
  },
  freemoney_sn: {
    label: "Free Money (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "freemoney_sn" }, feexpay: { code: "FREE SN" } },
    payout: { moneroo: { code: "freemoney_sn" }, feexpay: { code: "free_sn" } },
  },
  e_money_sn: {
    label: "E-Money (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "e_money_sn" } },
    payout: { moneroo: { code: "e_money_sn" } },
  },
  wizall_sn: {
    label: "Wizall (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "wizall_sn" } },
    payout: {}, // encaissable mais PAS versable — asymétrie assumée et visible
  },
  djamo_sn: {
    label: "Djamo (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: {},
    payout: { moneroo: { code: "djamo_sn" } },
  },

  // ────────────────────────── Togo (XOF) ──────────────────────────
  moov_tg: {
    label: "Moov Money (Togo)", country: "tg", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "moov_tg" }, feexpay: { code: "MOOV TG" } },
    payout: {
      moneroo: { code: "moov_tg" },
      feexpay: { code: "togo", params: { network: "MOOV TG" } },
    },
  },
  togocel: {
    label: "Togocel Money (Togo)", country: "tg", currency: "XOF", family: "mobile_money",
    collect: { feexpay: { code: "TOGOCOM TG" }, fedapay: { code: "togocel" } },
    payout: {
      moneroo: { code: "togocel" },
      feexpay: { code: "togo", params: { network: "TOGOCOM TG" } },
      fedapay: { code: "togocel" },
    },
  },

  // ────────────────────────── Mali (XOF) ──────────────────────────
  orange_ml: {
    label: "Orange Money (Mali)", country: "ml", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "orange_ml" } },
    payout: { moneroo: { code: "orange_ml" }, feexpay: { code: "orange_ml" } },
  },
  moov_ml: {
    label: "Moov Money (Mali)", country: "ml", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "moov_ml" } },
    payout: {}, // pas de code de versement confirmé (ni Moneroo, ni FeexPay/FedaPay)
  },

  // ─────────────────────── Burkina Faso (XOF) ─────────────────────
  orange_bf: {
    label: "Orange Money (Burkina Faso)", country: "bf", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "orange_bf" }, feexpay: { code: "ORANGE BF" } },
    payout: {}, // encaissable seulement
  },
  moov_bf: {
    label: "Moov Money (Burkina Faso)", country: "bf", currency: "XOF", family: "mobile_money",
    collect: { moneroo: { code: "moov_bf" }, feexpay: { code: "MOOV BF" } },
    payout: {},
  },

  // ──────────────────────── Cameroun (XAF) ────────────────────────
  // Couvert dans LES DEUX SENS par Moneroo. Le seul blocage à l'ouverture du
  // Cameroun est notre propre `currency: "XOF"` codé en dur au checkout.
  orange_cm: {
    label: "Orange Money (Cameroun)", country: "cm", currency: "XAF", family: "mobile_money",
    collect: { moneroo: { code: "orange_cm" } },
    payout: { moneroo: { code: "orange_cm" } },
  },
  mtn_cm: {
    label: "MTN Mobile Money (Cameroun)", country: "cm", currency: "XAF", family: "mobile_money",
    collect: { moneroo: { code: "mtn_cm" } },
    payout: { moneroo: { code: "mtn_cm" } },
  },

  // ─────────────────────── Cartes bancaires ───────────────────────
  // La carte encaisse par devise, et ne se reverse pas (pas de payout carte).
  card_xof: {
    label: "Carte bancaire (XOF)", country: "", currency: "XOF", family: "card",
    collect: { moneroo: { code: "card_xof" } },
    payout: {},
  },
  card_xaf: {
    label: "Carte bancaire (XAF)", country: "", currency: "XAF", family: "card",
    collect: { moneroo: { code: "card_xaf" } },
    payout: {},
  },
};

// ─────────────────────────── Lecture du registre ───────────────────────────

/** Entrée d'un opérateur, ou null s'il est inconnu. */
export function getOperator(code: string | null | undefined): OperatorEntry | null {
  if (!code) return null;
  return OPERATORS[String(code).trim().toLowerCase()] ?? null;
}

/**
 * Passerelles capables de traiter cet opérateur dans cette direction,
 * accompagnées de leur route native. Ordre = ordre de PROVIDERS (priorité).
 */
export function providersFor(
  operatorCode: string,
  direction: PaymentDirection,
): Array<{ provider: ProviderId; route: ProviderRoute }> {
  const op = getOperator(operatorCode);
  if (!op) return [];
  const routes = direction === "collect" ? op.collect : op.payout;
  return PROVIDERS
    .filter((p) => p.directions.includes(direction) && routes[p.id])
    .map((p) => ({ provider: p.id, route: routes[p.id] }));
}

/** Route native d'un fournisseur pour cet opérateur, ou null s'il ne le couvre pas. */
export function routeFor(
  operatorCode: string,
  provider: ProviderId,
  direction: PaymentDirection,
): ProviderRoute | null {
  const op = getOperator(operatorCode);
  if (!op) return null;
  return (direction === "collect" ? op.collect : op.payout)[provider] ?? null;
}

/** Vrai si au moins une passerelle sait traiter cet opérateur dans ce sens. */
export function isSupported(operatorCode: string, direction: PaymentDirection): boolean {
  return providersFor(operatorCode, direction).length > 0;
}

/** Opérateurs filtrables par direction / devise / pays — pour construire les UI. */
export function listOperators(opts: {
  direction: PaymentDirection;
  currency?: "XOF" | "XAF";
  country?: string;
  family?: OperatorEntry["family"];
}): Array<{ code: string } & OperatorEntry> {
  const country = opts.country?.trim().toLowerCase();
  return Object.entries(OPERATORS)
    .filter(([code, op]) => {
      if (!isSupported(code, opts.direction)) return false;
      if (opts.currency && op.currency !== opts.currency) return false;
      if (opts.family && op.family !== opts.family) return false;
      // Les cartes n'ont pas de pays : elles restent proposées quel que soit le filtre.
      if (country && op.country && op.country !== country) return false;
      return true;
    })
    .map(([code, op]) => ({ code, ...op }));
}

/**
 * Opérateurs encaissables mais NON versables (et l'inverse).
 * Sert au diagnostic : c'est exactement l'angle mort qui existait avant ce
 * registre — accepter l'argent d'un canal par lequel on ne peut pas le rendre.
 */
export function coverageGaps(): {
  collectOnly: string[];
  payoutOnly: string[];
} {
  const collectOnly: string[] = [];
  const payoutOnly: string[] = [];
  for (const code of Object.keys(OPERATORS)) {
    const c = isSupported(code, "collect");
    const p = isSupported(code, "payout");
    if (c && !p) collectOnly.push(code);
    if (p && !c) payoutOnly.push(code);
  }
  return { collectOnly, payoutOnly };
}

// ─── Codes génériques des écrans de paiement ────────────────────────────────
//
// Les écrans de checkout historiques envoient un code d'OPÉRATEUR GÉNÉRIQUE
// ("orange_money", "wave"…), alors que ce registre est indexé par opérateur
// PAYS PAR PAYS ("orange_ci", "wave_sn"…) — parce que chaque pays a son propre
// code chez les fournisseurs.
//
// Sans traduction, toute résolution échouait et le paiement retombait
// systématiquement sur la passerelle historique : le routage ne servait à rien.

/** Préfixe téléphonique international → pays ISO-2. */
const DIAL_TO_COUNTRY: Record<string, string> = {
  "229": "bj", "221": "sn", "225": "ci", "237": "cm",
  "228": "tg", "223": "ml", "226": "bf",
};

/** Famille d'opérateur d'un code générique (préfixe des clés du registre). */
const GENERIC_FAMILY: Record<string, string> = {
  orange_money: "orange", orange: "orange",
  wave: "wave",
  mtn_momo: "mtn", mtn: "mtn",
  moov_money: "moov", moov: "moov",
  free_money: "freemoney", freemoney: "freemoney",
  e_money: "e_money",
  wizall: "wizall",
  djamo: "djamo",
};

/** Déduit le pays depuis un numéro international (chiffres, avec indicatif). */
export function countryFromPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  for (const [dial, country] of Object.entries(DIAL_TO_COUNTRY)) {
    if (digits.startsWith(dial)) return country;
  }
  return null;
}

/**
 * Traduit ce que le checkout envoie en une clé d'opérateur du registre.
 *
 * Accepte déjà un code précis ("orange_ci") et le renvoie tel quel. Sinon,
 * combine le code générique avec le pays — déduit du paramètre `country`, à
 * défaut du numéro de téléphone.
 *
 * Renvoie null si on ne peut pas trancher : l'appelant retombe alors sur le
 * chemin historique. Mieux vaut un repli qu'un routage deviné vers le mauvais
 * réseau.
 */
export function resolveOperatorCode(
  raw: string | null | undefined,
  opts: { country?: string | null; phone?: string | null; currency?: "XOF" | "XAF" } = {},
): string | null {
  const code = (raw ?? "").trim().toLowerCase();
  if (!code) return null;

  // Déjà un opérateur connu du registre.
  if (OPERATORS[code]) return code;

  const country = (opts.country ?? "").trim().toLowerCase() || countryFromPhone(opts.phone);

  // La carte dépend de la devise, pas du pays.
  if (code === "card" || code === "carte") {
    const cur = opts.currency ?? (country === "cm" ? "XAF" : "XOF");
    return OPERATORS[`card_${cur.toLowerCase()}`] ? `card_${cur.toLowerCase()}` : null;
  }

  const family = GENERIC_FAMILY[code];
  if (!family || !country) return null;

  // Un seul opérateur doit correspondre à (famille, pays) — sinon on s'abstient.
  const matches = Object.entries(OPERATORS).filter(
    ([key, op]) => op.country === country && key.startsWith(family + "_"),
  );
  return matches.length === 1 ? matches[0][0] : null;
}
