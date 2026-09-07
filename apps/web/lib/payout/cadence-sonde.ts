/**
 * À quelle cadence redemander à FeexPay le statut d'un versement ?
 *
 * Les consultations de statut FeexPay sortent par le proxy à IP fixe, dont le
 * forfait se compte en REQUÊTES (2 500/mois). Or `cron/payout-reconcile` tourne
 * toutes les dix minutes sur une fenêtre de quatorze jours : un seul versement
 * resté en attente consomme 144 sondes par jour, soit 2 016 sur la fenêtre —
 * 81 % du forfait mensuel, à lui tout seul.
 *
 * C'est ce qui a vidé le quota le 2026-08-18 : Fixie s'est mis à refuser, le
 * code est reparti en direct, et FeexPay a rejeté l'IP dynamique. Douze
 * versements refusés en douze jours, imputés à la passerelle. Le correctif
 * d'alors a sorti les AUTRES passerelles du proxy sans toucher à cette
 * cadence : la cause est restée armée.
 *
 * Palier, sans rien à stocker — la seule donnée est l'âge de la demande :
 *   • première heure : à chaque passage (c'est là que la confirmation tombe)
 *   • premier jour   : une fois par heure
 *   • au-delà        : quatre fois par jour
 *
 * Soit 81 sondes au lieu de 2 016. Le webhook reste le chemin normal ; ce cron
 * n'est que le filet, et un filet n'a pas besoin de battre la seconde.
 */

/** Heures UTC des sondes tardives (au-delà de 24 h). */
const HEURES_TARDIVES = [1, 7, 13, 19];

export function sonderMaintenant(cree: Date, maintenant: Date): boolean {
  const ageMs = maintenant.getTime() - cree.getTime();
  if (ageMs < 3_600_000) return true;

  // Le cron tourne toutes les 10 min : le passage de début d'heure est celui
  // dont la minute est inférieure à 10.
  const debutHeure = maintenant.getUTCMinutes() < 10;
  if (ageMs < 86_400_000) return debutHeure;
  return debutHeure && HEURES_TARDIVES.includes(maintenant.getUTCHours());
}
