// ============================================================
// FreelanceHigh — Mock Data Source (simulates database records)
//
// This file acts as a temporary data source until the real
// database (Prisma + Supabase) is connected. The API layer
// (lib/api/landing.ts) reads from here, applies ranking
// algorithms, and returns sorted/filtered results.
//
// When the backend is ready, only lib/api/landing.ts needs
// to be updated to query Prisma instead of importing from here.
// ============================================================

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export type FreelancerBadge = "Elite" | "Top Rated" | "Rising Talent" | "Pro";

export type TestimonialType = "client" | "freelance" | "agence";

export interface PlatformStats {
  totalFreelancers: number;
  totalClients: number;
  totalAgencies: number;
  totalServices: number;
  totalProjectsCompleted: number;
  totalRevenueEur: number;
  avgSatisfactionRating: number;
  totalReviews: number;
  countriesCovered: number;
  avgResponseTimeHours: number;
  avgDeliveryOnTimePercent: number;
  newFreelancersThisMonth: number;
  newProjectsThisMonth: number;
  totalPayoutsEur: number;
  activeMissions: number;
  repeatClientPercent: number;
}

export interface FreelancerRecord {
  id: string;
  username: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  completedOrders: number;
  location: string;
  country: string;
  countryFlag: string;
  badge: FreelancerBadge;
  skills: string[];
  dailyRateEur: number;
  completionRate: number;
  responseTimeHours: number;
  memberSince: string;
  totalEarningsEur: number;
  verified: boolean;
  // Fields for dynamic scoring
  recentOrdersLast30d: number;
  recentReviewsLast30d: number;
  profileViews30d: number;
  lastActiveAt: string;
}

export interface ServiceRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  freelancerName: string;
  freelancerUsername: string;
  freelancerAvatar: string;
  rating: number;
  reviewCount: number;
  totalOrders: number;
  priceEur: number;
  category: string;
  categorySlug: string;
  deliveryDays: number;
  image: string;
  featured: boolean;
  createdAt: string;
  // Fields for dynamic scoring
  ordersLast30d: number;
  ordersLast7d: number;
  viewsLast30d: number;
  conversionRate: number;
}

export interface CategoryRecord {
  icon: string;
  title: string;
  description: string;
  slug: string;
  serviceCount: number;
  freelancerCount: number;
  avgRating: number;
  totalOrders: number;
  growthPercent: number;
}

export interface TestimonialRecord {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  country: string;
  countryFlag: string;
  type: TestimonialType;
  createdAt: string;
  verified: boolean;
}

export interface PaymentMethod {
  name: string;
  icon: string;
  description: string;
}

// ------------------------------------------------------------
// 1. MOCK FREELANCERS (simulates users table)
// ------------------------------------------------------------

export const MOCK_FREELANCERS: FreelancerRecord[] = [];

// ------------------------------------------------------------
// 2. MOCK SERVICES (simulates services table)
// ------------------------------------------------------------

export const MOCK_SERVICES: ServiceRecord[] = [];

// ------------------------------------------------------------
// 3. MOCK CATEGORIES (simulates categories table with aggregates)
// ------------------------------------------------------------

export const MOCK_CATEGORIES: CategoryRecord[] = [
  {
    icon: "draw",
    title: "Design & Creatif",
    description: "UI/UX, Logos, Branding, Motion Design, Illustrations.",
    slug: "design-crea",
    serviceCount: 0,
    freelancerCount: 0,
    avgRating: 0,
    totalOrders: 0,
    growthPercent: 0,
  },
  {
    icon: "terminal",
    title: "Developpement & Tech",
    description: "Web, Mobile, API, DevOps, Cloud, Blockchain.",
    slug: "developpement",
    serviceCount: 0,
    freelancerCount: 0,
    avgRating: 0,
    totalOrders: 0,
    growthPercent: 0,
  },
  {
    icon: "ads_click",
    title: "Marketing Digital",
    description: "SEO, Social Media, Growth Hacking, Publicite.",
    slug: "marketing",
    serviceCount: 0,
    freelancerCount: 0,
    avgRating: 0,
    totalOrders: 0,
    growthPercent: 0,
  },
  {
    icon: "edit_note",
    title: "Redaction & Traduction",
    description: "Copywriting, Articles, Traduction, Localisation.",
    slug: "redaction",
    serviceCount: 0,
    freelancerCount: 0,
    avgRating: 0,
    totalOrders: 0,
    growthPercent: 0,
  },
  {
    icon: "videocam",
    title: "Video & Animation",
    description: "Montage, Motion Graphics, 3D, Explainer Videos.",
    slug: "video",
    serviceCount: 0,
    freelancerCount: 0,
    avgRating: 0,
    totalOrders: 0,
    growthPercent: 0,
  },
  {
    icon: "music_note",
    title: "Musique & Audio",
    description: "Voix-off, Podcast, Jingles, Sound Design.",
    slug: "musique",
    serviceCount: 0,
    freelancerCount: 0,
    avgRating: 0,
    totalOrders: 0,
    growthPercent: 0,
  },
  {
    icon: "business_center",
    title: "Business & Conseil",
    description: "Strategie, Comptabilite, Juridique, Consulting.",
    slug: "business",
    serviceCount: 0,
    freelancerCount: 0,
    avgRating: 0,
    totalOrders: 0,
    growthPercent: 0,
  },
  {
    icon: "psychology",
    title: "IA & Data Science",
    description: "Machine Learning, Analyse de donnees, Chatbots, Automatisation.",
    slug: "ia-data",
    serviceCount: 0,
    freelancerCount: 0,
    avgRating: 0,
    totalOrders: 0,
    growthPercent: 0,
  },
];

// ------------------------------------------------------------
// 4. MOCK TESTIMONIALS
// ------------------------------------------------------------

export const MOCK_TESTIMONIALS: TestimonialRecord[] = [];

// ------------------------------------------------------------
// 5. PAYMENT_METHODS (static — doesn't change)
// ------------------------------------------------------------

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    name: "Visa / Mastercard",
    icon: "credit_card",
    description: "Paiement par carte bancaire internationale securise via Stripe.",
  },
  {
    name: "Orange Money",
    icon: "phone_android",
    description: "Paiement mobile disponible au Senegal, Cote d'Ivoire, Cameroun et 14 autres pays.",
  },
  {
    name: "Wave",
    icon: "waves",
    description: "Transfert d'argent mobile rapide et sans frais caches en Afrique de l'Ouest.",
  },
  {
    name: "MTN Mobile Money",
    icon: "smartphone",
    description: "Paiement mobile MTN MoMo disponible en Cote d'Ivoire, Cameroun et Afrique centrale.",
  },
  {
    name: "PayPal",
    icon: "account_balance_wallet",
    description: "Paiement et retrait international via PayPal pour les freelances du monde entier.",
  },
  {
    name: "Virement SEPA",
    icon: "account_balance",
    description: "Virement bancaire europeen pour les retraits et paiements de grande valeur.",
  },
  {
    name: "USDC / USDT",
    icon: "currency_bitcoin",
    description: "Paiement en crypto stablecoins pour des transactions rapides et sans frontieres.",
  },
];

// ------------------------------------------------------------
// 6. TRENDING_SEARCHES (will be computed from search analytics)
// ------------------------------------------------------------

export const TRENDING_SEARCHES: string[] = [];

// ------------------------------------------------------------
// 7. Helper Functions
// ------------------------------------------------------------

/**
 * Format a large number into a human-readable abbreviated string.
 * Examples: 1234 -> "1.2K", 28500000 -> "28.5M"
 */
export function formatLargeNumber(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    const value = abs / 1_000_000_000;
    return `${sign}${stripTrailingZero(value.toFixed(1))}B`;
  }
  if (abs >= 1_000_000) {
    const value = abs / 1_000_000;
    return `${sign}${stripTrailingZero(value.toFixed(1))}M`;
  }
  if (abs >= 1_000) {
    const value = abs / 1_000;
    return `${sign}${stripTrailingZero(value.toFixed(1))}K`;
  }
  return `${sign}${abs}`;
}

function stripTrailingZero(s: string): string {
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}
