// Numéro ≠ opérateur choisi : prévenir l'acheteur AVANT de pousser la demande.
//
// Constat (août-septembre 2026) : 13 paiements PawaPay en « PAYER_NOT_FOUND ».
// Aucun bug de formatage chez nous — l'acheteur avait choisi le mauvais
// opérateur pour son numéro : neuf numéros Orange Cameroun (698…, 655…, 659…)
// envoyés comme « MTN », des numéros Free Sénégal (76…) envoyés comme
// « Orange », un numéro Orange Côte d'Ivoire (07…) envoyé comme « MTN ». La
// demande partait, l'opérateur ne connaissait pas le numéro, la vente tombait.
//
// La portabilité existe : un numéro peut avoir été porté chez un autre réseau
// et la prédiction se tromper. On ne BLOQUE donc jamais — on avertit une fois ;
// si l'acheteur appuie à nouveau sur Payer avec le même numéro et le même
// opérateur dans les 15 minutes, on le laisse passer.

import { prisma } from "@/lib/prisma";
import { OPERATORS, getOperator, isSupported } from "@/lib/payments/registry";
import { predireOperateur } from "@/lib/pawapay";

const FENETRE_CONFIRMATION_MS = 15 * 60_000;

// Portefeuilles indépendants du réseau : un compte Wave ou Djamo s'ouvre sur un
// numéro de N'IMPORTE quel opérateur. Comparer serait toujours faux.
const PORTEFEUILLES = ["wave_", "djamo_", "wizall_", "e_money_"];

/** Code PawaPay → clé du registre, en lisant les routes déclarées. */
function operateurDepuisCodePawapay(code: string): string | null {
  for (const [cle, op] of Object.entries(OPERATORS)) {
    if (op.collect.pawapay?.code === code || op.payout.pawapay?.code === code) return cle;
  }
  return null;
}

const FAMILLES: Record<string, string> = {
  ORANGE: "Orange Money",
  MTN: "MTN Mobile Money",
  MOOV: "Moov Money",
  AIRTEL: "Airtel Money",
  FREE: "Free Money (YAS)",
  MPESA: "M-Pesa",
  VODACOM: "M-Pesa",
  ZAMTEL: "Zamtel Kwacha",
  TIGO: "YAS",
  HALOTEL: "Halopesa",
  AIRTELTIGO: "AT Money",
  VODAFONE: "Telecel Cash",
  TNM: "TNM Mpamba",
  MOVITEL: "Movitel",
};

function libelleDepuisCode(code: string): string {
  const tete = code.split("_")[0] ?? code;
  return FAMILLES[tete] ?? tete.charAt(0) + tete.slice(1).toLowerCase();
}

export type AlerteOperateur = {
  /** Message montré à l'acheteur. */
  message: string;
  /** Trace technique (CheckoutAttempt.failureReason). */
  raison: string;
  /** Clé registre de l'opérateur prédit, s'il est proposable. */
  suggestion: string | null;
};

export async function verifierOperateurDuNumero(p: {
  operatorCode: string;
  phone: string;
}): Promise<AlerteOperateur | null> {
  const choisi = getOperator(p.operatorCode);
  if (!choisi || choisi.family !== "mobile_money") return null;
  if (PORTEFEUILLES.some((pr) => p.operatorCode.startsWith(pr))) return null;

  const chiffres = p.phone.replace(/\D/g, "");
  const prediction = await predireOperateur(chiffres);
  if (!prediction) return null;

  const codeChoisi = choisi.collect.pawapay?.code ?? choisi.payout.pawapay?.code ?? null;
  if (codeChoisi && prediction.provider === codeChoisi) return null;

  const clePredite = operateurDepuisCodePawapay(prediction.provider);
  if (clePredite === p.operatorCode) return null;

  const opPredit = clePredite ? getOperator(clePredite) : null;
  // Autre pays que celui de l'opérateur : ce n'est pas notre sujet ici (la
  // règle de longueur par indicatif s'en charge déjà).
  if (opPredit && opPredit.country !== choisi.country) return null;
  // On ne conclut que si l'on sait comparer : l'opérateur choisi a un code
  // PawaPay, ou la prédiction désigne un autre opérateur du même pays.
  if (!codeChoisi && !opPredit) return null;

  const raison = `Numéro ${chiffres} détecté ${prediction.provider} ≠ ${p.operatorCode}`;

  // Deuxième appui sur Payer avec le même couple numéro/opérateur : l'acheteur
  // confirme (numéro porté) — on le laisse passer.
  const dejaAverti = await prisma.checkoutAttempt.findFirst({
    where: {
      failureCode: "operator_mismatch",
      failureReason: raison,
      createdAt: { gte: new Date(Date.now() - FENETRE_CONFIRMATION_MS) },
    },
    select: { id: true },
  });
  if (dejaAverti) return null;

  const nomPredit = opPredit?.label ?? libelleDepuisCode(prediction.provider);
  const proposable = !!clePredite && isSupported(clePredite, "collect");
  const confirmer = `Si votre numéro est bien chez ${choisi.label} (numéro porté), appuyez à nouveau sur Payer.`;

  return {
    message: proposable
      ? `Ce numéro semble être un numéro ${nomPredit}, pas ${choisi.label}. Choisissez « ${nomPredit} » comme moyen de paiement. ${confirmer}`
      : `Ce numéro semble être un numéro ${nomPredit}, qui n'est pas encore disponible au paiement. Utilisez un numéro ${choisi.label}. ${confirmer}`,
    raison,
    suggestion: proposable ? clePredite : null,
  };
}
