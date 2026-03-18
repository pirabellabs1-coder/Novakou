"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FORMATIONS_CONFIG } from "@/lib/formations/config";

const { AUTO_REFRESH_DASHBOARD_MS, AUTO_REFRESH_LIST_MS } = FORMATIONS_CONFIG;

// ── Query Keys ──

export const apprenantKeys = {
  enrollments: () => ["apprenant", "enrollments"] as const,
  certificats: () => ["apprenant", "certificats"] as const,
  certificat: (id: string) => ["apprenant", "certificats", id] as const,
  achats: () => ["apprenant", "achats"] as const,
  discussions: () => ["apprenant", "discussions"] as const,
  reviews: () => ["apprenant", "reviews"] as const,
  refunds: () => ["apprenant", "refunds"] as const,
  recommendations: () => ["apprenant", "recommendations"] as const,
  profil: () => ["apprenant", "profil"] as const,
  produits: () => ["apprenant", "produits"] as const,
};

// ── Fetcher ──

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

// ── Hooks ──

export function useApprenantEnrollments() {
  return useQuery({
    queryKey: apprenantKeys.enrollments(),
    queryFn: () => fetchJson("/api/apprenant/enrollments"),
    refetchInterval: AUTO_REFRESH_DASHBOARD_MS,
    refetchIntervalInBackground: false,
  });
}

export function useApprenantCertificats() {
  return useQuery({
    queryKey: apprenantKeys.certificats(),
    queryFn: () => fetchJson("/api/apprenant/certificats"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

export function useApprenantCertificat(id: string) {
  return useQuery({
    queryKey: apprenantKeys.certificat(id),
    queryFn: () => fetchJson(`/api/apprenant/certificats/${id}`),
    enabled: !!id,
  });
}

export function useApprenantAchats() {
  return useQuery({
    queryKey: apprenantKeys.achats(),
    queryFn: () => fetchJson("/api/apprenant/achats"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

export function useApprenantDiscussions() {
  return useQuery({
    queryKey: apprenantKeys.discussions(),
    queryFn: () => fetchJson("/api/apprenant/discussions"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

export function useApprenantReviews() {
  return useQuery({
    queryKey: apprenantKeys.reviews(),
    queryFn: () => fetchJson("/api/apprenant/reviews"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

export function useApprenantRefunds() {
  return useQuery({
    queryKey: apprenantKeys.refunds(),
    queryFn: () => fetchJson("/api/apprenant/refunds"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

export function useApprenantRecommendations() {
  return useQuery({
    queryKey: apprenantKeys.recommendations(),
    queryFn: () => fetchJson("/api/apprenant/recommendations"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

export function useApprenantProfil() {
  return useQuery({
    queryKey: apprenantKeys.profil(),
    queryFn: () => fetchJson("/api/apprenant/profil"),
  });
}

export function useApprenantProduits() {
  return useQuery({
    queryKey: apprenantKeys.produits(),
    queryFn: () => fetchJson("/api/apprenant/produits"),
    refetchInterval: AUTO_REFRESH_LIST_MS,
    refetchIntervalInBackground: false,
  });
}

// ── Mutations ──

export function useInvalidateApprenant() {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ["apprenant"] }),
    invalidateEnrollments: () => queryClient.invalidateQueries({ queryKey: apprenantKeys.enrollments() }),
    invalidateCertificats: () => queryClient.invalidateQueries({ queryKey: apprenantKeys.certificats() }),
    invalidateReviews: () => queryClient.invalidateQueries({ queryKey: apprenantKeys.reviews() }),
    invalidateRefunds: () => queryClient.invalidateQueries({ queryKey: apprenantKeys.refunds() }),
  };
}

export function useApprenantMutation<TData, TVariables>(
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
