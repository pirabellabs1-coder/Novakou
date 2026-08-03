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

export function estSondeDiagnostic(t: { visitorEmail?: string | null }): boolean {
  // UNIQUEMENT l'adresse dédiée. On s'est retenu d'ajouter une heuristique sur
  // le numéro (« finit par six zéros ») : elle aurait pu écarter un vrai
  // acheteur, donc recréer précisément le silence qu'on cherche à supprimer.
  // Face au doute, on préfère une fausse alerte à une vente manquée — si
  // quelqu'un sonde depuis une autre adresse, sa tentative apparaîtra, et
  // c'est le bon comportement.
  return (t.visitorEmail ?? "").trim().toLowerCase() === ADRESSE_SONDE;
}
