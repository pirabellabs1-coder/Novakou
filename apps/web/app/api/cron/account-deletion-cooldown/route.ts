import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";

/**
 * Cron quotidien : passe les demandes PENDING_COOLDOWN dont le délai 72h est écoulé
 * à AWAITING_REVIEW pour que l'admin puisse les traiter.
 *
 * Configuré dans vercel.json (ou Vercel UI) — appelé une fois par jour.
 */
export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const expired = await prisma.accountDeletionRequest.updateMany({
    where: {
      status: "PENDING_COOLDOWN",
      cooldownUntil: { lte: now },
    },
    data: { status: "AWAITING_REVIEW" },
  });

  return NextResponse.json({
    data: {
      promoted: expired.count,
      checkedAt: now.toISOString(),
    },
  });
}
