import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { runKycVerification } from "@/lib/agents/impl/kyc-verification";
import { runProductVerification } from "@/lib/agents/impl/product-verification";

/**
 * POST /api/formations/admin/agents/run
 *
 * Déclenche les deux agents immédiatement, sans attendre le prochain quart
 * d'heure du cron. Réservé à l'admin — protégé par la session, pas par
 * CRON_SECRET (le cron régulier reste le chemin normal).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 280;

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

  const results: Record<string, unknown> = {};
  for (const [k, fn] of [
    ["kyc_verification", runKycVerification],
    ["product_verification", runProductVerification],
  ] as const) {
    try {
      results[k] = await fn();
    } catch (e) {
      results[k] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json({ ok: true, results, at: new Date().toISOString() });
}
