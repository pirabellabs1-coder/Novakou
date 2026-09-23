import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { runKycVerification } from "@/lib/agents/impl/kyc-verification";
import { runProductVerification } from "@/lib/agents/impl/product-verification";
import { runBuyerSupport } from "@/lib/agents/impl/buyer-support";
import { runFraudDetection } from "@/lib/agents/impl/fraud-detection";
import { runReviewsModeration } from "@/lib/agents/impl/reviews-moderation";
import { runDisputeResolution } from "@/lib/agents/impl/dispute-resolution";
import { runVendorCoach } from "@/lib/agents/impl/vendor-coach";
import { runAccountDeletion } from "@/lib/agents/impl/account-deletion";

/**
 * GET /api/cron/agents
 *
 * Fait tourner les huit agents autonomes. Chacun s'auto-limite en temps
 * (BUDGET_MS interne, 220 s) pour rester sous le plafond de fonction.
 * `?agent=<key>` exécute un seul agent.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RUNNERS: Record<string, () => Promise<unknown>> = {
  kyc_verification: runKycVerification,
  product_verification: runProductVerification,
  buyer_support: runBuyerSupport,
  fraud_detection: runFraudDetection,
  reviews_moderation: runReviewsModeration,
  dispute_resolution: runDisputeResolution,
  vendor_coach: runVendorCoach,
  account_deletion: runAccountDeletion,
};

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  await ensureAgentsSeeded();

  const only = new URL(req.url).searchParams.get("agent");
  const keys = only && RUNNERS[only] ? [only] : Object.keys(RUNNERS);

  const results: Record<string, unknown> = {};
  for (const k of keys) {
    try {
      results[k] = await RUNNERS[k]();
    } catch (e) {
      results[k] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({ ok: true, ran: keys, results, at: new Date().toISOString() });
}
