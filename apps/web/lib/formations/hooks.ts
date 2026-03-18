"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────

interface DashboardStats {
  totalRevenue: number;
  revenueThisMonth: number;
  pendingRevenue: number;
  netRevenue: number;
  totalStudents: number;
  activeFormations: number;
  averageRating: number;
  revenueTrend: number;
  studentsTrend: number;
  revenueByMonth: { month: string; revenue: number }[];
  enrollmentsByDay?: { date: string; count: number }[];
  topFormations: { id: string; titleFr: string; titleEn: string; students: number; revenue: number; rating: number }[];
  recentEnrollments: { id: string; createdAt: string; user: { name: string }; formation: { titleFr: string } }[];
  recentReviews: { id: string; rating: number; comment: string; createdAt: string; user: { name: string }; formation: { titleFr: string } }[];
}

interface ProductStats {
  totalRevenue: number;
  weeklyRevenue: number;
  totalClients: number;
  totalSales: number;
  revenueByMonth: { month: string; revenue: number }[];
  topProducts: { id: string; titleFr: string; sales: number; revenue: number }[];
  recentPurchases: { id: string; product: string; buyer: string; amount: number; date: string }[];
}

// ─── Fetcher ──────────────────────────────────────────────────────

async function fetchAPI<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erreur réseau" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Query Keys ───────────────────────────────────────────────────

export const instructorKeys = {
  all: ["instructor"] as const,
  dashboard: (period: string) => ["instructor", "dashboard", period] as const,
  formations: () => ["instructor", "formations"] as const,
  stats: (period: string) => ["instructor", "statistiques", period] as const,
  formationStats: (id: string, period: string) => ["instructor", "formation-stats", id, period] as const,
  marketing: (period: string) => ["instructor", "marketing", period] as const,
  marketingOverview: (period: string) => ["instructor", "marketing-overview", period] as const,
  marketingAnalytics: (period: string) => ["instructor", "marketing-analytics", period] as const,
  marketingCampaigns: () => ["instructor", "marketing-campaigns"] as const,
  marketingDiscounts: () => ["instructor", "marketing-discounts"] as const,
  marketingFlashOffers: () => ["instructor", "marketing-flash"] as const,
  marketingAffiliate: () => ["instructor", "marketing-affiliate"] as const,
  revenue: () => ["instructor", "revenus"] as const,
  products: () => ["instructor", "produits"] as const,
  productStats: (period: string) => ["instructor", "produits-stats", period] as const,
  reviews: () => ["instructor", "avis"] as const,
  students: () => ["instructor", "apprenants"] as const,
  emailSequences: () => ["instructor", "email-sequences"] as const,
  funnels: () => ["instructor", "funnels"] as const,
  funnelAnalytics: (id: string) => ["instructor", "funnel-analytics", id] as const,
  popups: () => ["instructor", "popups"] as const,
  promotions: () => ["instructor", "promotions"] as const,
  pixels: () => ["instructor", "pixels"] as const,
  cohorts: (formationId: string) => ["instructor", "cohorts", formationId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────

export function useInstructorDashboard(period: string) {
  return useQuery<DashboardStats>({
    queryKey: instructorKeys.dashboard(period),
    queryFn: () => fetchAPI(`/api/instructeur/dashboard?period=${period}`),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useInstructorFormations() {
  return useQuery({
    queryKey: instructorKeys.formations(),
    queryFn: () => fetchAPI<{ formations: unknown[] }>("/api/instructeur/formations").then(r => r.formations ?? r),
    staleTime: 30000,
  });
}

export function useInstructorStats(period: string) {
  return useQuery({
    queryKey: instructorKeys.stats(period),
    queryFn: () => fetchAPI(`/api/instructeur/statistiques?period=${period}`),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useInstructorFormationStats(formationId: string, period: string) {
  return useQuery({
    queryKey: instructorKeys.formationStats(formationId, period),
    queryFn: () => fetchAPI(`/api/instructeur/formations/${formationId}/statistiques?period=${period}`),
    enabled: !!formationId,
    staleTime: 30000,
  });
}

export function useInstructorRevenue() {
  return useQuery({
    queryKey: instructorKeys.revenue(),
    queryFn: () => fetchAPI("/api/instructeur/revenus"),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useInstructorProducts() {
  return useQuery({
    queryKey: instructorKeys.products(),
    queryFn: () => fetchAPI("/api/instructeur/produits"),
    staleTime: 30000,
  });
}

export function useInstructorProductStats(period: string) {
  return useQuery<ProductStats>({
    queryKey: instructorKeys.productStats(period),
    queryFn: () => fetchAPI(`/api/instructeur/produits/stats?period=${period}`),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useInstructorReviews() {
  return useQuery({
    queryKey: instructorKeys.reviews(),
    queryFn: () => fetchAPI("/api/instructeur/avis"),
    staleTime: 30000,
  });
}

export function useInstructorStudents() {
  return useQuery({
    queryKey: instructorKeys.students(),
    queryFn: () => fetchAPI("/api/instructeur/apprenants"),
    staleTime: 30000,
  });
}

export function useInstructorEmailSequences() {
  return useQuery({
    queryKey: instructorKeys.emailSequences(),
    queryFn: () => fetchAPI("/api/marketing/sequences"),
    staleTime: 30000,
  });
}

export function useInstructorFunnels() {
  return useQuery({
    queryKey: instructorKeys.funnels(),
    queryFn: () => fetchAPI("/api/marketing/funnels"),
    staleTime: 30000,
  });
}

export function useInstructorPopups() {
  return useQuery({
    queryKey: instructorKeys.popups(),
    queryFn: () => fetchAPI("/api/marketing/popups"),
    staleTime: 30000,
  });
}

// ─── Marketing hooks ─────────────────────────────────────────────

export function useMarketingOverview(period: string) {
  return useQuery({
    queryKey: instructorKeys.marketingOverview(period),
    queryFn: () => fetchAPI(`/api/marketing/overview?period=${period}`),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useMarketingAnalytics(period: string) {
  return useQuery({
    queryKey: instructorKeys.marketingAnalytics(period),
    queryFn: () => fetchAPI(`/api/marketing/analytics?period=${period}`),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useMarketingCampaigns() {
  return useQuery({
    queryKey: instructorKeys.marketingCampaigns(),
    queryFn: () => fetchAPI("/api/marketing/campaigns"),
    staleTime: 30000,
  });
}

export function useMarketingDiscounts() {
  return useQuery({
    queryKey: instructorKeys.marketingDiscounts(),
    queryFn: () => fetchAPI("/api/marketing/discounts"),
    staleTime: 30000,
  });
}

export function useMarketingFlashOffers() {
  return useQuery({
    queryKey: instructorKeys.marketingFlashOffers(),
    queryFn: () => fetchAPI("/api/marketing/flash-offers"),
    staleTime: 30000,
  });
}

export function useMarketingAffiliate() {
  return useQuery({
    queryKey: instructorKeys.marketingAffiliate(),
    queryFn: () => fetchAPI("/api/marketing/affiliate"),
    staleTime: 30000,
  });
}

export function useInstructorPromotions() {
  return useQuery({
    queryKey: instructorKeys.promotions(),
    queryFn: () => fetchAPI("/api/instructeur/promotions"),
    staleTime: 30000,
  });
}

export function useInstructorPixels() {
  return useQuery({
    queryKey: instructorKeys.pixels(),
    queryFn: () => fetchAPI("/api/instructeur/marketing/pixels"),
    staleTime: 30000,
  });
}

export function useInstructorCohorts(formationId: string) {
  return useQuery({
    queryKey: instructorKeys.cohorts(formationId),
    queryFn: () => fetchAPI(`/api/instructeur/formations/${formationId}/cohorts`),
    enabled: !!formationId,
    staleTime: 30000,
  });
}

export function useInstructorFunnelAnalytics(funnelId: string) {
  return useQuery({
    queryKey: instructorKeys.funnelAnalytics(funnelId),
    queryFn: () => fetchAPI(`/api/marketing/funnels/${funnelId}/events`),
    enabled: !!funnelId,
    staleTime: 60000,
  });
}

// ─── Mutation helpers ─────────────────────────────────────────────

/** Invalide toutes les queries instructeur après une mutation */
export function useInvalidateInstructor() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: instructorKeys.all });
}

/** Hook de mutation générique qui invalide automatiquement les queries instructeur */
export function useInstructorMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys?: readonly unknown[][]
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        );
      } else {
        queryClient.invalidateQueries({ queryKey: instructorKeys.all });
      }
    },
  });
}
