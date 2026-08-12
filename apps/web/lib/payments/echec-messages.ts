/**
 * MOTIF D'UN PAIEMENT NON ABOUTI — en français, et surtout ACTIONNABLE.
 *
 * Pourquoi ce module existe
 * -------------------------
 * Tout échec d'encaissement affichait la même phrase : « La demande a été
 * refusée ou annulée. » Or les passerelles disent POURQUOI : solde insuffisant,
 * plafond mensuel atteint, demande non validée à temps, numéro inconnu chez
 * l'opérateur, réseau indisponible. Une seule phrase pour dix causes, c'est un
 * acheteur qui ne sait pas quoi corriger — donc qui ne réessaie pas — et un
 * vendeur qui ne saura jamais s'il perd ses ventes à cause d'un plafond, d'un
 * mauvais numéro ou d'une panne opérateur.
 *
 * On traduit ce que les passerelles nous donnent. Ce qu'on ne reconnaît pas
 * reste rangé en base (`failureCode` / `failureReason`) pour le diagnostic,
 * et l'acheteur reçoit alors le message générique — jamais un code brut.
 */

export type MotifEchec = {
  /** Titre affiché à l'acheteur. */
  titre: string;
  /** Ce qu'il doit faire pour que ça marche au prochain essai. */
  explication: string;
};

const GENERIQUE: MotifEchec = {
  titre: "Paiement non abouti",
  explication:
    "La demande n'a pas été validée. Aucun montant n'a été débité — vous pouvez réessayer.",
};

/**
 * Règles ordonnées : la PREMIÈRE qui correspond gagne. Le rapprochement se fait
 * sur le code du fournisseur ET sur son message, car ils ne renseignent pas
 * tous le code (FeexPay et Monetbil n'envoient souvent qu'une phrase).
 */
const REGLES: Array<{ motifs: RegExp; message: MotifEchec }> = [
  {
    motifs: /INSUFFICIENT|BALANCE|SOLDE|FUNDS/i,
    message: {
      titre: "Solde insuffisant",
      explication:
        "Votre compte Mobile Money n'a pas le montant nécessaire. Rechargez-le, puis réessayez.",
    },
  },
  {
    motifs: /LIMIT|PLAFOND|CEILING|EXCEED/i,
    message: {
      titre: "Plafond de votre compte atteint",
      explication:
        "Votre opérateur refuse ce montant : le plafond de votre compte est atteint. Attendez la remise à zéro (souvent le lendemain), relevez votre plafond auprès de l'opérateur, ou payez avec un autre numéro.",
    },
  },
  {
    motifs: /NOT_APPROVED|NOT_AUTHORIZED|REJECTED_BY|CANCEL|ANNUL|REFUS|DECLINED|EXPIRED|TIMEOUT|TIMED_OUT/i,
    message: {
      titre: "Demande non validée",
      explication:
        "La demande envoyée sur votre téléphone n'a pas été confirmée à temps, ou a été refusée. Réessayez et saisissez votre code secret dès que la demande s'affiche.",
    },
  },
  {
    motifs: /PIN|WRONG_CODE|INVALID_CODE|MOT_DE_PASSE/i,
    message: {
      titre: "Code secret refusé",
      explication:
        "Le code secret saisi sur votre téléphone n'a pas été accepté par l'opérateur. Réessayez avec le bon code.",
    },
  },
  {
    motifs: /PAYER_NOT_FOUND|UNKNOWN_SUBSCRIBER|NOT_FOUND|INVALID_MSISDN|MSISDN|NUMERO|NUMÉRO|PHONE/i,
    message: {
      titre: "Numéro non reconnu",
      explication:
        "Ce numéro n'est pas reconnu par l'opérateur choisi. Vérifiez le numéro et l'opérateur (Orange, MTN, Moov, Wave…), puis réessayez.",
    },
  },
  {
    motifs: /BARRED|BLOCK|SUSPEND|INACTIVE|KYC|NOT_ELIGIBLE/i,
    message: {
      titre: "Compte Mobile Money indisponible",
      explication:
        "Votre compte n'autorise pas ce paiement (compte non activé, bloqué, ou vérification d'identité manquante chez l'opérateur). Contactez votre opérateur, ou payez avec un autre numéro.",
    },
  },
  {
    motifs: /MMO_|OPERATOR|PROVIDER_|SERVICE_UNAVAILABLE|TEMPORARY|NETWORK|UNAVAILABLE/i,
    message: {
      titre: "Opérateur momentanément indisponible",
      explication:
        "Le réseau de votre opérateur n'a pas pu traiter la demande. Aucun montant n'a été débité — réessayez dans quelques minutes.",
    },
  },
  {
    motifs: /DEPOSITS_NOT_ALLOWED|NOT_CONFIGURED|NOT_ALLOWED/i,
    message: {
      titre: "Moyen de paiement indisponible",
      explication:
        "Ce moyen de paiement n'est pas ouvert pour le moment. Choisissez-en un autre — votre commande est conservée.",
    },
  },
  {
    motifs: /AMOUNT|MONTANT|TOO_SMALL|TOO_LARGE/i,
    message: {
      titre: "Montant refusé par l'opérateur",
      explication:
        "L'opérateur n'accepte pas ce montant sur ce compte. Essayez un autre moyen de paiement.",
    },
  },
];

/**
 * Traduit le motif brut d'une passerelle en message pour l'acheteur.
 * Renvoie le message générique si rien ne correspond — jamais de code brut.
 */
export function messageEchecAcheteur(
  failureCode?: string | null,
  failureMessage?: string | null,
): MotifEchec {
  const brut = `${failureCode ?? ""} ${failureMessage ?? ""}`.trim();
  if (!brut) return GENERIQUE;
  for (const r of REGLES) {
    if (r.motifs.test(brut)) return r.message;
  }
  return GENERIQUE;
}
