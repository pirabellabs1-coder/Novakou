import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { runAssistant } from "@/lib/agents/impl/assistant";
import { runModeration, runKyc, runRetention, runSupport } from "@/lib/agents/impl/rules-agents";

function isAdmin(session: { user?: ({ email?: string | null } & Record<string, unknown>) } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as Record<string, unknown>).role as string | undefined;
  if (role === "ADMIN" || role === "admin") return true;
  const email = (session.user.email || "").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  return !!adminEmail && email === adminEmail;
}

const RUNNERS: Record<string, () => Promise<unknown>> = {
  assistant: runAssistant,
  support: runSupport,
  moderation: runModeration,
  kyc: runKyc,
  retention: runRetention,
};

// POST — exécuter un agent immédiatement (bouton « Lancer maintenant »).
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const agent = String(body.agent || "");
  if (!RUNNERS[agent]) return NextResponse.json({ error: "Agent inconnu" }, { status: 400 });

  await ensureAgentsSeeded();
  try {
    const result = await RUNNERS[agent]();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
