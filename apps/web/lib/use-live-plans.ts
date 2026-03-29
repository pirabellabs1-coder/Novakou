"use client";

// ============================================================
// Live Plans Hook — fetches admin-overridden plan config
// Separate file to avoid importing React hooks in server-side code
// ============================================================

import { useState, useEffect, useRef } from "react";
import {
  PLAN_RULES,
  PLAN_ORDER,
  PLAN_FEATURES,
  type PlanName,
  type LivePlanConfig,
} from "@/lib/plans";

/** Build default LivePlanConfig from hardcoded constants */
function buildDefaultLivePlans(): Record<PlanName, LivePlanConfig> {
  const result = {} as Record<PlanName, LivePlanConfig>;
  for (const key of PLAN_ORDER) {
    const d = PLAN_RULES[key];
    result[key] = {
      name: d.name,
      nameEn: d.nameEn,
      commissionType: d.commissionType,
      commissionValue: d.commissionValue,
      priceMonthly: d.priceMonthly,
      priceAnnual: d.priceAnnual,
      serviceLimit: d.serviceLimit,
      applicationLimit: d.applicationLimit,
      boostLimit: d.boostLimit,
      scenarioLimit: d.scenarioLimit,
      certificationLimit: d.certificationLimit,
      productiviteAccess: d.productiviteAccess,
      teamLimit: d.teamLimit,
      crmAccess: d.crmAccess,
      cloudStorageGB: d.cloudStorageGB,
      apiAccess: d.apiAccess,
      supportLevel: d.supportLevel,
      features: PLAN_FEATURES[key],
    };
  }
  return result;
}

const DEFAULT_LIVE_PLANS = buildDefaultLivePlans();

// Module-level SWR cache (shared between hook instances)
let _cache: { plans: Record<PlanName, LivePlanConfig>; features: Record<PlanName, string[]>; fetchedAt: number } | null = null;
const CACHE_TTL = 60_000; // 60s

export interface UseLivePlansResult {
  plans: Record<PlanName, LivePlanConfig>;
  features: Record<PlanName, string[]>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that fetches live plan configuration from /api/plans/live.
 * Falls back to hardcoded PLAN_RULES + PLAN_FEATURES if the API is unavailable.
 */
export function useLivePlans(): UseLivePlansResult {
  const [plans, setPlans] = useState<Record<PlanName, LivePlanConfig>>(_cache?.plans ?? DEFAULT_LIVE_PLANS);
  const [features, setFeatures] = useState<Record<PlanName, string[]>>(_cache?.features ?? PLAN_FEATURES);
  const [isLoading, setIsLoading] = useState(!_cache || Date.now() - _cache.fetchedAt > CACHE_TTL);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    // Use cache if fresh
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL) {
      setPlans(_cache.plans);
      setFeatures(_cache.features);
      setIsLoading(false);
      return;
    }

    if (fetched.current) return;
    fetched.current = true;

    fetch("/api/plans/live")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { plans: Record<string, LivePlanConfig> }) => {
        // Restore Infinity from -1 (JSON doesn't support Infinity)
        const parsed = {} as Record<PlanName, LivePlanConfig>;
        const feat = {} as Record<PlanName, string[]>;
        for (const key of PLAN_ORDER) {
          const raw = data.plans[key] ?? DEFAULT_LIVE_PLANS[key];
          parsed[key] = {
            ...raw,
            serviceLimit: raw.serviceLimit === -1 ? Infinity : raw.serviceLimit,
            applicationLimit: raw.applicationLimit === -1 ? Infinity : raw.applicationLimit,
            scenarioLimit: raw.scenarioLimit === -1 ? Infinity : raw.scenarioLimit,
            certificationLimit: raw.certificationLimit === -1 ? Infinity : raw.certificationLimit,
          };
          feat[key] = raw.features ?? PLAN_FEATURES[key];
        }
        _cache = { plans: parsed, features: feat, fetchedAt: Date.now() };
        setPlans(parsed);
        setFeatures(feat);
        setError(null);
      })
      .catch((err) => {
        console.error("[useLivePlans] Fetch failed, using defaults:", err);
        setError(err.message);
        // Keep defaults already set in state
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { plans, features, isLoading, error };
}
