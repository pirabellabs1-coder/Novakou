"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FORMATIONS_CONFIG } from "@/lib/formations/config";

const { AUTO_REFRESH_DASHBOARD_MS, AUTO_REFRESH_LIST_MS } = FORMATIONS_CONFIG;

// ── Query Keys ──

export const adminKeys = {
  dashboard: (period: string) => ["admin", "dashboard", period] as const,
  formations: (status?: string) => ["admin", "formations", status] as const,
  produits: (status?: string) => ["admin", "produits", status] as const,
  instructeurs: (status?: string) => ["admin", "instructeurs", status] as const,
  apprenants: () => ["admin", "apprenants"] as const,
  certificats: () => ["admin", "certificats"] as const,
  finances: () => ["admin", "finances"] as const,
  categories: () => ["admin", "categories"] as const,
  promoCodes: () => ["admin", "promo-codes"] as const,
  marketing: () => ["admin", "marketing"] as const,
  marketingPromotions: (page?: number) => ["admin", "marketing", "promotions", page] as const,
  cohorts: (status?: string) => ["admin", "cohorts", status] as const,
  discussions: (filter?: string) => ["admin", "discussions", filter] as const,
  auditLog: (action?: string, page?: number) => ["admin", "audit-log", action, page] as const,
  config: () => ["admin", "config"] as const,
  refunds: (status?: string) => ["admin", "refunds", status] as const,
};

// ── Fetcher ──

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

// ── Dashboard ──

export function useAdminDashboard(period: string = "30d") {
  return useQuery({
    queryKey: adminKeys.dashboard(period),
    queryFn: () => fetchJson(`/api/admin/formations/stats?period=${period}`),
    refetchInterval: AUTO_REFRESH_DASHBOARD_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Formations ──

export function useAdminFormations(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: adminKeys.formations(status),
    queryFn: () => fetchJson(`/api/admin/formations/list${params}`),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Produits ──

export function useAdminProduits(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: adminKeys.produits(status),
    queryFn: () => fetchJson(`/api/admin/formations/produits${params}`),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Instructeurs ──

export function useAdminInstructeurs(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: adminKeys.instructeurs(status),
    queryFn: () => fetchJson(`/api/admin/instructeurs/list${params}`),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Apprenants ──

export function useAdminApprenants() {
  return useQuery({
    queryKey: adminKeys.apprenants(),
    queryFn: () => fetchJson("/api/admin/formations/apprenants"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Certificats ──

export function useAdminCertificats() {
  return useQuery({
    queryKey: adminKeys.certificats(),
    queryFn: () => fetchJson("/api/admin/formations/certificats"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Finances ──

export function useAdminFinances() {
  return useQuery({
    queryKey: adminKeys.finances(),
    queryFn: () => fetchJson("/api/admin/formations/finances"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Catégories ──

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories(),
    queryFn: () => fetchJson("/api/admin/formations/categories"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Codes promo ──

export function useAdminPromoCodes() {
  return useQuery({
    queryKey: adminKeys.promoCodes(),
    queryFn: () => fetchJson("/api/admin/formations/promo-codes"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Marketing ──

export function useAdminMarketing() {
  return useQuery({
    queryKey: adminKeys.marketing(),
    queryFn: () => fetchJson("/api/admin/formations/marketing"),
    refetchInterval: AUTO_REFRESH_DASHBOARD_MS,
    refetchIntervalInBackground: false,
  });
}

export function useAdminMarketingPromotions(page: number = 1) {
  return useQuery({
    queryKey: adminKeys.marketingPromotions(page),
    queryFn: () => fetchJson(`/api/admin/formations/marketing/promotions?page=${page}&limit=20`),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Cohortes ──

export function useAdminCohorts(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: adminKeys.cohorts(status),
    queryFn: () => fetchJson(`/api/admin/formations/cohorts${params}`),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Discussions ──

export function useAdminDiscussions(filter: string = "reported") {
  return useQuery({
    queryKey: adminKeys.discussions(filter),
    queryFn: () => fetchJson(`/api/admin/formations/discussions?filter=${filter}`),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Audit Log ──

export function useAdminAuditLog(action?: string, page: number = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (action) params.set("action", action);
  return useQuery({
    queryKey: adminKeys.auditLog(action, page),
    queryFn: () => fetchJson(`/api/admin/formations/audit-log?${params}`),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Config ──

export function useAdminConfig() {
  return useQuery({
    queryKey: adminKeys.config(),
    queryFn: () => fetchJson("/api/admin/formations/config"),
  });
}

// ── Refunds ──

export function useAdminRefunds(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: adminKeys.refunds(status),
    queryFn: () => fetchJson(`/api/admin/formations/refunds${params}`),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Mutations ──

export function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    invalidateFormations: () => queryClient.invalidateQueries({ queryKey: ["admin", "formations"] }),
    invalidateMarketing: () => queryClient.invalidateQueries({ queryKey: ["admin", "marketing"] }),
    invalidateCohorts: () => queryClient.invalidateQueries({ queryKey: ["admin", "cohorts"] }),
    invalidateDiscussions: () => queryClient.invalidateQueries({ queryKey: ["admin", "discussions"] }),
    invalidateRefunds: () => queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] }),
    invalidateConfig: () => queryClient.invalidateQueries({ queryKey: adminKeys.config() }),
  };
}

export function useAdminMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys?: readonly unknown[][]
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key as unknown[] });
        });
      }
    },
  });
}
