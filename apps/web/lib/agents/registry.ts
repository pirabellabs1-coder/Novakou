/** Registre des 5 agents IA de Novakou. Source de vérité des métadonnées. */

export type AgentKey =
  | "assistant" | "support" | "moderation" | "kyc" | "retention"
  | "finance" | "reviews" | "onboarding" | "content";

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
  {
    key: "finance",
    name: "Finance & anti-fraude",
    emoji: "💰",
    description:
      "Surveille les retraits et transactions : repère les montants élevés et les schémas suspects, et vous alerte avant d'approuver.",
    capabilities: ["Détecte les retraits élevés", "Repère les schémas suspects", "Alerte avant paiement"],
    cadence: "Toutes les heures",
    needsLlm: false,
  },
  {
    key: "reviews",
    name: "Avis & réputation",
    emoji: "⭐",
    description:
      "Surveille les avis : signale immédiatement les avis négatifs à traiter pour protéger votre réputation et celle de vos vendeurs.",
    capabilities: ["Détecte les avis négatifs", "Alerte pour réponse rapide", "Suivi de réputation"],
    cadence: "Toutes les heures",
    needsLlm: false,
  },
  {
    key: "onboarding",
    name: "Onboarding vendeur",
    emoji: "🎓",
    description:
      "Repère les vendeurs bloqués (produit en brouillon jamais publié) et propose un accompagnement pour débloquer leurs premières ventes.",
    capabilities: ["Détecte les vendeurs bloqués", "Propose un accompagnement", "Active les nouveaux vendeurs"],
    cadence: "Tous les jours",
    needsLlm: false,
  },
  {
    key: "content",
    name: "Contenu & SEO",
    emoji: "✍️",
    description:
      "Analyse les fiches produits publiées et repère celles qui vendent mal (description trop courte, vignette manquante) pour les améliorer.",
    capabilities: ["Détecte les fiches faibles", "Suggère des améliorations", "Optimise pour la recherche"],
    cadence: "Tous les jours",
    needsLlm: false,
  },
];

export function getAgentDef(key: string): AgentDef | undefined {
  return AGENTS.find((a) => a.key === key);
}
