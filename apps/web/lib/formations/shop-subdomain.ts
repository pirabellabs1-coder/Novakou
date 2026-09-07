/**
 * Sous-domaine gratuit d'une boutique : `<slug>.novakou.com`.
 *
 * Source unique de vérité. Avant, le domaine racine et la liste des
 * sous-domaines réservés étaient recopiés dans `middleware.ts` et dans la page
 * `boutique/by-domain/[host]` : deux copies à tenir alignées, donc une qui
 * dérive tôt ou tard.
 *
 * Module volontairement sans dépendance (ni Prisma, ni `fetch`) : le
 * middleware tourne en Edge Runtime et l'importe.
 */

export const ROOT_DOMAIN = "novakou.com";

/**
 * Sous-domaines qui ne mappent JAMAIS vers une boutique.
 *
 * Deux familles :
 *  - l'infra habituelle (`www`, `api`, `admin`…) ;
 *  - les hôtes déjà pris dans le DNS de novakou.com et servis par d'AUTRES
 *    projets (`info`, `ai`) — leur enregistrement explicite l'emporte sur le
 *    nôtre, donc une boutique portant ce slug n'y serait jamais servie.
 */
export const RESERVED_SUBDOMAINS = new Set<string>([
  "www", "api", "admin", "app", "mail", "ftp", "cdn", "assets", "static",
  "staging", "preview", "dashboard", "backoffice", "acheteur", "blog", "help",
  "support", "docs", "status", "m", "vercel",
  "info", "ai",
]);

/** Vrai si ce slug ne peut pas servir de sous-domaine de boutique. */
export function estSousDomaineReserve(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.trim().toLowerCase());
}

/**
 * Un slug peut-il devenir un sous-domaine ?
 *
 * Une étiquette DNS est limitée à 63 caractères (RFC 1035) et n'accepte que
 * lettres, chiffres et tirets — sans tiret en tête ni en fin. Un slug qui sort
 * de ces clous ne donnerait pas une erreur claire : il donnerait un hôte qui
 * ne résout tout simplement pas.
 */
export function slugUtilisableEnSousDomaine(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (estSousDomaineReserve(s)) return false;
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(s);
}

/** `nafa` → `nafa.novakou.com`. */
export function sousDomaineDeBoutique(slug: string): string {
  return `${slug.trim().toLowerCase()}.${ROOT_DOMAIN}`;
}

/**
 * Hôte entrant → slug de boutique, ou `null` si ce n'est pas un sous-domaine
 * de boutique (domaine personnalisé, hôte de l'app, sous-domaine réservé).
 */
export function slugDepuisHote(host: string | null): string | null {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase();
  if (!h.endsWith(`.${ROOT_DOMAIN}`)) return null;
  const sub = h.slice(0, -(`.${ROOT_DOMAIN}`.length));
  // `sub.includes(".")` : on ne sert que le premier niveau (`a.novakou.com`),
  // pas `a.b.novakou.com` — le certificat par sous-domaine ne couvre que lui.
  if (!sub || sub.includes(".") || estSousDomaineReserve(sub)) return null;
  return sub;
}
