import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron quotidien : passe les demandes PENDING_COOLDOWN dont le délai 72h est écoulé
 * à AWAITING_REVIEW pour que l'admin puisse les traiter.
 *
 * Configuré dans vercel.json (ou Vercel UI) — appelé une fois par jour.
 */
export async function GET(request: Request) {
  // Vercel Cron envoie un Authorization: Bearer <CRON_SECRET> si défini
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

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
