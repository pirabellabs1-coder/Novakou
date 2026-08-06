// ═══════════════════════════════════════════════════════════════════════════
// REGISTRE UNIQUE DES MOYENS DE PAIEMENT — encaissement ET versement.
// ═══════════════════════════════════════════════════════════════════════════
//
// Novakou agrège lui-même ses passerelles. Pour chaque opérateur : qui sait
// encaisser, qui sait reverser, et avec quel code natif.
//
// ─── MONEROO EST RETIRÉ (décision fondateur, définitive) ───────────────────
// la passerelle n'est PAS un moyen de paiement, c'est un intermédiaire posé au-dessus
// de comptes marchands qui nous appartiennent déjà. Il ne doit apparaître nulle
// part : ni comme passerelle, ni comme route, ni comme repli silencieux.
// Conséquence assumée : un opérateur qu'aucune passerelle branchée ne couvre
// n'est tout simplement PAS proposé — plutôt que d'être discrètement renvoyé
// vers un tiers dont on veut sortir.
//
// ─── EXTENSIBLE PAR CONCEPTION ─────────────────────────────────────────────
// Les fournisseurs ne sont pas codés en dur dans les types : `collect` et
// `payout` sont des dictionnaires ouverts `providerId -> route`. Intégrer une
// passerelle demande son module, une entrée dans PROVIDERS, et ses codes dans
// les opérateurs qu'elle couvre. Aucun type ni orchestrateur à modifier.
//
// ─── RÈGLE DE SÛRETÉ (argent réel) ─────────────────────────────────────────
// On n'inscrit QUE des codes CONFIRMÉS par la documentation du fournisseur.
// Absence de code = fournisseur SAUTÉ pour cet opérateur dans cette direction.
// On ne devine JAMAIS un routage : un code inventé envoie l'argent sur le
// mauvais réseau ou casse la transaction.

// La devise d'un opérateur vient du même endroit que celle de l'affichage :
// deux tables distinctes finiraient par diverger, et l'écart se paierait en
// montants débités faux.
import type { CodeDevise } from "@/lib/currency/rates";

export type PaymentDirection = "collect" | "payout";

/** Identifiant de passerelle. Ouvert : toute intégration s'ajoute sans toucher au type. */
export type ProviderId = string;

export type ProviderRoute = {
  /** Code natif du fournisseur pour cet opérateur, dans cette direction. */
  code: string;
  /** Paramètres propres au fournisseur (endpoint, réseau, mode, pays…). */
  params?: Record<string, string>;
};

/**
 * Comment la passerelle encaisse concrètement :
 *  - "server" : on débite depuis notre serveur (push sur le téléphone).
 *               L'acheteur ne voit que NOTRE interface.
 *  - "widget" : le paiement passe par le script du fournisseur, ouvert en
 *               fenêtre modale SUR notre page. L'acheteur reste sur notre
 *               domaine, mais l'étape de paiement affiche leur interface.
 *               La transaction DOIT être revérifiée côté serveur : son
 *               identifiant vient du navigateur, donc de l'acheteur.
 */
export type CollectIntegration = "server" | "widget";

export type ProviderMeta = {
  id: ProviderId;
  label: string;
  /** Directions réellement implémentées côté code. */
  directions: PaymentDirection[];
  /** Mode d'encaissement — détermine comment payment/init doit s'y prendre. */
  collectIntegration?: CollectIntegration;
  /** Variables d'environnement requises — sert au diagnostic admin. */
  envVars: string[];
};

/** Passerelles connues. Ajouter ici toute nouvelle intégration. */
export const PROVIDERS: ProviderMeta[] = [
  {
    id: "feexpay",
    label: "FeexPay",
    // Encaissement : endpoints relevés dans le SDK React officiel du
    // fournisseur (leur documentation REST n'est pas publique).
    directions: ["collect", "payout"],
    collectIntegration: "server",
    envVars: ["FEEXPAY_API_KEY", "FEEXPAY_SHOP_ID"],
  },
  {
    id: "fedapay",
    label: "FedaPay",
    // Encaissement et versement d'après la documentation officielle.
    directions: ["collect", "payout"],
    collectIntegration: "server",
    envVars: ["FEDAPAY_SECRET_KEY"],
  },
  {
    id: "kkiapay",
    label: "KkiaPay",
    // Encaissement UNIQUEMENT par widget : KkiaPay n'expose aucune API serveur
    // pour débiter un client (leur SDK serveur ne fait que verify/refund, et
    // « KkiaPay Direct » n'est qu'un générateur de liens). Aucun versement
    // documenté non plus. Apporte la carte bancaire, que les autres ne
    // couvrent pas encore chez nous.
    directions: ["collect"],
    collectIntegration: "widget",
    envVars: ["KKIAPAY_PUBLIC_KEY", "KKIAPAY_PRIVATE_KEY", "KKIAPAY_SECRET"],
  },
  {
    id: "monetbil",
    label: "Monetbil",
    // Cameroun et zone XAF — la region que nos autres passerelles ne servent
    // pas. Contrat etabli par sondage de leur API puis recoupe avec leur
    // documentation officielle : POST /payment/v1/placePayment (service,
    // phonenumber, amount) et POST /payment/v1/checkPayment.
    //
    // ENCAISSEMENT SEUL : onze variantes d'endpoint de versement testees
    // repondent toutes 404. On n'invente pas une adresse qui deplace de
    // l'argent — a activer quand Monetbil nous communiquera la leur.
    //
    // Comme iPay, le fournisseur route lui-meme vers le bon operateur a partir
    // du NUMERO : un seul code « mobile », sans table par reseau.
    directions: ["collect"],
    collectIntegration: "server",
    envVars: ["MONETBIL_SERVICE_KEY"],
  },
  {
    id: "pawapay",
    label: "PawaPay",
    // Agregateur Mobile Money multi-pays. Contrat releve dans leur
    // documentation publique (API v2) : POST /v2/deposits, GET /v2/deposits/{id}.
    //
    // Codes releves dans leur documentation officielle (v2/docs/providers),
    // JAMAIS extrapoles du motif « MTN_MOMO_BEN » — un code invente envoie
    // l'argent sur le mauvais reseau. Recoupes avec GET /v2/active-conf, qui
    // dit ce que NOTRE compte couvre reellement.
    //
    // Couvre 18 pays. Les neuf hors zone franc - Ghana, Kenya, Malawi,
    // Mozambique, Nigeria, Rwanda, Sierra Leone, Tanzanie, Zambie - ont
    // desormais leur taux dans la table de conversion : sans lui,
    // montantAFacturer() refusait la vente, et c'est ce qui les tenait fermes.
    //
    // Priorite 100 (reglee en admin) : PawaPay passe APRES les passerelles
    // eprouvees. Il sert de secours tant qu'aucun paiement reel ne l'a valide.
    // VERSEMENT active : compte verifie et actif cote PawaPay, et leur contrat
    // POST /v2/payouts est documente. C'est notre PREMIERE passerelle capable
    // de reverser hors zone franc - jusqu'ici aucune ne le savait.
    directions: ["collect", "payout"],
    collectIntegration: "server",
    envVars: ["PAWAPAY_API_TOKEN"],
  },
  {
    id: "ipaymoney",
    label: "iPay Money",
    // Niger. Encaissement mobile money et carte (VISA / Mastercard /
    // GIM-UEMOA). Endpoints confirmés par sonde : POST /api/v1/payments et
    // GET /api/v1/payments/{ref}. Aucun versement documenté à ce jour.
    // Particularité : le fournisseur route lui-même vers le bon opérateur à
    // partir du NUMÉRO — d'où un seul code « mobile », sans table par réseau.
    directions: ["collect"],
    collectIntegration: "server",
    envVars: ["IPAYMONEY_SECRET_KEY"],
  },
];

export type OperatorEntry = {
  label: string;
  /** Pays ISO-2 minuscule. Vide pour la carte (rattachée à une devise). */
  country: string;
  currency: CodeDevise;
  family: "mobile_money" | "card";
  /** providerId → route d'ENCAISSEMENT. Vide = personne n'encaisse. */
  collect: Record<ProviderId, ProviderRoute>;
  /** providerId → route de VERSEMENT. Vide = personne ne reverse. */
  payout: Record<ProviderId, ProviderRoute>;
};

/**
 * Clé = code interne stable de l'opérateur (celui stocké en base).
 *
 * Sources des codes :
 *  - feexpay.collect : valeurs du champ `reseau` du SDK React officiel.
 *  - feexpay.payout  : endpoints confirmés (payout/methods-map.ts).
 *  - fedapay         : SEULS mtn_bj / moov_bj / togocel confirmés ; les autres
 *                      attendent les codes `mode` du tableau de bord FedaPay.
 *  - kkiapay.collect : KkiaPay ne documente que MTN Mobile Money, Moov Money
 *                      et les cartes Visa/Mastercard — rien d'autre n'est
 *                      inscrit ici.
 *
 * Les opérateurs sans aucune route sont CONSERVÉS volontairement : ils
 * documentent ce qui existe mais n'est pas encore couvert, et alimentent
 * coverageGaps(). Ils ne sont jamais proposés à l'acheteur.
 */
export const OPERATORS: Record<string, OperatorEntry> = {
  // ───────────────────────── Bénin (XOF) ─────────────────────────
  mtn_bj: {
    label: "MTN Mobile Money (Bénin)", country: "bj", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "MTN_MOMO_BEN" },
      feexpay: { code: "MTN" },
      fedapay: { code: "mtn_open" },
      kkiapay: { code: "momo", params: { country: "BJ" } },
    },
    payout: {
      feexpay: { code: "transfer/global", params: { network: "MTN" } },
      fedapay: { code: "mtn_open" },
    },
  },
  moov_bj: {
    label: "Moov Money (Bénin)", country: "bj", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "MOOV_BEN" },
      feexpay: { code: "MOOV" },
      fedapay: { code: "moov" },
      kkiapay: { code: "momo", params: { country: "BJ" } },
    },
    payout: {
      feexpay: { code: "transfer/global", params: { network: "MOOV" } },
      fedapay: { code: "moov" },
    },
  },
  celtiis_bj: {
    label: "Celtiis Cash (Bénin)", country: "bj", currency: "XOF", family: "mobile_money",
    collect: {
      feexpay: { code: "CELTIIS BJ" },
      fedapay: { code: "sbin" },
      kkiapay: { code: "momo", params: { country: "BJ" } },
    },
    payout: { fedapay: { code: "sbin" } },
  },
  coris_bj: {
    label: "Coris Money (Bénin)", country: "bj", currency: "XOF", family: "mobile_money",
    collect: { feexpay: { code: "CORIS" } },
    // Versement Coris non listé côté FeexPay : on n'invente pas d'endpoint.
    payout: {},
  },

  // ────────────────────── Côte d'Ivoire (XOF) ─────────────────────
  orange_ci: {
    label: "Orange Money (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "ORANGE_CIV" }, feexpay: { code: "ORANGE CI" }, kkiapay: { code: "momo", params: { country: "CI" } } },
    payout: { feexpay: { code: "orange_ci" } },
  },
  wave_ci: {
    label: "Wave (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "WAVE_CIV" }, feexpay: { code: "WAVE CI" }, kkiapay: { code: "momo", params: { country: "CI" } } },
    payout: { feexpay: { code: "wave_ci" } },
  },
  mtn_ci: {
    label: "MTN Mobile Money (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "MTN_MOMO_CIV" },
      feexpay: { code: "MTN CI" },
      fedapay: { code: "mtn_ci" },
      kkiapay: { code: "momo", params: { country: "CI" } },
    },
    payout: { feexpay: { code: "mtn_ci" }, fedapay: { code: "mtn_ci" } },
  },
  moov_ci: {
    label: "Moov Money (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: { feexpay: { code: "MOOV CI" }, kkiapay: { code: "momo", params: { country: "CI" } } },
    payout: { feexpay: { code: "moov_ci" } },
  },
  djamo_ci: {
    label: "Djamo (Côte d'Ivoire)", country: "ci", currency: "XOF", family: "mobile_money",
    collect: {},
    payout: {},
  },

  // ───────────────────────── Sénégal (XOF) ────────────────────────
  orange_sn: {
    label: "Orange Money (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "ORANGE_SEN" }, feexpay: { code: "ORANGE SN" }, kkiapay: { code: "momo", params: { country: "SN" } } },
    payout: { feexpay: { code: "orange_sn" } },
  },
  wave_sn: {
    label: "Wave (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    // « WAVE SN » n'apparaît pas dans le SDK FeexPay ; KkiaPay sert le Sénégal.
    collect: {
      pawapay: { code: "WAVE_SEN" }, kkiapay: { code: "momo", params: { country: "SN" } } },
    payout: { feexpay: { code: "wave_sn" } },
  },
  freemoney_sn: {
    label: "Free Money (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "FREE_SEN" },
      feexpay: { code: "FREE SN" },
      fedapay: { code: "free_sn" },
      kkiapay: { code: "momo", params: { country: "SN" } },
    },
    payout: { feexpay: { code: "free_sn" }, fedapay: { code: "free_sn" } },
  },
  e_money_sn: {
    label: "E-Money (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: {},
    payout: {},
  },
  wizall_sn: {
    label: "Wizall (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: {},
    payout: {},
  },
  djamo_sn: {
    label: "Djamo (Sénégal)", country: "sn", currency: "XOF", family: "mobile_money",
    collect: {},
    payout: {},
  },

  // ────────────────────────── Togo (XOF) ──────────────────────────
  moov_tg: {
    label: "Moov Money (Togo)", country: "tg", currency: "XOF", family: "mobile_money",
    collect: {
      feexpay: { code: "MOOV TG" },
      fedapay: { code: "moov_tg" },
      kkiapay: { code: "momo", params: { country: "TG" } },
    },
    payout: {
      feexpay: { code: "togo", params: { network: "MOOV TG" } },
      fedapay: { code: "moov_tg" },
    },
  },
  togocel: {
    label: "Togocel Money (Togo)", country: "tg", currency: "XOF", family: "mobile_money",
    collect: {
      feexpay: { code: "TOGOCOM TG" },
      fedapay: { code: "togocel" },
      kkiapay: { code: "momo", params: { country: "TG" } },
    },
    payout: {
      feexpay: { code: "togo", params: { network: "TOGOCOM TG" } },
      fedapay: { code: "togocel" },
    },
  },

  // ────────────────────────── Mali (XOF) ──────────────────────────
  orange_ml: {
    label: "Orange Money (Mali)", country: "ml", currency: "XOF", family: "mobile_money",
    // Aucune passerelle branchée n'encaisse au Mali aujourd'hui.
    collect: {},
    payout: { feexpay: { code: "orange_ml" } },
  },
  moov_ml: {
    label: "Moov Money (Mali)", country: "ml", currency: "XOF", family: "mobile_money",
    collect: {},
    payout: {},
  },

  // ─────────────────────── Burkina Faso (XOF) ─────────────────────
  orange_bf: {
    label: "Orange Money (Burkina Faso)", country: "bf", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "ORANGE_BFA" }, feexpay: { code: "ORANGE BF" } },
    payout: { pawapay: { code: "ORANGE_BFA" } },
  },
  moov_bf: {
    label: "Moov Money (Burkina Faso)", country: "bf", currency: "XOF", family: "mobile_money",
    collect: {
      pawapay: { code: "MOOV_BFA" }, feexpay: { code: "MOOV BF" } },
    payout: { pawapay: { code: "MOOV_BFA" } },
  },

  // ────────────────────────── Niger (XOF) ─────────────────────────
  airtel_ne: {
    label: "Airtel Money (Niger)", country: "ne", currency: "XOF", family: "mobile_money",
    collect: {
      fedapay: { code: "airtel_ne" },
      kkiapay: { code: "momo", params: { country: "NE" } },
      ipaymoney: { code: "mobile", params: { country: "NE" } },
    },
    payout: { fedapay: { code: "airtel_ne" } },
  },
  zamani_ne: {
    label: "Zamani Money (Niger)", country: "ne", currency: "XOF", family: "mobile_money",
    // iPay Money identifie l'opérateur d'après le numéro : un seul code
    // « mobile » suffit, aucun réseau à deviner.
    collect: { ipaymoney: { code: "mobile", params: { country: "NE" } } },
    payout: {},
  },
  moov_ne: {
    label: "Moov Money (Niger)", country: "ne", currency: "XOF", family: "mobile_money",
    collect: { ipaymoney: { code: "mobile", params: { country: "NE" } } },
    payout: {},
  },

  // ─────────────────── Congo Brazzaville (XAF) ────────────────────
  mtn_cg: {
    label: "MTN Mobile Money (Congo)", country: "cg", currency: "XAF", family: "mobile_money",
    collect: {
      pawapay: { code: "MTN_MOMO_COG" }, feexpay: { code: "MTN CG" }, monetbil: { code: "CG_MTNMOBILEMONEY" } },
    payout: { pawapay: { code: "MTN_MOMO_COG" } },
  },

  // ──────────────────────── Cameroun (XAF) ────────────────────────
  // Monetbil ouvre enfin l'Afrique centrale à l'encaissement.
  //
  // Comme iPay, elle route elle-même vers le bon opérateur à partir du NUMÉRO :
  // le code natif « mobile » est donc le même pour Orange et MTN, et c'est le
  // fournisseur qui tranche. Déclarer des codes par réseau ici serait inventer
  // une distinction que leur API ne fait pas.
  //
  // VERSEMENT vide à dessein : leur API n'expose aucun endpoint de
  // décaissement (onze variantes testées, toutes en 404). Un vendeur
  // camerounais peut donc VENDRE, pas encore retirer — et l'écran de retrait
  // le lui dira, puisqu'il n'affiche que les moyens réellement servis.
  orange_cm: {
    label: "Orange Money (Cameroun)", country: "cm", currency: "XAF", family: "mobile_money",
    collect: {
      pawapay: { code: "ORANGE_CMR" }, monetbil: { code: "CM_ORANGEMONEY" } },
    payout: { pawapay: { code: "ORANGE_CMR" } },
  },
  mtn_cm: {
    label: "MTN Mobile Money (Cameroun)", country: "cm", currency: "XAF", family: "mobile_money",
    collect: {
      pawapay: { code: "MTN_MOMO_CMR" }, monetbil: { code: "CM_MTNMOBILEMONEY" } },
    payout: { pawapay: { code: "MTN_MOMO_CMR" } },
  },
  eu_cm: {
    label: "Express Union (Cameroun)", country: "cm", currency: "XAF", family: "mobile_money",
    collect: { monetbil: { code: "CM_EUMM" } },
    payout: {},
  },

  // ─────────────────── Congo-Brazzaville & Gabon (XAF) ───────────────────
  // Monetbil est la SEULE de nos passerelles a les servir. Le Congo etait
  // jusqu'ici invendable ; le Gabon n'existait pas du tout chez nous.
  airtel_cg: {
    label: "Airtel Money (Congo)", country: "cg", currency: "XAF", family: "mobile_money",
    collect: {
      pawapay: { code: "AIRTEL_COG" }, monetbil: { code: "CG_AIRTELMONEY" } },
    payout: { pawapay: { code: "AIRTEL_COG" } },
  },
  moov_ga: {
    label: "Moov Africa (Gabon)", country: "ga", currency: "XAF", family: "mobile_money",
    collect: { monetbil: { code: "GA_MOOVMONEY" } },
    payout: {},
  },
  // Absent de la documentation v2.1 fournie — elle est plus ancienne que le
  // compte. Code relevé par le fondateur sur sa fiche opérateur Monetbil.
  airtel_ga: {
    label: "Airtel Money (Gabon)", country: "ga", currency: "XAF", family: "mobile_money",
    collect: {
      pawapay: { code: "AIRTEL_GAB" }, monetbil: { code: "GA_AIRTELMONEY" } },
    payout: { pawapay: { code: "AIRTEL_GAB" } },
  },

  // ───────── Hors zone franc : Guinee, RD Congo, Ouganda, Liberia ─────────
  // Codes releves dans la documentation officielle Monetbil (widget v2.1),
  // jamais deduits d'un motif : c'est le code qui decide sur quel reseau part
  // l'argent, une lettre de travers et le paiement echoue ou part ailleurs.
  //
  // Ces pays ne facturent PAS en FCFA. Ils n'ont pu etre ouverts qu'une fois
  // la conversion faite au moment du paiement (`montantAFacturer`) : jusque-la
  // un produit a 5 000 FCFA vendu en Guinee aurait debite 5 000 GNF, soit
  // environ 340 FCFA — quatorze fois moins, sans la moindre erreur visible.
  mtn_gn: {
    label: "MTN Mobile Money (Guinée)", country: "gn", currency: "GNF", family: "mobile_money",
    collect: { monetbil: { code: "GN_MTNMOBILEMONEY" } },
    payout: {},
  },
  orange_gn: {
    label: "Orange Money (Guinée)", country: "gn", currency: "GNF", family: "mobile_money",
    collect: { monetbil: { code: "GN_ORANGEMONEY" } },
    payout: {},
  },
  orange_cd: {
    label: "Orange Money (RD Congo)", country: "cd", currency: "CDF", family: "mobile_money",
    collect: {
      pawapay: { code: "ORANGE_COD" }, monetbil: { code: "CD_ORANGEMONEY" } },
    payout: { pawapay: { code: "ORANGE_COD" } },
  },
  airtel_cd: {
    label: "Airtel Money (RD Congo)", country: "cd", currency: "CDF", family: "mobile_money",
    collect: {
      pawapay: { code: "AIRTEL_COD" }, monetbil: { code: "CD_AIRTELMONEY" } },
    payout: { pawapay: { code: "AIRTEL_COD" } },
  },
  africell_cd: {
    label: "Africell Money (RD Congo)", country: "cd", currency: "CDF", family: "mobile_money",
    collect: { monetbil: { code: "CD_AFRICELL" } },
    payout: {},
  },
  airtel_ug: {
    label: "Airtel Money (Ouganda)", country: "ug", currency: "UGX", family: "mobile_money",
    collect: {
      pawapay: { code: "AIRTEL_OAPI_UGA" }, monetbil: { code: "UG_AIRTELMONEY" } },
    payout: { pawapay: { code: "AIRTEL_OAPI_UGA" } },
  },
  mtn_ug: {
    label: "MTN Mobile Money (Ouganda)", country: "ug", currency: "UGX", family: "mobile_money",
    collect: {
      pawapay: { code: "MTN_MOMO_UGA" }, monetbil: { code: "UG_MTNMOBILEMONEY" } },
    payout: { pawapay: { code: "MTN_MOMO_UGA" } },
  },
  mtn_lr: {
    label: "Lonestar Cell MTN (Liberia)", country: "lr", currency: "LRD", family: "mobile_money",
    collect: { monetbil: { code: "LR_MTNMOBILEMONEY" } },
    payout: {},
  },

  // ─────────────────────── Cartes bancaires ───────────────────────
  card_xof: {
    label: "Carte bancaire", country: "", currency: "XOF", family: "card",
    collect: {
      // FedaPay encaisse la carte sur SA page sécurisée : aucune donnée
      // bancaire ne touche nos serveurs (hors périmètre PCI-DSS).
      fedapay: { code: "hosted", params: { hosted: "1" } },
      kkiapay: { code: "card" },
      ipaymoney: { code: "card" },
    },
    payout: {},
  },
  card_xaf: {
    label: "Carte bancaire", country: "", currency: "XAF", family: "card",
    collect: {},
    payout: {},
  },

  // ───── Ouverts par PawaPay (hors zone franc) ─────────────────────────────
  // Codes relevés dans leur documentation officielle (v2/docs/providers), et
  // recoupés avec /v2/active-conf. Chaque devise a son taux dans la table de
  // conversion : sans lui, montantAFacturer() refuserait la vente — c'est ce
  // qui a tenu ces pays fermés jusqu'ici.
  mtn_gh: {
    label: "MTN Mobile Money (Ghana)", country: "gh", currency: "GHS", family: "mobile_money",
    collect: { pawapay: { code: "MTN_MOMO_GHA" } },
    payout: { pawapay: { code: "MTN_MOMO_GHA" } },
  },
  airteltigo_gh: {
    label: "AirtelTigo (Ghana)", country: "gh", currency: "GHS", family: "mobile_money",
    collect: { pawapay: { code: "AIRTELTIGO_GHA" } },
    payout: { pawapay: { code: "AIRTELTIGO_GHA" } },
  },
  vodafone_gh: {
    label: "Vodafone Cash (Ghana)", country: "gh", currency: "GHS", family: "mobile_money",
    collect: { pawapay: { code: "VODAFONE_GHA" } },
    payout: { pawapay: { code: "VODAFONE_GHA" } },
  },
  mtn_ng: {
    label: "MTN Mobile Money (Nigeria)", country: "ng", currency: "NGN", family: "mobile_money",
    collect: { pawapay: { code: "MTN_MOMO_NGA" } },
    payout: { pawapay: { code: "MTN_MOMO_NGA" } },
  },
  airtel_ng: {
    label: "Airtel Money (Nigeria)", country: "ng", currency: "NGN", family: "mobile_money",
    collect: { pawapay: { code: "AIRTEL_NGA" } },
    payout: { pawapay: { code: "AIRTEL_NGA" } },
  },
  mpesa_ke: {
    label: "M-Pesa (Kenya)", country: "ke", currency: "KES", family: "mobile_money",
    collect: { pawapay: { code: "MPESA_KEN" } },
    payout: { pawapay: { code: "MPESA_KEN" } },
  },
  vodacom_tz: {
    label: "Vodacom M-Pesa (Tanzanie)", country: "tz", currency: "TZS", family: "mobile_money",
    collect: { pawapay: { code: "VODACOM_TZA" } },
    payout: { pawapay: { code: "VODACOM_TZA" } },
  },
  airtel_tz: {
    label: "Airtel Money (Tanzanie)", country: "tz", currency: "TZS", family: "mobile_money",
    collect: { pawapay: { code: "AIRTEL_TZA" } },
    payout: { pawapay: { code: "AIRTEL_TZA" } },
  },
  tigo_tz: {
    label: "Tigo Pesa (Tanzanie)", country: "tz", currency: "TZS", family: "mobile_money",
    collect: { pawapay: { code: "TIGO_TZA" } },
    payout: { pawapay: { code: "TIGO_TZA" } },
  },
  halotel_tz: {
    label: "Halopesa (Tanzanie)", country: "tz", currency: "TZS", family: "mobile_money",
    collect: { pawapay: { code: "HALOTEL_TZA" } },
    payout: { pawapay: { code: "HALOTEL_TZA" } },
  },
  mtn_rw: {
    label: "MTN Mobile Money (Rwanda)", country: "rw", currency: "RWF", family: "mobile_money",
    collect: { pawapay: { code: "MTN_MOMO_RWA" } },
    payout: { pawapay: { code: "MTN_MOMO_RWA" } },
  },
  airtel_rw: {
    label: "Airtel Money (Rwanda)", country: "rw", currency: "RWF", family: "mobile_money",
    collect: { pawapay: { code: "AIRTEL_RWA" } },
    payout: { pawapay: { code: "AIRTEL_RWA" } },
  },
  mtn_zm: {
    label: "MTN Mobile Money (Zambie)", country: "zm", currency: "ZMW", family: "mobile_money",
    collect: { pawapay: { code: "MTN_MOMO_ZMB" } },
    payout: { pawapay: { code: "MTN_MOMO_ZMB" } },
  },
  airtel_zm: {
    label: "Airtel Money (Zambie)", country: "zm", currency: "ZMW", family: "mobile_money",
    collect: { pawapay: { code: "AIRTEL_OAPI_ZMB" } },
    payout: { pawapay: { code: "AIRTEL_OAPI_ZMB" } },
  },
  zamtel_zm: {
    label: "Zamtel Kwacha (Zambie)", country: "zm", currency: "ZMW", family: "mobile_money",
    collect: { pawapay: { code: "ZAMTEL_ZMB" } },
    payout: { pawapay: { code: "ZAMTEL_ZMB" } },
  },
  airtel_mw: {
    label: "Airtel Money (Malawi)", country: "mw", currency: "MWK", family: "mobile_money",
    collect: { pawapay: { code: "AIRTEL_MWI" } },
    payout: { pawapay: { code: "AIRTEL_MWI" } },
  },
  tnm_mw: {
    label: "TNM Mpamba (Malawi)", country: "mw", currency: "MWK", family: "mobile_money",
    collect: { pawapay: { code: "TNM_MWI" } },
    payout: { pawapay: { code: "TNM_MWI" } },
  },
  vodacom_mz: {
    label: "M-Pesa (Mozambique)", country: "mz", currency: "MZN", family: "mobile_money",
    collect: { pawapay: { code: "VODACOM_MOZ" } },
    payout: { pawapay: { code: "VODACOM_MOZ" } },
  },
  movitel_mz: {
    label: "Movitel (Mozambique)", country: "mz", currency: "MZN", family: "mobile_money",
    collect: { pawapay: { code: "MOVITEL_MOZ" } },
    payout: { pawapay: { code: "MOVITEL_MOZ" } },
  },
  orange_sl: {
    label: "Orange Money (Sierra Leone)", country: "sl", currency: "SLE", family: "mobile_money",
    collect: { pawapay: { code: "ORANGE_SLE" } },
    payout: { pawapay: { code: "ORANGE_SLE" } },
  },

};

// ─────────────────────────── Lecture du registre ───────────────────────────

/** Entrée d'un opérateur, ou null s'il est inconnu. */
export function getOperator(code: string | null | undefined): OperatorEntry | null {
  if (!code) return null;
  return OPERATORS[String(code).trim().toLowerCase()] ?? null;
}

/** Métadonnées d'une passerelle. */
export function getProvider(id: ProviderId): ProviderMeta | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

/**
 * Passerelles capables de traiter cet opérateur dans cette direction, avec leur
 * route native. Ordre = ordre de PROVIDERS (priorité par défaut).
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
  currency?: CodeDevise;
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
 * Opérateurs encaissables mais non versables (et l'inverse) — angle mort à
 * surveiller : accepter l'argent par un canal qu'on ne sait pas rembourser.
 */
export function coverageGaps(): { collectOnly: string[]; payoutOnly: string[] } {
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
// Les écrans de checkout envoient un code d'opérateur GÉNÉRIQUE
// ("orange_money", "wave"…), alors que ce registre est indexé PAYS PAR PAYS
// ("orange_ci", "wave_sn"…) — chaque pays ayant son propre code fournisseur.
// Sans traduction, aucune résolution n'aboutit.

/** Préfixe téléphonique international → pays ISO-2. */
const DIAL_TO_COUNTRY: Record<string, string> = {
  "229": "bj", "221": "sn", "225": "ci", "237": "cm",
  "228": "tg", "223": "ml", "226": "bf",
  "227": "ne", "242": "cg",
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

/**
 * Devise d'un pays, déduite de ses opérateurs déclarés. Null si le pays est
 * inconnu du registre.
 */
export function currencyForCountry(country: string | null | undefined): CodeDevise | null {
  const c = (country ?? "").trim().toLowerCase();
  if (!c) return null;
  for (const op of Object.values(OPERATORS)) {
    if (op.country === c) return op.currency;
  }
  return null;
}

/** Devise à facturer pour un opérateur donné (le Congo est en XAF, pas XOF). */
export function currencyForOperator(code: string | null | undefined): CodeDevise | null {
  return getOperator(code)?.currency ?? null;
}

/** Déduit le pays depuis un numéro international (chiffres, indicatif compris). */
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
 * combine le code générique avec le pays — paramètre explicite, à défaut
 * l'indicatif du numéro.
 *
 * Renvoie null si on ne peut pas trancher : mieux vaut refuser que router vers
 * le mauvais réseau.
 */
export function resolveOperatorCode(
  raw: string | null | undefined,
  opts: { country?: string | null; phone?: string | null; currency?: CodeDevise } = {},
): string | null {
  const code = (raw ?? "").trim().toLowerCase();
  if (!code) return null;

  if (OPERATORS[code]) return code;

  const country = (opts.country ?? "").trim().toLowerCase() || countryFromPhone(opts.phone);

  // La carte dépend de la devise, pas du pays.
  if (code === "card" || code === "carte") {
    // La zone se déduit du registre : lister les pays XAF ici en dur, c'était
    // la garantie d'en oublier un au premier pays ajouté (le Congo l'a prouvé).
    const cur = (opts.currency ?? currencyForCountry(country) ?? "XOF").toLowerCase();
    return OPERATORS[`card_${cur}`] ? `card_${cur}` : null;
  }

  const family = GENERIC_FAMILY[code];
  if (!family || !country) return null;

  // Un seul opérateur doit correspondre à (famille, pays) — sinon on s'abstient.
  const matches = Object.entries(OPERATORS).filter(
    ([key, op]) => op.country === country && key.startsWith(family + "_"),
  );
  return matches.length === 1 ? matches[0][0] : null;
}
