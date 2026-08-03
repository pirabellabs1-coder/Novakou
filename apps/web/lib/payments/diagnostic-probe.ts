/**
 * Reconnaît une tentative de paiement qui est une SONDE de diagnostic, pas un
 * achat.
 *
 * On vérifie régulièrement que chaque route (opérateur × passerelle) répond
 * encore : ces sondes créent de vraies tentatives, avec un numéro factice et
 * une adresse dédiée. Elles restent forcément « en attente » — personne ne
 * confirmera jamais sur un téléphone qui n'existe pas.
 *
 * Sans ce tri, elles s'accumulent dans le diagnostic des ventes bloquées et
 * dans l'alerte, jusqu'à noyer les vraies. Une alerte qu'on n'ouvre plus ne
 * protège plus personne : c'est ce qui a fait qu'une vente réelle est passée
 * inaperçue.
 */
const ADRESSE_SONDE = "diagnostic.novakou@gmail.com";

export function estSondeDiagnostic(t: {
  visitorEmail?: string | null;
  visitorPhone?: string | null;
}): boolean {
  if ((t.visitorEmail ?? "").trim().toLowerCase() === ADRESSE_SONDE) return true;
  // Filet de sécurité : numéro visiblement fabriqué (six zéros de suite).
  // Aucun opérateur n'attribue de tels numéros.
  return /0{6}$/.test((t.visitorPhone ?? "").replace(/\D/g, ""));
}
