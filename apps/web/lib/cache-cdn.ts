/**
 * En-têtes de cache CDN pour les réponses PUBLIQUES (identiques pour tous les
 * visiteurs). Une réponse servie depuis le cache du CDN Vercel n'exécute
 * aucune fonction : ni invocation, ni CPU, ni transfert d'origine — les trois
 * postes qui dépassaient les plafonds.
 *
 * `Vercel-CDN-Cache-Control` pilote le CDN Vercel et a priorité sur
 * `Cache-Control` (que vercel.json force à `no-store` sur /api/* pour le
 * navigateur). Le navigateur, lui, ne garde rien (`max-age=0`).
 *
 * ⚠️ À n'utiliser QUE pour des réponses sans aucune donnée propre à un
 * utilisateur : sinon un visiteur recevrait la réponse d'un autre.
 */
function enTetes(secondes: number, stale: number): Record<string, string> {
  return {
    "Cache-Control": `public, max-age=0, s-maxage=${secondes}, stale-while-revalidate=${stale}`,
    "Vercel-CDN-Cache-Control": `max-age=${secondes}, stale-while-revalidate=${stale}`,
  };
}

/** Fiches, recommandations, configuration publique : 5 min (+10 min en stale). */
export const CACHE_PUBLIC = enTetes(300, 600);

/**
 * Données dont une correction doit se voir vite (taux de change : le prix
 * affiché doit rester celui qui sera débité) : 1 min (+2 min en stale). La
 * fonction ne tourne plus qu'une fois par minute et par région, au lieu
 * d'une fois par visiteur.
 */
export const CACHE_COURT = enTetes(60, 120);
