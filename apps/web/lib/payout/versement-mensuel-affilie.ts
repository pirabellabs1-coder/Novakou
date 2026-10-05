// Versement mensuel automatique des affiliés — le moyen de versement choisi.
//
// La page des commissions promet un versement « automatique le 5 de chaque
// mois », mais aucun écran ne permettait de dire OÙ verser : sans moyen
// enregistré, le versement mensuel n'avait personne à payer. L'affilié le
// choisit désormais sur la page Retraits (même écran de paiement que pour un
// retrait manuel) ; on le range dans `AffiliateProfile.bankDetails`, colonne
// JSON existante restée vide, sous la clé `versementMensuel` — sans migration.

import type { Prisma } from "@prisma/client";
import {
  getPayoutMethod,
  isPayoutMethodDisabled,
  isPayoutMethodServable,
  normalizeMsisdn,
  PAYOUT_DISABLED_MESSAGE,
  shortMethodLabel,
} from "@/lib/payments/payout-catalog";
import { checkInternationalNumber } from "@/lib/payments/phone-rules";

export interface DestinationVersement {
  method: string;
  accountDetails: { msisdn?: string; country?: string };
}

interface DestinationEnregistree extends DestinationVersement {
  enregistreLe: string;
}

export type ResultatValidation =
  | { ok: true; destination: DestinationVersement }
  | { ok: false; erreur: string; code: string };

/**
 * Valide un moyen de versement. MÊMES règles que la demande de retrait
 * manuelle (POST /api/formations/affilie/retraits) : un moyen accepté ici doit
 * l'être là-bas, sinon le versement mensuel partirait vers un moyen que
 * l'affilié ne pourrait pas choisir lui-même. Revalidé au moment de verser :
 * un réseau peut fermer entre l'enregistrement et le 5 du mois.
 */
export function validerDestination(entree: { method: string; msisdn?: string | null; country?: string | null }): ResultatValidation {
  const def = getPayoutMethod(entree.method);
  if (!def) return { ok: false, erreur: "Méthode de paiement non reconnue.", code: "METHODE_INCONNUE" };
  if (isPayoutMethodDisabled(def.id)) {
    return { ok: false, erreur: PAYOUT_DISABLED_MESSAGE, code: "PAYOUT_COUNTRY_DISABLED" };
  }
  if (def.category === "mobile_money" && !isPayoutMethodServable(def.id)) {
    return {
      ok: false,
      erreur: `${def.label} n'est pas disponible au retrait pour le moment. Choisissez un autre moyen.`,
      code: "PAYOUT_METHOD_UNAVAILABLE",
    };
  }
  // Un versement sans intervention ne peut partir que vers un numéro : le
  // virement bancaire exige une saisie que ce parcours ne collecte pas.
  if (!def.requiredFields.includes("msisdn") || def.requiredFields.some((f) => f !== "msisdn")) {
    return { ok: false, erreur: "Ce moyen ne permet pas le versement automatique. Choisissez un Mobile Money.", code: "METHODE_NON_AUTOMATISABLE" };
  }
  const brut = (entree.msisdn ?? "").trim();
  if (!brut) return { ok: false, erreur: "Numéro Mobile Money requis.", code: "NUMERO_REQUIS" };

  // Contrôlé contre les règles du pays du réseau (longueur, préfixes) : un
  // numéro faux enregistré ici ferait échouer — ou dévier — CHAQUE versement
  // mensuel, sans que l'affilié soit là pour corriger.
  const msisdn = normalizeMsisdn(brut, def.id);
  const pays = def.countries[0];
  if (pays) {
    const controle = checkInternationalNumber(pays, msisdn);
    if (!controle.ok) return { ok: false, erreur: controle.error, code: "NUMERO_INVALIDE" };
  } else if (msisdn.length < 8) {
    return { ok: false, erreur: "Numéro Mobile Money invalide.", code: "NUMERO_INVALIDE" };
  }

  const accountDetails: DestinationVersement["accountDetails"] = { msisdn };
  if (entree.country) accountDetails.country = entree.country;
  return { ok: true, destination: { method: def.id, accountDetails } };
}

/** Le moyen enregistré, ou null (rien d'enregistré, ou contenu illisible). */
export function lireDestination(bankDetails: Prisma.JsonValue | null | undefined): DestinationVersement | null {
  if (!bankDetails || typeof bankDetails !== "object" || Array.isArray(bankDetails)) return null;
  const v = (bankDetails as Record<string, unknown>).versementMensuel;
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const { method, accountDetails } = v as Record<string, unknown>;
  if (typeof method !== "string" || !accountDetails || typeof accountDetails !== "object") return null;
  const d = accountDetails as Record<string, unknown>;
  return {
    method,
    accountDetails: {
      msisdn: typeof d.msisdn === "string" ? d.msisdn : undefined,
      country: typeof d.country === "string" ? d.country : undefined,
    },
  };
}

/** `bankDetails` mis à jour — les autres clés éventuelles sont conservées. */
export function ecrireDestination(
  bankDetails: Prisma.JsonValue | null | undefined,
  destination: DestinationVersement | null,
): Prisma.InputJsonValue {
  const base =
    bankDetails && typeof bankDetails === "object" && !Array.isArray(bankDetails)
      ? { ...(bankDetails as Record<string, Prisma.JsonValue>) }
      : {};
  // Les moyens remplacés sont gardés (5 derniers) : si un compte est détourné,
  // on doit pouvoir dire vers quel numéro les versements partaient avant.
  if (base.versementMensuel) {
    const passes = Array.isArray(base.versementMensuelHistorique) ? base.versementMensuelHistorique : [];
    const remplace = { ...(base.versementMensuel as Record<string, Prisma.JsonValue>), remplaceLe: new Date().toISOString() };
    base.versementMensuelHistorique = [remplace, ...passes].slice(0, 5);
  }
  delete base.versementMensuel;
  if (!destination) return base as Prisma.InputJsonValue;
  const enregistree: DestinationEnregistree = { ...destination, enregistreLe: new Date().toISOString() };
  return { ...base, versementMensuel: enregistree } as unknown as Prisma.InputJsonValue;
}

/** « MTN Bénin · ••••5726 » — jamais le numéro complet à l'écran ni par e-mail. */
export function decrireDestination(d: DestinationVersement): string {
  const n = d.accountDetails.msisdn ?? "";
  return `${shortMethodLabel(d.method)}${n ? ` · ••••${n.slice(-4)}` : ""}`;
}
