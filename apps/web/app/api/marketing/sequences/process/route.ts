// /api/marketing/sequences/process — Batch process pending email steps
// Accepts both POST (manual trigger) and GET (Vercel cron uses GET).

import { NextRequest, NextResponse } from "next/server";
import { processPendingSteps } from "@/lib/marketing/email-sequence-processor";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;
const CRON_SECRET = process.env.CRON_SECRET || "";

async function handle(req: NextRequest) {
  try {
    if (!DEV_MODE && CRON_SECRET) {
      const authHeader = req.headers.get("authorization");
      const providedSecret = authHeader?.replace("Bearer ", "");
      if (providedSecret !== CRON_SECRET) {
        return NextResponse.json({ error: "Non autorise" }, { status: 401 });
      }
    }

    const startTime = Date.now();
    const processed = await processPendingSteps();
    const duration = Date.now() - startTime;

    console.log(
      `[sequences/process] Processed ${processed} step(s) in ${duration}ms`,
    );

    return NextResponse.json({
      success: true,
      processed,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[sequences/process]", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement des etapes" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
