// ============================================================
// Novakou — Plan Rules & Enforcement (Modèle "Élévation")
// Authoritative source of truth for subscription plan limits
// ============================================================

export const PLAN_RULES = {
  DECOUVERTE: {
    name: "Découverte",
    nameEn: "Discovery",
    commissionType: "percentage" as const,
    commissionValue: 12, // 12%
    priceMonthly: 0,
    priceAnnual: 0,
    serviceLimit: 5,
    applicationLimit: 10,
    boostLimit: 0,
    scenarioLimit: 0,
    productiviteAccess: false,
    teamLimit: 0,
    crmAccess: false,
    cloudStorageGB: 0,
    apiAccess: false,
    supportLevel: "email" as const,
  },
  ASCENSION: {
    name: "Ascension",
    nameEn: "Ascension",
    commissionType: "percentage" as const,
    commissionValue: 5, // 5%
    priceMonthly: 15,
    priceAnnual: 135, // 15 × 12 × 0.75
    serviceLimit: 15,
    applicationLimit: 30,
    boostLimit: 3,
    scenarioLimit: 3,
    productiviteAccess: false,
    teamLimit: 0,
    crmAccess: false,
    cloudStorageGB: 0,
    apiAccess: false,
    supportLevel: "prioritaire" as const,
  },
  SOMMET: {
    name: "Sommet",
    nameEn: "Summit",
    commissionType: "fixed" as const,
    commissionValue: 1, // 1 EUR fixed per sale
    priceMonthly: 29.99,
    priceAnnual: 269.91, // 29.99 × 12 × 0.75
    serviceLimit: Infinity,
    applicationLimit: Infinity,
    boostLimit: 10,
    scenarioLimit: 10,
    productiviteAccess: true,
    teamLimit: 0,
    crmAccess: false,
    cloudStorageGB: 0,
    apiAccess: true,
    supportLevel: "dedie" as const,
  },
  AGENCE_STARTER: {
    name: "Agence Starter",
    nameEn: "Agency Starter",
    commissionType: "percentage" as const,
    commissionValue: 5, // 5%
    priceMonthly: 20,
    priceAnnual: 180, // 20 × 12 × 0.75
    serviceLimit: Infinity,
    applicationLimit: Infinity,
    boostLimit: 5,
    scenarioLimit: 3,
    productiviteAccess: false,
    teamLimit: 5,
    crmAccess: true,
    cloudStorageGB: 10,
    apiAccess: false,
    supportLevel: "prioritaire" as const,
  },
  EMPIRE: {
    name: "Empire",
    nameEn: "Empire",
    commissionType: "fixed" as const,
    commissionValue: 0, // 0% — ZERO commission
    priceMonthly: 65,
    priceAnnual: 585, // 65 × 12 × 0.75
    serviceLimit: Infinity,
    applicationLimit: Infinity,
    boostLimit: 20,
    scenarioLimit: Infinity,
    productiviteAccess: true,
    teamLimit: 25,
    crmAccess: true,
    cloudStorageGB: 100,
    apiAccess: true,
    supportLevel: "vip" as const,
  },
} as const;

export type PlanName = keyof typeof PLAN_RULES;

/** Full plan config as served by /api/plans/live (admin overrides merged on defaults) */
export interface LivePlanConfig {
  name: string;
  nameEn: string;
  commissionType: "percentage" | "fixed";
  commissionValue: number;
  priceMonthly: number;
  priceAnnual: number;
  serviceLimit: number;
  applicationLimit: number;
  boostLimit: number;
  scenarioLimit: number;
  productiviteAccess: boolean;
  teamLimit: number;
  crmAccess: boolean;
  cloudStorageGB: number;
  apiAccess: boolean;
  supportLevel: "email" | "prioritaire" | "dedie" | "vip";
  features: string[];
}

/** Lowercase plan IDs for client-side / JWT usage */
export type PlanId = "decouverte" | "ascension" | "sommet" | "agence_starter" | "empire";

/** Ordered list of plan IDs (for UI iteration) */
export const PLAN_ORDER: PlanName[] = ["DECOUVERTE", "ASCENSION", "SOMMET", "AGENCE_STARTER", "EMPIRE"];

/** Display names for each plan */
export const PLAN_DISPLAY_NAMES: Record<PlanName, { fr: string; en: string }> = {
  DECOUVERTE: { fr: "Découverte", en: "Discovery" },
  ASCENSION: { fr: "Ascension", en: "Ascension" },
  SOMMET: { fr: "Sommet", en: "Summit" },
  AGENCE_STARTER: { fr: "Agence Starter", en: "Agency Starter" },
  EMPIRE: { fr: "Empire", en: "Empire" },
};

/** Feature lists for UI display per plan */
export const PLAN_FEATURES: Record<PlanName, string[]> = {
  DECOUVERTE: [
    "5 services actifs",
    "10 candidatures/mois",
    "Commission 12%",
    "Support email",
    "Profil public",
  ],
  ASCENSION: [
    "15 services actifs",
    "30 candidatures/mois",
    "Commission 5%",
    "3 boosts/mois",
    "3 scénarios automatisés",
    "Statistiques avancées",
    "Support prioritaire",
  ],
  SOMMET: [
    "Services illimités",
    "Candidatures illimitées",
    "Commission 1€/vente",
    "10 boosts/mois",
    "10 scénarios automatisés",
    "Outils de productivité",
    "Clés API & Webhooks",
    "Support dédié",
  ],
  AGENCE_STARTER: [
    "Services illimités",
    "Candidatures illimitées",
    "Commission 5%",
    "5 boosts/mois",
    "Jusqu'à 5 membres",
    "CRM clients",
    "10 GB stockage",
    "Support prioritaire",
  ],
  EMPIRE: [
    "Services illimités",
    "Candidatures illimitées",
    "0% commission",
    "20 boosts/mois",
    "Scénarios illimités",
    "Outils de productivité",
    "Jusqu'à 25 membres d'équipe",
    "CRM clients intégré",
    "100 GB cloud partagé",
    "Clés API & Webhooks",
    "Support VIP dédié",
  ],
};

/** Mapping between old DB enum names and new plan names */
const LEGACY_TO_NEW: Record<string, PlanName> = {
  GRATUIT: "DECOUVERTE",
  FREE: "DECOUVERTE",
  PRO: "ASCENSION",
  BUSINESS: "SOMMET",
  AGENCE: "EMPIRE",
  AGENCY: "EMPIRE",
  // New names (already correct)
  DECOUVERTE: "DECOUVERTE",
  ASCENSION: "ASCENSION",
  SOMMET: "SOMMET",
  AGENCE_STARTER: "AGENCE_STARTER",
  AGENCY_STARTER: "AGENCE_STARTER",
  EMPIRE: "EMPIRE",
};

/** Mapping from new plan names back to DB enum values */
export const NEW_TO_DB: Record<PlanName, string> = {
  DECOUVERTE: "GRATUIT",
  ASCENSION: "PRO",
  SOMMET: "BUSINESS",
  AGENCE_STARTER: "AGENCE_STARTER",
  EMPIRE: "AGENCE",
};

/** Which plans are visible to each role */
export const PLAN_VISIBILITY: Record<string, PlanName[]> = {
  freelance: ["DECOUVERTE", "ASCENSION", "SOMMET"],
  agence: ["AGENCE_STARTER", "EMPIRE"],
};

/**
 * Calculate the commission amount in cents for a given plan and sale amount (in cents).
 */
export function calculateCommission(plan: PlanName, saleAmountCents: number): number {
  const rules = PLAN_RULES[plan];
  if (rules.commissionValue === 0) return 0;
  if (rules.commissionType === "percentage") {
    return Math.round(saleAmountCents * rules.commissionValue / 100);
  }
  return rules.commissionValue * 100; // 1 EUR = 100 cents
}

/**
 * Calculate the commission for amounts expressed in EUR (not cents).
 * Returns the commission in EUR.
 */
export function calculateCommissionEur(plan: PlanName, saleAmountEur: number): number {
  const rules = PLAN_RULES[plan];
  if (rules.commissionValue === 0) return 0;
  if (rules.commissionType === "percentage") {
    return Math.round(saleAmountEur * rules.commissionValue) / 100;
  }
  return rules.commissionValue; // 1 EUR flat
}

/**
 * Get the commission description string for display purposes.
 */
export function getCommissionLabel(plan: PlanName): string {
  const rules = PLAN_RULES[plan];
  if (rules.commissionValue === 0) return "0%";
  if (rules.commissionType === "percentage") {
    return `${rules.commissionValue}%`;
  }
  return `${rules.commissionValue}€/vente`;
}

export function canCreateService(plan: PlanName, currentCount: number): boolean {
  return currentCount < PLAN_RULES[plan].serviceLimit;
}

export function canApply(plan: PlanName, monthlyCount: number): boolean {
  return monthlyCount < PLAN_RULES[plan].applicationLimit;
}

export function canBoost(plan: PlanName, monthlyCount: number): boolean {
  return monthlyCount < PLAN_RULES[plan].boostLimit;
}

export function canCreateScenario(plan: PlanName, currentCount: number): boolean {
  return currentCount < PLAN_RULES[plan].scenarioLimit;
}

export function hasProductiviteAccess(plan: PlanName): boolean {
  return PLAN_RULES[plan].productiviteAccess;
}

export function hasTeamAccess(plan: PlanName): boolean {
  return PLAN_RULES[plan].teamLimit > 0;
}

export function hasCrmAccess(plan: PlanName): boolean {
  return PLAN_RULES[plan].crmAccess;
}

export function hasApiAccess(plan: PlanName): boolean {
  return PLAN_RULES[plan].apiAccess;
}

export function getPlanLimits(plan: PlanName) {
  return PLAN_RULES[plan];
}

/**
 * Normalize a plan string (from session/DB/JWT) to a valid PlanName.
 * Handles legacy names (GRATUIT→DECOUVERTE, PRO→ASCENSION, etc.)
 */
export function normalizePlanName(plan: string | undefined | null): PlanName {
  if (!plan) return "DECOUVERTE";
  const upper = plan.toUpperCase();
  return LEGACY_TO_NEW[upper] || "DECOUVERTE";
}

/**
 * Convert a PlanName to its lowercase PlanId for JWT / client usage.
 */
export function planNameToId(plan: PlanName): PlanId {
  return plan.toLowerCase() as PlanId;
}

/**
 * Convert a PlanId to PlanName.
 */
export function planIdToName(id: string): PlanName {
  return normalizePlanName(id);
}

/**
 * Format a limit value for display (handles Infinity).
 */
export function formatLimit(value: number): string {
  if (!isFinite(value)) return "Illimité";
  return String(value);
}

/**
 * Format usage display: "used/limit" or "used/Illimité".
 */
export function formatUsage(used: number, limit: number): string {
  if (!isFinite(limit)) return `${used} / Illimité`;
  return `${used} / ${limit}`;
}

/**
 * Get remaining count for a limit.
 */
export function getRemainingCount(used: number, limit: number): number {
  if (!isFinite(limit)) return Infinity;
  return Math.max(0, limit - used);
}

// NOTE: useLivePlans() hook is in lib/use-live-plans.ts (separate "use client" file)
// to avoid importing React hooks in server-side code that imports lib/plans.ts
