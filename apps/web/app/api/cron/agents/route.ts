import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { ensureAgentsSeeded } from "@/lib/agents/runtime";
import { runAssistant } from "@/lib/agents/impl/assistant";
import { runModeration, runKyc, runRetention, runSupport } from "@/lib/agents/impl/rules-agents";

/**
 * GET /api/cron/agents
 * Exécute tous les agents ACTIVÉS (chacun se saute lui-même s'il est désactivé).
 * La déduplication des actions gère naturellement les cadences (un rapport
 * quotidien ne part qu'une fois par jour, etc.).
 * ?agent=assistant|support|moderation|kyc|retention → exécute un seul agent.
 */
export const dynamic = "force-dynamic";

const RUNNERS: Record<string, () => Promise<unknown>> = {
  assistant: runAssistant,
  support: runSupport,
  moderation: runModeration,
  kyc: runKyc,
  retention: runRetention,
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
