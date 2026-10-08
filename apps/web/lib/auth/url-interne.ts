/**
 * Ne renvoie `cible` que s'il s'agit d'un chemin INTERNE au site.
 *
 * Les pages de connexion et de 2FA redirigent vers le `callbackUrl` reçu dans
 * l'adresse. Sans ce contrôle, un lien de phishing
 * `novakou.com/connexion?callbackUrl=https://faux-site.tld` envoyait la
 * personne, une fois authentifiée sur le vrai site, vers une copie qui lui
 * redemandait ses identifiants (audit du 2026-10-08). On n'accepte qu'un
 * chemin absolu simple : `/…`, jamais `//hôte`, `/\hôte` ni un schéma.
 */
/** Variante pour les écrans qui distinguent « pas de cible » (null) d'une cible valide. */
export function urlInterneOuNull(cible: string | null | undefined): string | null {
  if (!cible) return null;
  const v = urlInterne(cible, "");
  return v || null;
}

export function urlInterne(cible: string | null | undefined, defaut = "/"): string {
  if (!cible) return defaut;
  const v = cible.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return defaut;
  // Caractères de contrôle ou retours à la ligne : jamais dans une URL légitime.
  if (/[\u0000-\u001f\u007f]/.test(v)) return defaut;
  return v;
}
