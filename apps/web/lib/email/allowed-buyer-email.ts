/**
 * Domaines e-mail acceptés pour un ACHAT.
 *
 * Liste blanche optionnelle. **Vide = toute adresse e-mail valide est acceptée**
 * (Gmail, Outlook, Yahoo, e-mail professionnel…) — c'est le comportement voulu :
 * ne jamais bloquer un acheteur légitime sur son fournisseur de messagerie.
 * Pour re-restreindre un jour (anti-fraude ciblé), il suffit d'ajouter des
 * domaines ici ; le mécanisme reste en place.
 */
export const ALLOWED_BUYER_EMAIL_DOMAINS: string[] = [];

/** Message d'erreur unique (client + serveur) — affiché si le FORMAT est invalide. */
export const ALLOWED_BUYER_EMAIL_MESSAGE =
  "Entrez une adresse e-mail valide (Gmail, Outlook, Yahoo, e-mail professionnel…).";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Format e-mail valide ET domaine autorisé pour acheter. */
export function isAllowedBuyerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return false;
  // Aucune liste blanche → tout domaine au format valide passe.
  if (ALLOWED_BUYER_EMAIL_DOMAINS.length === 0) return true;
  const domain = e.split("@")[1] ?? "";
  return ALLOWED_BUYER_EMAIL_DOMAINS.includes(domain);
}
