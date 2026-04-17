/**
 * Unified badge computation for Novakou.
 * Single source of truth — ALL APIs must use this.
 * Format: Title Case, no accents.
 */

export interface BadgeInput {
  role?: string;       // "freelance" | "client" | "agence" | "admin"
  plan?: string | null; // "free" | "pro" | "business" | "agence"
  kyc?: number | null;  // 0-4
  kycLevel?: number | null; // alias for kyc (backward compat)
  avgRating: number;    // 0-5
  completedOrders: number;
  completionRate?: number; // 0-100
  createdAt?: string | Date | null; // account creation date
  isInstructor?: boolean;
  totalRevenue?: number;
}

/**
 * Compute all earned badges for a user.
 * Returns Title Case labels without accents.
 */
export function computeBadges(input: BadgeInput): string[] {
  const badges: string[] = [];
  const kyc = input.kyc ?? input.kycLevel ?? 0;
  const plan = (input.plan ?? "free").toUpperCase();
  const role = (input.role ?? "freelance").toLowerCase();

  // Performance badges (mutually exclusive tiers — take the highest + Rising Talent if new)
  if (input.avgRating >= 4.5 && input.completedOrders >= 10) {
    badges.push("Elite");
  } else if (input.avgRating >= 4.0 && input.completedOrders >= 3) {
    badges.push("Top Rated");
  }

  // Rising Talent: new account (< 90 days), at least 1 order, good rating
  if (input.createdAt) {
    const created = new Date(input.createdAt);
    const daysSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 90 && input.completedOrders >= 1 && input.avgRating >= 4.0) {
      badges.push("Rising Talent");
    }
  }

  // KYC badge
  if (kyc >= 3) {
    badges.push("Verifie");
  }

  // Plan badges
  if (plan === "PRO") {
    badges.push("Pro");
  } else if (plan === "BUSINESS") {
    badges.push("Business");
  }

  // Agency badge
  if (role === "agence" || plan === "AGENCE") {
    badges.push("Agence");
  }

  return badges;
}

/**
 * Returns the single most important badge (for cards with maxDisplay=1).
 * Priority: Elite > Top Rated > Rising Talent > Verifie > Pro > Business > Agence
 */
export function computeTopBadge(input: BadgeInput): string {
  const badges = computeBadges(input);
  const priority = ["Elite", "Top Rated", "Rising Talent", "Verifie", "Pro", "Business", "Agence"];
  for (const p of priority) {
    if (badges.includes(p)) return p;
  }
  return "";
}
