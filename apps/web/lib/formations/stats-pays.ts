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
  /** Type d'evenement. Requis pour le taux de rebond, ignore ailleurs. */
  type?: string | null;
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


// ── Taux de rebond ────────────────────────────────────────────────────────

/**
 * Types d'evenements qui sont des CONSULTATIONS. Tout le reste — clic, ajout
 * au panier, checkout, achat, recherche, message — est une INTERACTION.
 */
const TYPES_VUE = new Set([
  "page_view",
  "product_view",
  "formation_view",
  "shop_view",
  "mentor_view",
  "affiliate_landing_view",
  "profile_viewed",
  "service_viewed", // legacy
  "formation_viewed", // legacy
]);

export interface Rebond {
  /** Sessions retenues dans le calcul. */
  sessions: number;
  /** Sessions ayant rebondi. */
  rebonds: number;
  /** Pourcentage a une decimale, ou null faute de donnees. */
  taux: number | null;
}

/**
 * Part des visiteurs repartis sans rien faire.
 *
 * Definition retenue : une session rebondit si elle n'a vu QU'UNE page chez ce
 * vendeur ET n'a declenche AUCUNE interaction. Un visiteur qui atterrit sur une
 * seule fiche mais clique « Acheter » n'est donc PAS un rebond — le compter
 * comme tel donnerait au vendeur un chiffre decourageant et faux.
 *
 * Le taux vaut null, et non zero, quand aucune session n'a ete observee :
 * « 0 % de rebond » se lit comme une excellente nouvelle alors que cela
 * signifie « aucune donnee ». L'ecran doit afficher « — ».
 *
 * @param evenements evenements DEJA restreints au perimetre du vendeur. Un
 *                   visiteur qui lit trois pages CHEZ UN AUTRE vendeur puis une
 *                   seule chez celui-ci a bien rebondi ici.
 */
export function tauxRebond(evenements: readonly EvenementSuivi[]): Rebond {
  const vuesParSession = new Map<string, number>();
  const aInteragi = new Set<string>();

  for (const e of evenements) {
    // Un evenement sans type vient d'une collecte ancienne : on le traite en
    // consultation, jamais en interaction — surestimer l'engagement flatterait
    // le chiffre.
    if (!e.type || TYPES_VUE.has(e.type)) {
      vuesParSession.set(e.sessionId, (vuesParSession.get(e.sessionId) ?? 0) + 1);
    } else {
      aInteragi.add(e.sessionId);
      if (!vuesParSession.has(e.sessionId)) vuesParSession.set(e.sessionId, 0);
    }
  }

  const sessions = vuesParSession.size;
  if (sessions === 0) return { sessions: 0, rebonds: 0, taux: null };

  let rebonds = 0;
  for (const [sessionId, vues] of vuesParSession) {
    if (vues <= 1 && !aInteragi.has(sessionId)) rebonds++;
  }

  return { sessions, rebonds, taux: Math.round((rebonds / sessions) * 1000) / 10 };
}
