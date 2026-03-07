/**
 * Dynamic badge computation based on freelancer metrics.
 * Badges are computed at runtime, never hardcoded in profiles.
 */

export interface BadgeInput {
  completedOrders: number;
  completionRate: number; // 0-100
  avgRating: number; // 0-5
  kycLevel: number; // 1-4
  plan: string; // "free" | "pro" | "business" | "agence"
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const BADGE_DEFINITIONS: Badge[] = [
  {
    id: "rising-talent",
    label: "Rising Talent",
    icon: "trending_up",
    color: "text-blue-400",
    description: "Freelance prometteur avec un excellent taux de complétion",
  },
  {
    id: "top-rated",
    label: "Top Rated",
    icon: "star",
    color: "text-amber-400",
    description: "Freelance parmi les mieux notés de la plateforme",
  },
  {
    id: "verifie",
    label: "Vérifié",
    icon: "verified",
    color: "text-emerald-400",
    description: "Identité vérifiée par FreelanceHigh",
  },
  {
    id: "pro",
    label: "Pro",
    icon: "workspace_premium",
    color: "text-primary",
    description: "Abonné au plan Pro ou supérieur",
  },
  {
    id: "elite",
    label: "Elite",
    icon: "diamond",
    color: "text-amber-300",
    description: "Freelance d'élite avec une expertise reconnue",
  },
];

export function computeBadges(input: BadgeInput): string[] {
  const badges: string[] = [];

  // Rising Talent: ≥5 commandes terminées, ≥90% complétion
  if (input.completedOrders >= 5 && input.completionRate >= 90) {
    badges.push("Rising Talent");
  }

  // Top Rated: ≥50 commandes terminées, ≥4.5 note moyenne
  if (input.completedOrders >= 50 && input.avgRating >= 4.5) {
    badges.push("Top Rated");
  }

  // Vérifié: KYC niveau ≥ 3
  if (input.kycLevel >= 3) {
    badges.push("Vérifié");
  }

  // Pro: plan pro, business ou agence
  if (["pro", "business", "agence"].includes(input.plan)) {
    badges.push("Pro");
  }

  // Elite: KYC ≥ 4 ET ≥100 commandes terminées ET ≥4.5 note
  if (input.kycLevel >= 4 && input.completedOrders >= 100 && input.avgRating >= 4.5) {
    badges.push("Elite");
  }

  return badges;
}

export function getBadgeDefinition(label: string): Badge | undefined {
  return BADGE_DEFINITIONS.find((b) => b.label === label);
}

export function getAllBadgeDefinitions(): Badge[] {
  return BADGE_DEFINITIONS;
}
