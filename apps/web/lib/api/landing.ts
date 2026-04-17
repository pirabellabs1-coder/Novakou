// ============================================================
// Novakou — Landing Page Data Fetching Layer
//
// Server-side functions that compute rankings dynamically.
// Currently reads from mock data (platform-stats.ts).
//
// When the backend is ready, replace the data source with
// Prisma queries — the ranking algorithms stay the same.
//
// Usage: import these functions in Server Components only.
// ============================================================

import {
  MOCK_FREELANCERS,
  MOCK_SERVICES,
  MOCK_CATEGORIES,
  MOCK_TESTIMONIALS,
  type FreelancerRecord,
  type ServiceRecord,
  type PlatformStats,
} from "@/lib/platform-stats";

// ------------------------------------------------------------
// Types returned to components
// ------------------------------------------------------------

export interface TopFreelancerView {
  username: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviews: number;
  completedOrders: number;
  location: string;
  flag: string;
  badge: string;
  skills: string[];
  dailyRateEur: number;
  completionRate: number;
  responseTime: string;
  score: number;
}

export interface PopularServiceView {
  slug: string;
  title: string;
  freelancer: string;
  freelancerAvatar: string;
  rating: number;
  reviews: number;
  totalOrders: number;
  priceEur: number;
  category: string;
  categorySlug: string;
  deliveryDays: number;
  trending: boolean;
  score: number;
}

export interface CategoryView {
  icon: string;
  title: string;
  description: string;
  slug: string;
  serviceCount: number;
  freelancerCount: number;
  avgRating: number;
}

export interface TestimonialView {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  country: string;
  countryFlag: string;
  type: string;
}

// ------------------------------------------------------------
// Scoring Algorithms
// ------------------------------------------------------------

/**
 * Compute a freelancer ranking score (0–100).
 *
 * Weights:
 *   - rating (normalized to 5.0)     : 30%
 *   - review volume (log scale)      : 20%
 *   - completion rate                 : 20%
 *   - response time (inverse)        : 10%
 *   - recent activity (orders 30d)   : 20%
 *
 * This algorithm ensures that freelancers with consistently
 * high performance AND recent activity rank highest.
 */
function computeFreelancerScore(f: FreelancerRecord): number {
  const ratingScore = (f.rating / 5.0) * 30;

  // Log scale for reviews — diminishing returns after ~200
  const reviewScore = Math.min(Math.log10(f.reviewCount + 1) / Math.log10(300), 1) * 20;

  const completionScore = (f.completionRate / 100) * 20;

  // Lower response time = better. Cap at 0.5h (best) and 5h (worst)
  const responseScore = Math.max(0, 1 - (f.responseTimeHours - 0.5) / 4.5) * 10;

  // Recent activity — normalize to ~25 orders/month as excellent
  const activityScore = Math.min(f.recentOrdersLast30d / 25, 1) * 20;

  return ratingScore + reviewScore + completionScore + responseScore + activityScore;
}

/**
 * Compute a service popularity score (0–100).
 *
 * Weights:
 *   - total orders (log scale)       : 25%
 *   - rating                         : 25%
 *   - review volume (log scale)      : 15%
 *   - recent momentum (orders 7d)    : 20%
 *   - conversion rate                : 15%
 *
 * The "trending" flag is computed separately based on
 * whether recent order velocity exceeds the average.
 */
function computeServiceScore(s: ServiceRecord): number {
  const orderScore = Math.min(Math.log10(s.totalOrders + 1) / Math.log10(500), 1) * 25;
  const ratingScore = (s.rating / 5.0) * 25;
  const reviewScore = Math.min(Math.log10(s.reviewCount + 1) / Math.log10(400), 1) * 15;

  // Recent momentum — 10 orders/week is excellent
  const momentumScore = Math.min(s.ordersLast7d / 10, 1) * 20;

  // Conversion rate — 10% is excellent
  const conversionScore = Math.min(s.conversionRate / 10, 1) * 15;

  return orderScore + ratingScore + reviewScore + momentumScore + conversionScore;
}

/**
 * Determine if a service is "trending" based on recent velocity.
 * A service is trending if its weekly order rate is significantly
 * above the average for all services.
 */
function computeTrendingStatus(service: ServiceRecord, allServices: ServiceRecord[]): boolean {
  if (allServices.length === 0) return false;

  const avgWeeklyOrders =
    allServices.reduce((sum, s) => sum + s.ordersLast7d, 0) / allServices.length;

  // Trending if weekly orders are 40%+ above average
  return service.ordersLast7d > avgWeeklyOrders * 1.4;
}

// ------------------------------------------------------------
// Data Fetching Functions
// ------------------------------------------------------------

/**
 * Get aggregated platform statistics.
 *
 * In production, this will run aggregate queries:
 *   SELECT COUNT(*) FROM users WHERE role = 'freelancer'
 *   SELECT AVG(rating) FROM reviews
 *   SELECT COUNT(DISTINCT country) FROM users
 *   etc.
 *
 * Currently computes from mock data to simulate real aggregation.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  // Simulate DB query delay (remove when using real DB)
  // In production: prisma.$queryRaw or Prisma aggregates

  const freelancers = MOCK_FREELANCERS;
  const services = MOCK_SERVICES;
  const categories = MOCK_CATEGORIES;

  const totalFreelancers = categories.reduce((sum, c) => sum + c.freelancerCount, 0);
  const totalServices = categories.reduce((sum, c) => sum + c.serviceCount, 0);
  const totalOrders = categories.reduce((sum, c) => sum + c.totalOrders, 0);

  const avgRating =
    freelancers.length > 0
      ? freelancers.reduce((sum, f) => sum + f.rating, 0) / freelancers.length
      : 0;

  const totalReviews = freelancers.reduce((sum, f) => sum + f.reviewCount, 0) +
    services.reduce((sum, s) => sum + s.reviewCount, 0);

  const newFreelancersThisMonth = freelancers.filter((f) => {
    const memberDate = new Date(f.memberSince);
    const now = new Date();
    return (
      memberDate.getMonth() === now.getMonth() &&
      memberDate.getFullYear() === now.getFullYear()
    );
  }).length;

  return {
    totalFreelancers,
    totalClients: Math.round(totalFreelancers * 0.71),
    totalAgencies: Math.round(totalFreelancers * 0.048),
    totalServices,
    totalProjectsCompleted: totalOrders,
    totalRevenueEur: Math.round(totalOrders * 185),
    avgSatisfactionRating: Math.round(avgRating * 100) / 100,
    totalReviews,
    countriesCovered: 0,
    avgResponseTimeHours:
      freelancers.length > 0
        ? Math.round(
            (freelancers.reduce((sum, f) => sum + f.responseTimeHours, 0) /
              freelancers.length) *
              10
          ) / 10
        : 0,
    avgDeliveryOnTimePercent:
      freelancers.length > 0
        ? Math.round(
            (freelancers.reduce((sum, f) => sum + f.completionRate, 0) /
              freelancers.length) *
              10
          ) / 10
        : 0,
    newFreelancersThisMonth,
    newProjectsThisMonth: services.reduce((sum, s) => sum + s.ordersLast30d, 0),
    totalPayoutsEur: Math.round(totalOrders * 148),
    activeMissions: services.reduce((sum, s) => sum + s.ordersLast7d, 0) * 12,
    repeatClientPercent: 0,
  };
}

/**
 * Get top freelancers ranked by computed score.
 *
 * In production:
 *   SELECT u.*,
 *     (rating * 0.3 + LOG(review_count) * 0.2 + ...) AS score
 *   FROM users u
 *   WHERE role = 'freelancer' AND verified = true
 *   ORDER BY score DESC
 *   LIMIT $1
 */
export async function getTopFreelancers(limit = 6): Promise<TopFreelancerView[]> {
  const scored = MOCK_FREELANCERS
    .filter((f) => f.verified)
    .map((f) => ({
      freelancer: f,
      score: computeFreelancerScore(f),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ freelancer: f, score }) => ({
    username: f.username,
    name: f.name,
    title: f.title,
    avatar: f.avatar,
    rating: f.rating,
    reviews: f.reviewCount,
    completedOrders: f.completedOrders,
    location: f.location,
    flag: f.countryFlag,
    badge: f.badge,
    skills: f.skills,
    dailyRateEur: f.dailyRateEur,
    completionRate: f.completionRate,
    responseTime: formatResponseTime(f.responseTimeHours),
    score: Math.round(score * 10) / 10,
  }));
}

/**
 * Get popular services ranked by computed score.
 * Optionally filter by category slug.
 *
 * In production:
 *   SELECT s.*,
 *     (LOG(total_orders) * 0.25 + rating/5 * 0.25 + ...) AS score,
 *     (orders_last_7d > avg_orders_7d * 1.4) AS trending
 *   FROM services s
 *   WHERE active = true
 *   ORDER BY score DESC
 *   LIMIT $1
 */
export async function getPopularServices(
  limit = 8,
  categorySlug?: string
): Promise<PopularServiceView[]> {
  let services = [...MOCK_SERVICES];

  if (categorySlug && categorySlug !== "tous") {
    services = services.filter((s) => s.categorySlug === categorySlug);
  }

  const scored = services
    .map((s) => ({
      service: s,
      score: computeServiceScore(s),
      trending: computeTrendingStatus(s, MOCK_SERVICES),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ service: s, score, trending }) => ({
    slug: s.slug,
    title: s.title,
    freelancer: s.freelancerName,
    freelancerAvatar: s.freelancerAvatar,
    rating: s.rating,
    reviews: s.reviewCount,
    totalOrders: s.totalOrders,
    priceEur: s.priceEur,
    category: s.category,
    categorySlug: s.categorySlug,
    deliveryDays: s.deliveryDays,
    trending,
    score: Math.round(score * 10) / 10,
  }));
}

/**
 * Get service categories with aggregated stats, sorted by
 * total activity (serviceCount + freelancerCount).
 *
 * In production:
 *   SELECT c.*,
 *     COUNT(DISTINCT s.id) AS service_count,
 *     COUNT(DISTINCT u.id) AS freelancer_count,
 *     AVG(s.rating) AS avg_rating
 *   FROM categories c
 *   LEFT JOIN services s ON s.category_id = c.id
 *   LEFT JOIN users u ON u.primary_category_id = c.id
 *   GROUP BY c.id
 *   ORDER BY service_count + freelancer_count DESC
 */
export async function getCategoriesWithStats(): Promise<CategoryView[]> {
  return MOCK_CATEGORIES
    .sort((a, b) => (b.serviceCount + b.freelancerCount) - (a.serviceCount + a.freelancerCount))
    .map((c) => ({
      icon: c.icon,
      title: c.title,
      description: c.description,
      slug: c.slug,
      serviceCount: c.serviceCount,
      freelancerCount: c.freelancerCount,
      avgRating: c.avgRating,
    }));
}

/**
 * Get the distinct category slugs/names for service filter tabs.
 * Returns categories that have popular services, sorted by service count.
 */
export async function getServiceFilterCategories(): Promise<
  { key: string; label: string }[]
> {
  const categorySlugs = new Set(MOCK_SERVICES.map((s) => s.categorySlug));

  const cats = MOCK_CATEGORIES
    .filter((c) => categorySlugs.has(c.slug))
    .sort((a, b) => b.serviceCount - a.serviceCount)
    .map((c) => ({ key: c.slug, label: c.title }));

  return [{ key: "tous", label: "Tous" }, ...cats];
}

/**
 * Get verified testimonials, prioritizing recent and high-rated.
 *
 * In production:
 *   SELECT * FROM testimonials
 *   WHERE verified = true AND rating >= 4
 *   ORDER BY rating DESC, created_at DESC
 *   LIMIT $1
 */
export async function getTestimonials(limit = 3): Promise<TestimonialView[]> {
  return MOCK_TESTIMONIALS
    .filter((t) => t.verified)
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      quote: t.quote,
      name: t.name,
      role: t.role,
      company: t.company,
      avatar: t.avatar,
      rating: t.rating,
      country: t.country,
      countryFlag: t.countryFlag,
      type: t.type,
    }));
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function formatResponseTime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours === 1) return "1h";
  return `${hours.toFixed(1).replace(".0", "")}h`;
}
