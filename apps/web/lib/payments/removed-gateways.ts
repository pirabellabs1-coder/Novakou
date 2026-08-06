/**
 * Passerelles RETIRÉES de la plateforme.
 *
 * Leurs tentatives de paiement restent en base — un historique ne se réécrit
 * pas — mais plus aucun code ne sait les interroger : l'intégration a été
 * supprimée. La réconciliation échouait donc éternellement dessus, et l'alerte
 * des ventes bloquées les resignalait toutes les quinze minutes.
 *
 * Une alerte qui répète chaque quart d'heure une chose qu'on ne peut pas
 * corriger finit par être ignorée — et c'est ainsi qu'on rate la vraie.
 *
 * Ces tentatives sont donc CLOSES une fois, et listées séparément dans le
 * diagnostic admin : si l'une d'elles avait réellement été payée, elle ne peut
 * être vérifiée que sur le tableau de bord de l'ancien fournisseur.
 */
export const PASSERELLES_RETIREES = new Set(["moneroo", "paygenius", "geniuspay", "kkiapay"]);

/** Vrai si cette tentative vient d'une passerelle qu'on n'interroge plus. */
export function estPasserelleRetiree(provider: unknown): boolean {
  return typeof provider === "string" && PASSERELLES_RETIREES.has(provider.trim().toLowerCase());
}
