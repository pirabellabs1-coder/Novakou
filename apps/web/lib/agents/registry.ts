/** Registre des 5 agents IA de Novakou. Source de vérité des métadonnées. */

export type AgentKey =
  | "assistant" | "support" | "moderation" | "kyc" | "retention"
  | "finance" | "reviews" | "onboarding" | "content";

/** Un réglage « entraînable » d'un agent (seuil, fenêtre, consignes…). */
export interface ConfigField {
  key: string;
  label: string;
  type: "number" | "text" | "textarea";
  default: number | string;
  hint?: string;
  min?: number;
  max?: number;
  suffix?: string;
}

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
  /** Réglages que l'admin peut ajuster pour « entraîner » l'agent. */
  config: ConfigField[];
}

/** Consignes personnalisées : présentes sur tous les agents (persona / cadrage IA). */
const INSTRUCTIONS = (placeholder: string): ConfigField => ({
  key: "instructions",
  label: "Consignes personnalisées (entraînement)",
  type: "textarea",
  default: "",
  hint: `Guidez l'agent : priorités, ton, règles maison. ${placeholder}`,
});

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
    config: [
      { key: "reportHour", label: "Heure d'envoi du rapport", type: "number", default: 7, min: 0, max: 23, hint: "Heure (0–23) à laquelle le rapport quotidien part." },
      { key: "alertAbandonedMin", label: "Seuil paniers abandonnés", type: "number", default: 5, min: 1, max: 999, suffix: "paniers / 24 h", hint: "Au-delà, l'agent vous alerte de penser aux relances." },
      INSTRUCTIONS("Ex. « Insiste sur les ventes et les litiges. »"),
    ],
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
    config: [
      { key: "unrepliedHours", label: "Délai avant signalement", type: "number", default: 2, min: 1, max: 72, suffix: "heures", hint: "Un message non lu depuis ce délai est signalé." },
      INSTRUCTIONS("Ex. « Ton chaleureux, vouvoiement, signe \"L'équipe Novakou\". »"),
    ],
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
    config: [
      { key: "scanWindowHours", label: "Fenêtre d'analyse", type: "number", default: 26, min: 1, max: 168, suffix: "heures", hint: "Analyse les contenus créés sur cette période." },
      { key: "bannedExtra", label: "Mots interdits supplémentaires", type: "textarea", default: "", hint: "Séparés par des virgules. S'ajoutent à la liste intégrée." },
      INSTRUCTIONS("Ex. « Sois strict sur la contrefaçon et les promesses de gains. »"),
    ],
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
    config: [
      { key: "agingAlertDays", label: "Alerte dossier en attente", type: "number", default: 2, min: 1, max: 30, suffix: "jours", hint: "Met en avant les dossiers en attente depuis plus longtemps." },
      INSTRUCTIONS("Ex. « Exige une pièce recto-verso et un selfie. »"),
    ],
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
    config: [
      { key: "inactiveDays", label: "Inactivité avant relance", type: "number", default: 30, min: 3, max: 365, suffix: "jours", hint: "Acheteurs sans reconnexion depuis ce délai." },
      { key: "minInactive", label: "Seuil de déclenchement", type: "number", default: 3, min: 1, max: 9999, suffix: "acheteurs", hint: "Nombre minimum d'inactifs pour proposer une campagne." },
      INSTRUCTIONS("Ex. « Propose un code promo -20 % pour les inactifs. »"),
    ],
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
    config: [
      { key: "highWithdrawalFcfa", label: "Seuil de retrait élevé", type: "number", default: 500000, min: 1000, max: 100000000, suffix: "FCFA", hint: "Tout retrait au-dessus est signalé pour double-vérification." },
      INSTRUCTIONS("Ex. « Vérifie aussi les vendeurs au KYC niveau 1. »"),
    ],
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
    config: [
      { key: "lowRatingMax", label: "Note « négative » jusqu'à", type: "number", default: 2, min: 1, max: 4, suffix: "/ 5", hint: "Les avis à cette note ou moins sont signalés." },
      { key: "lookbackHours", label: "Fenêtre de surveillance", type: "number", default: 26, min: 1, max: 168, suffix: "heures", hint: "Surveille les avis publiés sur cette période." },
      INSTRUCTIONS("Ex. « Priorise les avis avec commentaire détaillé. »"),
    ],
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
    config: [
      { key: "draftStaleDays", label: "Brouillon considéré bloqué", type: "number", default: 3, min: 1, max: 90, suffix: "jours", hint: "Un produit en brouillon plus longtemps = vendeur à accompagner." },
      INSTRUCTIONS("Ex. « Propose un appel d'aide pour la première mise en ligne. »"),
    ],
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
    config: [
      { key: "minDescLen", label: "Longueur min. de description", type: "number", default: 120, min: 20, max: 2000, suffix: "caractères", hint: "En dessous, la fiche est jugée trop courte." },
      INSTRUCTIONS("Ex. « Vise des descriptions orientées bénéfices et mots-clés. »"),
    ],
  },
];

/** Valeurs par défaut d'un agent (clé → valeur), à partir de son schéma de config. */
export function defaultConfig(key: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const f of getAgentDef(key)?.config ?? []) out[f.key] = f.default;
  return out;
}

/** Fusionne la config stockée avec les valeurs par défaut, en respectant les types et bornes. */
export function mergeConfig(key: string, stored: unknown): Record<string, string | number> {
  const out = defaultConfig(key);
  const s = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  for (const f of getAgentDef(key)?.config ?? []) {
    const v = s[f.key];
    if (v === undefined || v === null || v === "") continue;
    if (f.type === "number") {
      let n = Number(v);
      if (!Number.isFinite(n)) continue;
      if (f.min !== undefined) n = Math.max(f.min, n);
      if (f.max !== undefined) n = Math.min(f.max, n);
      out[f.key] = Math.round(n);
    } else {
      out[f.key] = String(v).slice(0, 4000);
    }
  }
  return out;
}

export function getAgentDef(key: string): AgentDef | undefined {
  return AGENTS.find((a) => a.key === key);
}
