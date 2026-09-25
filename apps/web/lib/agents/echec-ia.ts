// Pourquoi un appel IA d'agent a échoué — et surtout : est-ce la FICHE qui pose
// problème, ou l'IA qui est indisponible ?
//
// La distinction est vitale. Quand l'IA est indisponible (crédit épuisé, clé
// refusée, réseau), aucune décision automatique ne doit être prise : le repli
// « publier après deux échecs » de l'agent Produits aurait sinon publié toutes
// les nouvelles fiches sans le moindre contrôle pendant la panne de crédit du
// 2026-09-24. Seul un échec propre au dossier (réponse illisible, image que le
// modèle ne peut pas ouvrir) compte pour les replis et les escalades.

export type EchecIA = {
  /** Vrai si l'IA elle-même est hors service : ne rien décider, réessayer plus tard. */
  indisponible: boolean;
  /** Motif lisible, repris dans le compte rendu de l'agent. */
  raison: string;
};

export const REPONSE_ILLISIBLE: EchecIA = {
  indisponible: false,
  raison: "réponse IA illisible (pas le JSON attendu)",
};

export function classerEchecIA(e: unknown): EchecIA {
  const m = e instanceof Error ? e.message : String(e);
  if (/HTTP 402/.test(m)) return { indisponible: true, raison: "crédit IA épuisé (OpenRouter)" };
  if (/OPENROUTER_API_KEY absente/.test(m)) return { indisponible: true, raison: "IA non configurée" };
  if (/HTTP 40[13]\b/.test(m)) return { indisponible: true, raison: "clé IA refusée" };
  if (/HTTP 429/.test(m)) return { indisponible: true, raison: "IA saturée (trop de requêtes)" };
  if (/HTTP 5\d\d|timeout|aborted|fetch failed|ECONN|ETIMEDOUT|sans contenu/i.test(m)) {
    return { indisponible: true, raison: "IA momentanément injoignable" };
  }
  return { indisponible: false, raison: `réponse IA inexploitable (${m.slice(0, 80)})` };
}

export function estEchec<T extends object>(r: T | EchecIA): r is EchecIA {
  return "indisponible" in r;
}
