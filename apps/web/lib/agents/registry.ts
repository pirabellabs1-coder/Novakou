/** Registre des 5 agents IA de Novakou. Source de vérité des métadonnées. */

export type AgentKey = "assistant" | "support" | "moderation" | "kyc" | "retention";

export interface AgentDef {
  key: AgentKey;
  name: string;
  emoji: string;
  description: string;
  /** Ce que l'agent sait faire, affiché dans le tableau de bord. */
  capabilities: string[];
  /** Cadence indicative (pour l'affichage ; le cron réel est dans vercel.json). */
  cadence: string;
  /** Nécessite un LLM serveur pour donner sa pleine valeur ? */
  needsLlm: boolean;
}

export const AGENTS: AgentDef[] = [
  {
    key: "assistant",
    name: "Assistant — votre bras droit",
    emoji: "🧑‍💼",
    description:
      "Surveille toute la plateforme et vous envoie un rapport quotidien + des alertes immédiates (anomalie financière, litige, pic d'abandons, dossiers en attente).",
    capabilities: ["Rapport quotidien par e-mail", "Alertes (fraude, litiges, KYC en attente)", "Synthèse des chiffres clés"],
    cadence: "Tous les jours à 7 h + à la demande",
    needsLlm: false,
  },
  {
    key: "support",
    name: "Support client",
    emoji: "🛟",
    description:
      "Repère les messages d'acheteurs sans réponse et prépare une réponse (validée par vous pour les cas sensibles, automatique pour les questions simples).",
    capabilities: ["Détecte les messages sans réponse", "Rédige des réponses", "Escalade les cas complexes"],
    cadence: "Toutes les 30 min",
    needsLlm: true,
  },
  {
    key: "moderation",
    name: "Modération",
    emoji: "🛡️",
    description:
      "Analyse les nouveaux produits, avis et messages pour détecter le contenu interdit ou frauduleux, et propose de masquer/signaler.",
    capabilities: ["Scan produits / avis / messages", "Détection de contenu interdit", "Propose masquage / signalement"],
    cadence: "Toutes les heures",
    needsLlm: false,
  },
  {
    key: "kyc",
    name: "Vérification KYC",
    emoji: "🆔",
    description:
      "Pré-analyse les dossiers KYC en attente (complétude, cohérence) et recommande approbation ou rejet avec un motif. Vous gardez la décision finale.",
    capabilities: ["Contrôle de complétude", "Recommandation approuver / rejeter", "Motif rédigé"],
    cadence: "Toutes les 2 h",
    needsLlm: false,
  },
  {
    key: "retention",
    name: "Rétention & croissance",
    emoji: "📈",
    description:
      "Identifie les acheteurs inactifs et les opportunités, et prépare des relances / suggestions de campagnes pour faire revenir les clients.",
    capabilities: ["Détecte les inactifs", "Relances de réactivation", "Suggestions de campagnes"],
    cadence: "Tous les jours à 9 h",
    needsLlm: false,
  },
];

export function getAgentDef(key: string): AgentDef | undefined {
  return AGENTS.find((a) => a.key === key);
}
