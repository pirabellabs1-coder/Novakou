/**
 * Domaines e-mail acceptés pour un ACHAT.
 *
 * Pour bloquer les adresses bidon au moment du paiement, on exige un domaine
 * de cette liste blanche. Par défaut : Gmail uniquement (le marché de Novakou
 * est très majoritairement sur Gmail). Pour autoriser d'autres fournisseurs
 * plus tard (Outlook, Yahoo…), il suffit d'ajouter le domaine ici.
 */
export const ALLOWED_BUYER_EMAIL_DOMAINS = ["gmail.com"];

/** Message d'erreur unique (client + serveur). */
export const ALLOWED_BUYER_EMAIL_MESSAGE =
  "Pour finaliser un achat, utilisez une adresse Gmail valide (terminant par @gmail.com).";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Format e-mail valide ET domaine autorisé pour acheter. */
export function isAllowedBuyerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return false;
  const domain = e.split("@")[1] ?? "";
  return ALLOWED_BUYER_EMAIL_DOMAINS.includes(domain);
}
