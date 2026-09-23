import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { runKycVerification } from "@/lib/agents/impl/kyc-verification";
import { runProductVerification } from "@/lib/agents/impl/product-verification";
import { runBuyerSupport } from "@/lib/agents/impl/buyer-support";
import { runFraudDetection } from "@/lib/agents/impl/fraud-detection";
import { runReviewsModeration } from "@/lib/agents/impl/reviews-moderation";
import { runDisputeResolution } from "@/lib/agents/impl/dispute-resolution";
import { runVendorCoach } from "@/lib/agents/impl/vendor-coach";
import { runAccountDeletion } from "@/lib/agents/impl/account-deletion";

/** POST /api/formations/admin/agents/run — déclenche les huit agents immédiatement. */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAdmin(session: { user?: { email?: string | null; role?: unknown } | null } | null): boolean {
  if (!session?.user) return false;
  const role = String(session.user.role ?? "").toUpperCase();
  if (role === "ADMIN") return true;
  const email = (session.user.email ?? "").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  return !!adminEmail && email === adminEmail;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  await ensureAgentsSeeded();

  const runners: Array<[string, () => Promise<unknown>]> = [
    ["kyc_verification", runKycVerification],
    ["product_verification", runProductVerification],
    ["buyer_support", runBuyerSupport],
    ["fraud_detection", runFraudDetection],
    ["reviews_moderation", runReviewsModeration],
    ["dispute_resolution", runDisputeResolution],
    ["vendor_coach", runVendorCoach],
    ["account_deletion", runAccountDeletion],
  ];

  const results: Record<string, unknown> = {};
  for (const [k, fn] of runners) {
    try {
      results[k] = await fn();
    } catch (e) {
      results[k] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({ ok: true, results, at: new Date().toISOString() });
}
