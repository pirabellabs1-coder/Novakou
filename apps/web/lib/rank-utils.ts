/**
 * Rank system — client-safe (pas de fs/path).
 * Utilise par les composants client (RankProgress, etc.).
 */

export interface UserRank {
  level: string;
  label: string;
  icon: string;
  color: string;
  minSales: number;
}

export const RANK_LEVELS: UserRank[] = [
  { level: "new_seller", label: "Nouveau vendeur", icon: "storefront", color: "text-slate-400", minSales: 0 },
  { level: "rising_talent", label: "Rising Talent", icon: "trending_up", color: "text-blue-400", minSales: 5 },
  { level: "professional", label: "Professionnel", icon: "workspace_premium", color: "text-purple-400", minSales: 25 },
  { level: "top_rated", label: "Top Rated", icon: "star", color: "text-amber-400", minSales: 50 },
  { level: "elite_expert", label: "Elite Expert", icon: "diamond", color: "text-emerald-400", minSales: 100 },
];

export function getUserRank(completedSales: number): UserRank {
  for (let i = RANK_LEVELS.length - 1; i >= 0; i--) {
    if (completedSales >= RANK_LEVELS[i].minSales) {
      return RANK_LEVELS[i];
    }
  }
  return RANK_LEVELS[0];
}

export function getNextRank(completedSales: number): { nextRank: UserRank | null; salesNeeded: number; progress: number } {
  const currentRank = getUserRank(completedSales);
  const currentIdx = RANK_LEVELS.findIndex((r) => r.level === currentRank.level);
  if (currentIdx >= RANK_LEVELS.length - 1) {
    return { nextRank: null, salesNeeded: 0, progress: 100 };
  }
  const nextRank = RANK_LEVELS[currentIdx + 1];
  const salesNeeded = nextRank.minSales - completedSales;
  const rangeStart = currentRank.minSales;
  const rangeEnd = nextRank.minSales;
  const progress = rangeEnd > rangeStart
    ? Math.round(((completedSales - rangeStart) / (rangeEnd - rangeStart)) * 100)
    : 0;
  return { nextRank, salesNeeded, progress };
}
