// ============================================================
// FreelanceHigh — Plan Rules & Enforcement
// Authoritative source of truth for subscription plan limits
// ============================================================

export const PLAN_RULES = {
  GRATUIT: {
    name: "Gratuit",
    commissionType: "percentage" as const,
    commissionValue: 12, // 12%
    serviceLimit: 7,
    applicationLimit: 10,
    boostLimit: 0,
    scenarioLimit: 0,
    certificationLimit: 0,
    productiviteAccess: false,
  },
  PRO: {
    name: "Pro",
    commissionType: "fixed" as const,
    commissionValue: 1, // 1 EUR
    serviceLimit: Infinity,
    applicationLimit: 20,
    boostLimit: 5,
    scenarioLimit: 5,
    certificationLimit: 3,
    productiviteAccess: true,
  },
  BUSINESS: {
    name: "Business",
    commissionType: "fixed" as const,
    commissionValue: 1, // 1 EUR
    serviceLimit: Infinity,
    applicationLimit: Infinity,
    boostLimit: 10,
    scenarioLimit: 15,
    certificationLimit: Infinity,
    productiviteAccess: true,
  },
  AGENCE: {
    name: "Agence",
    commissionType: "fixed" as const,
    commissionValue: 1, // 1 EUR
    serviceLimit: Infinity,
    applicationLimit: Infinity,
    boostLimit: 10,
    scenarioLimit: Infinity,
    certificationLimit: Infinity,
    productiviteAccess: true,
  },
} as const;

export type PlanName = keyof typeof PLAN_RULES;

/**
 * Calculate the commission amount in cents for a given plan and sale amount (in cents).
 * - Gratuit: 12% of the sale amount
 * - Pro/Business/Agence: flat 1 EUR = 100 cents
 */
export function calculateCommission(plan: PlanName, saleAmountCents: number): number {
  const rules = PLAN_RULES[plan];
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
  if (rules.commissionType === "percentage") {
    return `${rules.commissionValue}%`;
  }
  return `${rules.commissionValue} EUR/vente`;
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

export function canTakeCertification(plan: PlanName, monthlyCount: number): boolean {
  return monthlyCount < PLAN_RULES[plan].certificationLimit;
}

export function hasProductiviteAccess(plan: PlanName): boolean {
  return PLAN_RULES[plan].productiviteAccess;
}

export function getPlanLimits(plan: PlanName) {
  return PLAN_RULES[plan];
}

/**
 * Normalize a plan string (from session/DB) to a valid PlanName.
 * Handles case insensitivity, aliases (e.g. "free" -> "GRATUIT"), and defaults to GRATUIT.
 */
export function normalizePlanName(plan: string | undefined | null): PlanName {
  if (!plan) return "GRATUIT";
  const upper = plan.toUpperCase();
  if (upper in PLAN_RULES) return upper as PlanName;
  // Handle common aliases
  if (upper === "FREE" || upper === "GRATUIT") return "GRATUIT";
  if (upper === "AGENCY") return "AGENCE";
  return "GRATUIT";
}

/**
 * Format a limit value for display (handles Infinity).
 */
export function formatLimit(value: number): string {
  if (!isFinite(value)) return "Illimite";
  return String(value);
}

/**
 * Format usage display: "used/limit" or "used/Illimite".
 */
export function formatUsage(used: number, limit: number): string {
  if (!isFinite(limit)) return `${used} / Illimite`;
  return `${used} / ${limit}`;
}

/**
 * Get remaining count for a limit.
 */
export function getRemainingCount(used: number, limit: number): number {
  if (!isFinite(limit)) return Infinity;
  return Math.max(0, limit - used);
}
