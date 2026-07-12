import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { resumeScheduledRuns } from "@/lib/marketing/automation-engine";

/**
 * POST/GET /api/cron/automation-scheduled
 *
 * Cron Vercel qui reprend les workflows mis en pause par une action DELAY :
 * il exécute les actions restantes dont le délai est écoulé (table
 * AutomationScheduledRun, claim-first anti double envoi).
 *
 * Protection : Authorization: Bearer CRON_SECRET ou header x-vercel-cron.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  try {
    const { processed, scheduled } = await resumeScheduledRuns(100);
    return NextResponse.json({ ok: true, processed, rescheduled: scheduled });
  } catch (err) {
    console.error("[cron/automation-scheduled]", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "err" }, { status: 500 });
  }
}
