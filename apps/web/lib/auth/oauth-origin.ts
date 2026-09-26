/**
 * L'OAuth Google doit DÉMARRER sur le domaine principal (NEXTAUTH_URL).
 *
 * NextAuth pose son cookie « state » sur l'hôte où le parcours commence, mais
 * Google renvoie toujours sur le domaine principal. Commencé depuis un autre
 * hôte (domaine de boutique, sous-domaine), le cookie n'y est pas :
 * « State cookie was missing », connexion impossible — vu 4 fois le
 * 2026-09-25 (même personne, trois essais). On rebascule d'abord sur le bon
 * domaine, où la page relance Google d'elle-même (`?oauth=google`).
 */
export function origineAuth(): string | null {
  const u = process.env.NEXT_PUBLIC_APP_URL;
  if (!u) return null;
  try {
    return new URL(u).origin;
  } catch {
    return null;
  }
}

/** Vrai si une redirection vers le domaine principal a été déclenchée. */
export function redirigerVersOrigineAuth(): boolean {
  if (typeof window === "undefined") return false;
  const cible = origineAuth();
  if (!cible || window.location.origin === cible) return false;
  const url = new URL(window.location.pathname + window.location.search, cible);
  url.searchParams.set("oauth", "google");
  window.location.assign(url.toString());
  return true;
}
