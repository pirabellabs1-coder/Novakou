import { NextResponse } from "next/server";
import { getConfig } from "@/lib/admin/config-service";
import { PLAN_RULES, PLAN_FEATURES, PLAN_ORDER, type PlanName, type LivePlanConfig } from "@/lib/plans";

/**
 * GET /api/plans/live — Public endpoint returning merged plan configuration.
 * Merges admin overrides (from PlatformConfig DB/dev-file) on top of hardcoded PLAN_RULES defaults.
 * Cached for 60s with stale-while-revalidate for 5 minutes.
 */
export async function GET() {
  try {
    const config = await getConfig();
    const adminPlans = config.plans ?? {};

    const plans: Record<string, LivePlanConfig> = {};

    for (const planKey of PLAN_ORDER) {
      const defaults = PLAN_RULES[planKey];
      const adminKey = planKey.toLowerCase() as keyof typeof adminPlans;
      const overrides = adminPlans[adminKey];

      plans[planKey] = {
        name: defaults.name,
        nameEn: defaults.nameEn,
        commissionType: overrides?.commissionType ?? defaults.commissionType,
        commissionValue: overrides?.commissionValue ?? defaults.commissionValue,
        priceMonthly: overrides?.price ?? defaults.priceMonthly,
        priceAnnual: overrides?.priceAnnual ?? defaults.priceAnnual,
        serviceLimit: overrides?.maxServices === -1 ? Infinity : (overrides?.maxServices ?? defaults.serviceLimit),
        applicationLimit: overrides?.maxCandidatures === -1 ? Infinity : (overrides?.maxCandidatures ?? defaults.applicationLimit),
        boostLimit: overrides?.boostsPerMonth ?? defaults.boostLimit,
        scenarioLimit: overrides?.scenarioLimit === -1 ? Infinity : (overrides?.scenarioLimit ?? defaults.scenarioLimit),
        certificationLimit: overrides?.certificationLimit === -1 ? Infinity : (overrides?.certificationLimit ?? defaults.certificationLimit),
        productiviteAccess: overrides?.productiviteAccess ?? defaults.productiviteAccess,
        teamLimit: overrides?.teamLimit ?? defaults.teamLimit,
        crmAccess: overrides?.crmAccess ?? defaults.crmAccess,
        cloudStorageGB: overrides?.cloudStorageGB ?? defaults.cloudStorageGB,
        apiAccess: overrides?.apiAccess ?? defaults.apiAccess,
        supportLevel: overrides?.supportLevel ?? defaults.supportLevel,
        features: overrides?.features ?? PLAN_FEATURES[planKey],
      };
    }

    const response = NextResponse.json({
      plans,
      updatedAt: new Date().toISOString(),
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (error) {
    console.error("[API /api/plans/live]", error);

    // Fallback: return hardcoded defaults so the UI always has data
    const fallbackPlans: Record<string, LivePlanConfig> = {};
    for (const planKey of PLAN_ORDER) {
      const d = PLAN_RULES[planKey];
      fallbackPlans[planKey] = {
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
        features: PLAN_FEATURES[planKey],
      };
    }

    return NextResponse.json({
      plans: fallbackPlans,
      updatedAt: new Date().toISOString(),
    });
  }
}
