// GET /api/cron/cohort-status — Transition automatique des statuts de cohortes
// Appelé par Vercel Cron toutes les 15 minutes

import { NextRequest, NextResponse } from "next/server";
import prisma from "@freelancehigh/db";
import { requireCronAuth } from "@/lib/cron/auth";

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  try {
    const now = new Date();

    // OUVERT/COMPLET → EN_COURS quand startDate <= now
    const started = await prisma.formationCohort.updateMany({
      where: {
        status: { in: ["OUVERT", "COMPLET"] },
        startDate: { lte: now },
      },
      data: { status: "EN_COURS" },
    });

    // EN_COURS → TERMINE quand endDate <= now
    const ended = await prisma.formationCohort.updateMany({
      where: {
        status: "EN_COURS",
        endDate: { lte: now },
      },
      data: { status: "TERMINE" },
    });

    // OUVERT avec enrollmentDeadline dépassée et 0 participants → ANNULE
    const expired = await prisma.formationCohort.updateMany({
      where: {
        status: "OUVERT",
        enrollmentDeadline: { lt: now },
        currentCount: 0,
      },
      data: { status: "ANNULE" },
    });

    return NextResponse.json({
      success: true,
      startedCount: started.count,
      endedCount: ended.count,
      expiredCount: expired.count,
    });
  } catch (error) {
    console.error("[CRON cohort-status]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
