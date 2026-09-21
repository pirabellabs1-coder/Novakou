/**
 * Registre des agents IA de Novakou.
 *
 * ── Phase 2026-09-21 ───────────────────────────────────────────────────────
 * L'ancien tableau de bord (9 agents : assistant, support, modération, KYC,
 * rétention, finance, avis, onboarding, contenu) est retiré — décision
 * fondateur. Il n'était d'ailleurs jamais exécuté : le cron qui le faisait
 * tourner n'était pas planifié dans `vercel.json`.
 *
 * À la place : DEUX agents autonomes, seuls juges de la vérification KYC et
 * de la validation des fiches produit. Contrairement à l'ancien système
 * (`risk: "sensitive"` partout → recommandation seulement, décision humaine
 * obligatoire), ceux-ci DÉCIDENT — approuvent ou refusent, avec un motif
 * envoyé à la personne. Aucune intervention admin n'est requise pour qu'une
 * décision s'applique.
 *
 * Les tables `AiAgent` / `AgentRun` / `AgentAction` (Prisma) sont conservées
 * telles quelles : leur conception — un `risk` bas et une autonomie « auto »
 * suffisent à l'auto-exécution — convenait déjà exactement à ce besoin.
 */

export type AgentKey = "kyc_verification" | "product_verification";

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
  capabilities: string[];
  cadence: string;
  needsLlm: boolean;
  config: ConfigField[];
}

/** Consignes personnalisées : présentes sur les deux agents (cadrage IA). */
const INSTRUCTIONS = (placeholder: string): ConfigField => ({
  key: "instructions",
  label: "Consignes personnalisées (entraînement)",
  type: "textarea",
  default: "",
  hint: `Guidez l'agent : priorités, rigueur, cas particuliers. ${placeholder}`,
});

export const AGENTS: AgentDef[] = [
  {
    key: "kyc_verification",
    name: "Vérification KYC",
    emoji: "🆔",
    description:
      "Analyse chaque dossier KYC (pièce recto/verso + selfie) et DÉCIDE — approuve ou refuse avec un motif écrit envoyé à la personne. Aucune validation admin requise.",
    capabilities: [
      "Lecture des photos (netteté, légitimité, complétude)",
      "Décision autonome : approuve ou refuse",
      "Motif de refus rédigé et envoyé à l'utilisateur",
    ],
    cadence: "Toutes les 15 min",
    needsLlm: true,
    config: [
      { key: "batchSize", label: "Dossiers traités par passage", type: "number", default: 15, min: 1, max: 100, hint: "Limite le nombre de dossiers analysés à chaque exécution (coût/temps)." },
      INSTRUCTIONS("Ex. « Sois strict sur le flou et les photos de photos. »"),
    ],
  },
  {
    key: "product_verification",
    name: "Validation des fiches",
    emoji: "🛡️",
    description:
      "Analyse les formations et produits en attente de validation (titre, description, prix, images) et DÉCIDE — publie ou refuse avec un motif écrit envoyé au vendeur.",
    capabilities: [
      "Lecture des images (vignette, bannière)",
      "Cohérence titre / description / prix",
      "Décision autonome : publie ou refuse",
    ],
    cadence: "Toutes les 15 min",
    needsLlm: true,
    config: [
      { key: "batchSize", label: "Fiches traitées par passage", type: "number", default: 15, min: 1, max: 100, hint: "Limite le nombre de fiches analysées à chaque exécution (coût/temps)." },
      INSTRUCTIONS("Ex. « Sois strict sur la contrefaçon et les promesses de gains. »"),
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
