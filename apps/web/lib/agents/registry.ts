/**
 * Registre des agents IA autonomes de Novakou.
 *
 * Phase 2026-09-23 : 8 agents actifs.
 *
 * Chaque agent DÉCIDE (n'ébauche pas une recommandation à valider). L'admin
 * garde la visibilité via `/admin/agents`, coupe un interrupteur si besoin,
 * ajuste les consignes d'entraînement — mais rien n'exige son intervention
 * pour qu'une décision s'applique.
 *
 * Les tables `AiAgent` / `AgentRun` / `AgentAction` (Prisma) sont conservées
 * et suffisent pour l'auto-exécution via `risk:"low"` + `autonomy:"auto"`.
 */

export type AgentKey =
  | "kyc_verification"
  | "product_verification"
  | "buyer_support"
  | "fraud_detection"
  | "reviews_moderation"
  | "dispute_resolution"
  | "vendor_coach"
  | "account_deletion";

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

const INSTRUCTIONS = (placeholder: string): ConfigField => ({
  key: "instructions",
  label: "Consignes personnalisées (entraînement)",
  type: "textarea",
  default: "",
  hint: `Guidez l'agent : priorités, rigueur, cas particuliers. ${placeholder}`,
});

const BATCH = (defaut: number, max = 100): ConfigField => ({
  key: "batchSize",
  label: "Éléments traités par passage",
  type: "number",
  default: defaut,
  min: 1,
  max,
  hint: "Limite le nombre d'éléments analysés à chaque exécution (coût/temps).",
});

export const AGENTS: AgentDef[] = [
  {
    key: "kyc_verification",
    name: "Vérification KYC",
    emoji: "🆔",
    description:
      "Analyse chaque dossier KYC (pièce recto/verso + selfie + identité déclarée) et DÉCIDE — approuve ou refuse avec un motif écrit envoyé à la personne. Vérifie que le nom déclaré correspond à ce qui est lisible sur la pièce, et prend en compte le contexte du compte (pays, ancienneté, historique).",
    capabilities: [
      "Lecture des photos + comparaison à l'identité déclarée",
      "Contexte compte : pays, ancienneté, historique",
      "Décision autonome : approuve ou refuse",
    ],
    cadence: "Toutes les 15 min",
    needsLlm: true,
    config: [BATCH(15), INSTRUCTIONS("Ex. « Sois strict sur le flou et sur les incohérences de nom. »")],
  },
  {
    key: "product_verification",
    name: "Validation des fiches",
    emoji: "🛡️",
    description:
      "Analyse les formations et produits en attente (titre, description, prix, images) et DÉCIDE — publie ou refuse avec un motif. Le prix seul n'est JAMAIS un motif de refus, ni le fait d'être un nouveau vendeur. Seuls la fraude, l'illégal et la tromperie manifeste bloquent la publication.",
    capabilities: [
      "Lecture des images (vignette, bannière)",
      "Contexte vendeur : KYC, ancienneté, historique de vente",
      "Décision autonome : publie ou refuse",
    ],
    cadence: "Toutes les 15 min",
    needsLlm: true,
    config: [BATCH(15), INSTRUCTIONS("Ex. « Sois strict sur les promesses de gains et les images volées. »")],
  },
  {
    key: "buyer_support",
    name: "Support acheteur",
    emoji: "🛟",
    description:
      "Lit les messages entrants des acheteurs (aux vendeurs ou au support) qui sont sans réponse depuis un certain temps. Répond DIRECTEMENT dans la conversation aux questions récurrentes (comment télécharger, comment payer, délais), signale les cas sensibles (remboursement, litige) au vendeur/admin.",
    capabilities: [
      "Réponse temps réel aux questions récurrentes",
      "Détection de cas sensibles (remboursement, litige)",
      "Signature « L'équipe Novakou »",
    ],
    cadence: "Toutes les 15 min",
    needsLlm: true,
    config: [
      { key: "unrepliedHours", label: "Délai avant réponse", type: "number", default: 2, min: 1, max: 72, suffix: "heures", hint: "Message resté sans réponse depuis ce délai." },
      BATCH(10),
      INSTRUCTIONS("Ex. « Ton chaleureux, vouvoiement. Ne jamais promettre de remboursement sans admin. »"),
    ],
  },
  {
    key: "fraud_detection",
    name: "Anti-fraude paiements & retraits",
    emoji: "🛡️",
    description:
      "Surveille les tentatives de paiement et les demandes de retrait, détecte les schémas suspects (compte-relais, cartes multiples, retrait immédiat post-encaissement sur compte neuf) et SUSPEND autonomement les comptes concernés (réversible). Alerte l'admin par e-mail + Telegram.",
    capabilities: [
      "Analyse des CheckoutAttempt récents",
      "Analyse des demandes de retrait",
      "Suspension réversible + alerte admin",
    ],
    cadence: "Toutes les 15 min",
    needsLlm: true,
    config: [
      { key: "fenetreHeures", label: "Fenêtre d'analyse", type: "number", default: 24, min: 1, max: 168, suffix: "heures", hint: "Regarde les événements sur cette période." },
      { key: "seuilRetraitCompteNeufFcfa", label: "Seuil retrait sur compte neuf", type: "number", default: 100000, min: 1000, max: 100000000, suffix: "FCFA", hint: "Retrait supérieur sur un compte de moins de 7 jours = signal fort." },
      INSTRUCTIONS("Ex. « Sois strict quand pays du profil et pays du téléphone divergent. »"),
    ],
  },
  {
    key: "reviews_moderation",
    name: "Modération avis",
    emoji: "⭐",
    description:
      "Lit chaque nouvel avis (produits et formations) et SUPPRIME autonomement ceux qui sont manifestement faux (avis d'un acheteur qui n'a rien acheté, auto-avis, insultes, hors-sujet). Un motif est envoyé à l'auteur de l'avis supprimé.",
    capabilities: [
      "Détection de faux avis et auto-avis",
      "Détection d'insultes et hors-sujet",
      "Suppression autonome + notification",
    ],
    cadence: "Toutes les heures",
    needsLlm: true,
    config: [BATCH(20), INSTRUCTIONS("Ex. « Sois strict sur les avis 1★ sans commentaire ou avec commentaire copié. »")],
  },
  {
    key: "dispute_resolution",
    name: "Résolution des litiges",
    emoji: "⚖️",
    description:
      "Lit chaque demande de remboursement, examine le contexte (type de produit, statut de livraison, historique de l'acheteur, réponse du vendeur) et DÉCIDE en dessous d'un plafond configurable — remboursement intégral, refus. Au-dessus du plafond, escalade humaine.",
    capabilities: [
      "Analyse contextuelle du litige",
      "Décision autonome sous plafond",
      "Escalade admin au-dessus",
    ],
    cadence: "Toutes les heures",
    needsLlm: true,
    config: [
      { key: "plafondAutoFcfa", label: "Plafond d'auto-décision", type: "number", default: 25000, min: 0, max: 500000, suffix: "FCFA", hint: "Au-dessus, l'agent alerte l'admin sans décider." },
      BATCH(10),
      INSTRUCTIONS("Ex. « Rembourse dès qu'un fichier acheté ne correspond pas à la fiche. »"),
    ],
  },
  {
    key: "vendor_coach",
    name: "Coach vendeur",
    emoji: "🎓",
    description:
      "Détecte les vendeurs qui décrochent (brouillon jamais publié, produit sans vente malgré du trafic, KYC abandonné avant retrait) et leur envoie AUTONOMEMENT un message personnalisé pour les aider à débloquer leur situation. Uniquement des messages, aucun impact financier.",
    capabilities: [
      "Détection de vendeurs bloqués",
      "Messages personnalisés (par notification)",
      "Aucun risque financier",
    ],
    cadence: "Une fois par jour",
    needsLlm: true,
    config: [
      { key: "brouillonJours", label: "Brouillon considéré bloqué", type: "number", default: 5, min: 1, max: 90, suffix: "jours" },
      { key: "sansVenteJours", label: "Produit publié sans vente", type: "number", default: 30, min: 7, max: 180, suffix: "jours" },
      BATCH(30),
      INSTRUCTIONS("Ex. « Propose des pistes concrètes, jamais de bon promo. »"),
    ],
  },
  {
    key: "account_deletion",
    name: "Suppression de compte",
    emoji: "🗑️",
    description:
      "Traite les demandes de suppression de compte AWAITING_REVIEW (après le délai de rétractation de 72 h). Vérifie les conditions (solde nul, aucun litige actif, aucune vente non livrée) et APPROUVE ou REFUSE autonomement avec un motif écrit.",
    capabilities: [
      "Vérification du solde et des engagements",
      "Décision autonome : approuve ou refuse",
      "Motif écrit envoyé à la personne",
    ],
    cadence: "Toutes les heures",
    needsLlm: false,
    config: [BATCH(20), INSTRUCTIONS("Ex. « Refuse toute demande d'un compte avec solde non retiré. »")],
  },
];

export function defaultConfig(key: string): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const f of getAgentDef(key)?.config ?? []) out[f.key] = f.default;
  return out;
}

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
