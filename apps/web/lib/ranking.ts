// ============================================================
// FreelanceHigh — Ranking & Scoring Algorithms
// Shared library for landing page, marketplace, and boost rotation
// ============================================================

// ── Types ──

export interface ServiceData {
  rating: number;
  orderCount: number;
  reviewCount: number;
  views: number;
  isBoosted: boolean;
  isVedette: boolean;
  category: string;
}

export interface TrendingServiceData extends ServiceData {
  views7d: number;
  orders7d: number;
}

export interface BoostData {
  totalCost: number;
  actualImpressions: number;
  actualClicks: number;
  actualOrders: number;
  startedAt: Date | string;
}

export interface FreelanceData {
  avgRating: number;
  completedOrders: number;
  totalOrders: number;
  reviewCount: number;
  serviceCount: number;
  createdAt: Date | string;
  category: string;
}

// ── Service Scoring ──

/** Top performers: established services with strong track record */
export function serviceScoreTopPerformers(s: Pick<ServiceData, "rating" | "orderCount" | "reviewCount">): number {
  return (
    (s.rating / 5) * 0.40 +
    Math.min(s.orderCount / 50, 1) * 0.35 +
    Math.min(s.reviewCount / 30, 1) * 0.25
  );
}

/** Trending: recently popular services (use 7-day window metrics) */
export function serviceScoreTrending(s: TrendingServiceData): number {
  return (
    Math.min(s.views7d / 200, 1) * 0.30 +
    Math.min(s.orders7d / 10, 1) * 0.40 +
    (s.rating / 5) * 0.30
  );
}

/** General service relevance score for marketplace default sort */
export function serviceScoreRelevance(s: Pick<ServiceData, "rating" | "orderCount" | "views">): number {
  return (
    (s.rating / 5) * 0.40 +
    Math.min(s.orderCount / 100, 1) * 0.35 +
    Math.min(s.views / 500, 1) * 0.25
  );
}

// ── Boost Scoring ──

/** Score a boosted service by performance + budget + recency */
export function boostScore(b: BoostData, maxTotalCost: number): number {
  const impressions = Math.max(b.actualImpressions, 1);
  const clicks = Math.max(b.actualClicks, 1);
  const ctr = b.actualClicks / impressions;
  const conversionRate = b.actualOrders / clicks;
  const costNorm = maxTotalCost > 0 ? b.totalCost / maxTotalCost : 0;

  return (
    costNorm * 0.30 +
    Math.min(ctr, 1) * 0.30 +
    Math.min(conversionRate, 1) * 0.20 +
    timeDecay(b.startedAt, 7) * 0.20
  );
}

// ── Freelance Scoring ──

export function freelanceScore(f: Pick<FreelanceData, "avgRating" | "completedOrders" | "totalOrders" | "reviewCount" | "serviceCount">): number {
  const completionRate = f.totalOrders > 0 ? f.completedOrders / f.totalOrders : 0;
  return (
    (f.avgRating / 5) * 0.35 +
    Math.min(f.completedOrders / 20, 1) * 0.25 +
    completionRate * 0.20 +
    Math.min(f.reviewCount / 30, 1) * 0.10 +
    Math.min(f.serviceCount / 5, 1) * 0.10
  );
}

/** Check if a freelance qualifies as "Rising Talent" */
export function isRisingTalent(f: Pick<FreelanceData, "createdAt" | "completedOrders" | "avgRating" | "reviewCount">): boolean {
  const created = typeof f.createdAt === "string" ? new Date(f.createdAt) : f.createdAt;
  const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return (
    ageDays < 90 &&
    f.completedOrders >= 1 &&
    f.avgRating >= 4.0 &&
    f.reviewCount >= 1
  );
}

// ── Time Decay ──

/** Exponential decay: returns 1.0 for "just now", approaches 0 over time */
export function timeDecay(date: Date | string, halfLifeDays: number): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const daysSince = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  return 1 / (1 + daysSince / halfLifeDays);
}

// ── Hourly Hash (deterministic seed that changes every hour) ──

/** DJB2 hash producing an unsigned 32-bit integer */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Returns a deterministic seed that changes every hour */
export function hourlyHash(salt = ""): number {
  const hour = Math.floor(Date.now() / 3_600_000);
  return djb2(`${hour}:${salt}`);
}

// ── Seeded Random (LCG PRNG) ──

/** Simple Linear Congruential Generator — deterministic pseudo-random */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

// ── Weighted Random Pick ──

/**
 * Select `count` items from `items` with probability proportional to `weights`.
 * Uses seeded RNG for deterministic results per seed.
 */
export function weightedRandomPick<T>(
  items: T[],
  weights: number[],
  count: number,
  seed: number
): T[] {
  if (items.length === 0 || count === 0) return [];
  const rng = seededRandom(seed);
  const results: T[] = [];
  const pool = [...items];
  const poolWeights = [...weights];

  const picks = Math.min(count, pool.length);
  for (let i = 0; i < picks; i++) {
    const totalWeight = poolWeights.reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) break;
    const target = rng() * totalWeight;
    let cumulative = 0;
    for (let j = 0; j < pool.length; j++) {
      cumulative += poolWeights[j];
      if (cumulative >= target) {
        results.push(pool[j]);
        pool.splice(j, 1);
        poolWeights.splice(j, 1);
        break;
      }
    }
  }

  return results;
}

// ── Category Diversity ──

/**
 * Reorder items to enforce max N items per category.
 * Items that exceed the limit are pushed to the end.
 */
export function enforceCategoryDiversity<T extends { category: string }>(
  items: T[],
  maxPerCategory: number
): T[] {
  const categoryCounts: Record<string, number> = {};
  const result: T[] = [];
  const overflow: T[] = [];

  for (const item of items) {
    const cat = item.category || "_unknown";
    const count = categoryCounts[cat] || 0;
    if (count < maxPerCategory) {
      result.push(item);
      categoryCounts[cat] = count + 1;
    } else {
      overflow.push(item);
    }
  }

  // Append overflow items to fill remaining slots
  return [...result, ...overflow];
}

// ── Interleave (Sponsored in natural positions) ──

/**
 * Merge boosted services naturally into regular results.
 * Max 1 boosted in first 2 positions, then 1 every `gap` positions.
 * This ensures sponsoring feels natural, never clustered.
 */
export function interleave<T>(
  boosted: T[],
  regular: T[],
  gap = 4
): T[] {
  if (boosted.length === 0) return regular;
  if (regular.length === 0) return boosted;

  const result: T[] = [];
  let bIdx = 0;
  let rIdx = 0;

  // First: put 1 boosted in position 2 (0-indexed: index 1), then 1 every `gap`
  // This means position pattern: [regular, BOOST, regular, regular, regular, BOOST, ...]
  let position = 0;

  while (rIdx < regular.length || bIdx < boosted.length) {
    // Place a boosted item at position 1, then every `gap` after that
    const isBoostedSlot = position === 1 || (position > 1 && (position - 1) % gap === 0);

    if (isBoostedSlot && bIdx < boosted.length) {
      result.push(boosted[bIdx]);
      bIdx++;
    } else if (rIdx < regular.length) {
      result.push(regular[rIdx]);
      rIdx++;
    } else if (bIdx < boosted.length) {
      // Only regular left? Append remaining boosted at the end
      result.push(boosted[bIdx]);
      bIdx++;
    }
    position++;
  }

  return result;
}

// ── Stats Formatting ──

/**
 * Format a platform stat number honestly:
 * - < 10: returns null (too low to display as a number)
 * - 10-99: exact number
 * - 100-999: rounded to hundreds ("100+", "500+")
 * - 1000+: compact format ("1.2K+", "25K+")
 */
export function formatStatNumber(n: number): string | null {
  if (n < 10) return null;
  if (n < 100) return String(n);
  if (n < 1000) return `${Math.floor(n / 100) * 100}+`;
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${Math.floor(n / 1000)}K+`;
}
