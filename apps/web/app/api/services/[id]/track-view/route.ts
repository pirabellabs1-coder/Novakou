import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

// POST /api/services/[id]/track-view — Track a service view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true, isBoosted: true, boostedUntil: true },
    });
    if (!service) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    // Create ServiceView record
    await prisma.serviceView.create({
      data: {
        serviceId: id,
        userId: session?.user?.id || null,
        ip,
      },
    });

    // Update cached view counter
    await prisma.service.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // If service has an active boost, increment BoostDailyStat impressions
    if (service.isBoosted && service.boostedUntil && new Date(service.boostedUntil) > new Date()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeBoost = await prisma.boost.findFirst({
        where: { serviceId: id, status: "ACTIVE" },
        select: { id: true },
      });

      if (activeBoost) {
        // Try to increment today's stat, create if missing
        const updated = await prisma.boostDailyStat.updateMany({
          where: { boostId: activeBoost.id, date: today },
          data: { impressions: { increment: 1 } },
        });
        if (updated.count === 0) {
          await prisma.boostDailyStat.create({
            data: { boostId: activeBoost.id, date: today, impressions: 1 },
          }).catch(() => {}); // Ignore if already created by race condition
        }

        // Also update the boost's total counter
        await prisma.boost.update({
          where: { id: activeBoost.id },
          data: { actualImpressions: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /services/[id]/track-view]", error);
    return NextResponse.json({ error: "Erreur tracking vue" }, { status: 500 });
  }
}
