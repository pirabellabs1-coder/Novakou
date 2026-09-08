// Agregation « visiteurs par pays » du tableau de statistiques vendeur.
//
// Sortie du route handler pour etre testable : c'est le seul endroit qui
// repond a « d'ou viennent mes visiteurs », et une derive y passerait
// inapercue — la page afficherait des chiffres plausibles mais faux.
//
// Couvert par tests/stats-pays.spec.ts.

import { toIso2 } from "@/lib/tracking/geo";

/** Pays inconnu : IP non geolocalisee, ou en-tete absent. */
export const PAYS_INCONNU = "??";

/**
 * Codes de DEUX LETTRES qui ne designent aucun pays.
 *
 * Cloudflare renvoie « XX » quand il ne sait pas geolocaliser, et « T1 » pour
 * une sortie Tor ; « ZZ » est le code ISO reserve a l'inconnu. La collecte les
 * accepte tels quels (tout en-tete de deux caracteres passe), et toIso2 les
 * laisse passer aussi puisqu'ils ont la FORME d'un code. Sans ce garde, le
 * vendeur verrait une ligne « XX » avec un drapeau casse, prise pour un pays.
 */
const NON_GEOGRAPHIQUES = new Set(["XX", "T1", "ZZ"]);

/** Code ISO-2 exploitable, ou PAYS_INCONNU. */
function paysAffichable(brut: string | null | undefined): string {
  const code = toIso2(brut);
  if (!code || NON_GEOGRAPHIQUES.has(code)) return PAYS_INCONNU;
  return code;
}

/** Le strict minimum dont l'agregation a besoin d'un evenement de suivi. */
export interface EvenementSuivi {
  sessionId: string;
  country?: string | null;
}

export interface VisiteursParPays {
  country: string;
  /** Sessions UNIQUES : un curieux qui ouvre huit fiches reste un visiteur. */
  visitors: number;
  /** Pages vues, toutes sessions confondues. */
  views: number;
}

/**
 * Repartit par pays les visiteurs d'un vendeur.
 *
 * @param evenements   evenements DEJA restreints au perimetre du vendeur.
 *                     Cette fonction ne filtre RIEN : lui passer les
 *                     evenements de toute la plateforme afficherait a chaque
 *                     vendeur le trafic de ses concurrents.
 * @param paysDeSession pays rattache a la session quand l'evenement n'en porte
 *                     pas — le premier appel d'une session le renseigne, les
 *                     suivants peuvent l'omettre.
 * @param limite       nombre de pays retournes, les plus frequentes d'abord.
 */
export function visiteursParPays(
  evenements: readonly EvenementSuivi[],
  paysDeSession: ReadonlyMap<string, string | null> = new Map(),
  limite = 15,
): VisiteursParPays[] {
  const sessions = new Map<string, Set<string>>();
  const vues = new Map<string, number>();

  for (const e of evenements) {
    const pays = paysAffichable(e.country || paysDeSession.get(e.sessionId));
    vues.set(pays, (vues.get(pays) ?? 0) + 1);
    let vus = sessions.get(pays);
    if (!vus) {
      vus = new Set();
      sessions.set(pays, vus);
    }
    vus.add(e.sessionId);
  }

  return [...sessions.entries()]
    .map(([country, sessionIds]) => ({
      country,
      visitors: sessionIds.size,
      views: vues.get(country) ?? 0,
    }))
    // A egalite de visiteurs, le pays le plus consulte passe devant.
    .sort((a, b) => b.visitors - a.visitors || b.views - a.views)
    .slice(0, limite);
}

/** Visiteurs uniques, tous pays confondus. Sert la ligne « Visiteurs » du tunnel. */
export function visiteursUniques(evenements: readonly EvenementSuivi[]): number {
  return new Set(evenements.map((e) => e.sessionId)).size;
}
