// GET /api/admin/formations/marketing — Stats marketing consolidees de tous les instructeurs

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const now = new Date();

    const [
      activeFlashPromotions,
      activePromoCodes,
      activeDiscountCodes,
      purchaseStats,
      enrollmentRevenue,
    ] = await Promise.all([
      prisma.flashPromotion.count({
        where: { isActive: true, endsAt: { gte: now } },
      }),
      prisma.promoCode.count({
        where: { isActive: true },
      }),
      prisma.discountCode.count({
        where: { isActive: true },
      }),
      prisma.digitalProductPurchase.aggregate({
        _sum: { paidAmount: true },
        _count: true,
      }),
      prisma.enrollment.aggregate({
        where: { paidAmount: { gt: 0 } },
        _sum: { paidAmount: true },
        _count: true,
      }),
    ]);

    const totalMarketingRevenue =
      (purchaseStats._sum.paidAmount ?? 0) + (enrollmentRevenue._sum.paidAmount ?? 0);

    // Conversion rate: purchases / marketing page views
    const [pageViewCount, purchaseCount] = await Promise.all([
      prisma.marketingEvent.count({ where: { type: "PAGE_VIEW" } }),
      prisma.marketingEvent.count({ where: { type: "PURCHASE_COMPLETED" } }),
    ]);
    const avgConversionRate =
      pageViewCount > 0 ? Math.round((purchaseCount / pageViewCount) * 10000) / 100 : 0;

    // Promotions grouped by instructor
    const flashPromos = await prisma.flashPromotion.findMany({
      where: { isActive: true, endsAt: { gte: now } },
      include: {
        formation: {
          select: {
            titleFr: true,
            instructeur: {
              select: {
                id: true,
                user: { select: { name: true } },
              },
            },
          },
        },
        digitalProduct: {
          select: {
            titleFr: true,
            instructeur: {
              select: {
                id: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const instructorMap = new Map<
      string,
      { instructorName: string; promotionCount: number }
    >();

    for (const promo of flashPromos) {
      const instructeur =
        promo.formation?.instructeur ?? promo.digitalProduct?.instructeur;
      if (!instructeur) continue;
      const existing = instructorMap.get(instructeur.id);
      if (existing) {
        existing.promotionCount += 1;
      } else {
        instructorMap.set(instructeur.id, {
          instructorName: instructeur.user.name,
          promotionCount: 1,
        });
      }
    }

    const promotionsByInstructor = Array.from(instructorMap.entries()).map(
      ([instructorId, data]) => ({
        instructorId,
        instructorName: data.instructorName,
        promotionCount: data.promotionCount,
      })
    );

    return NextResponse.json({
      activePromotions: activeFlashPromotions,
      activePromoCodes: activePromoCodes + activeDiscountCodes,
      totalMarketingRevenue,
      avgConversionRate,
      promotionsByInstructor,
    });
  } catch (error) {
    console.error("[GET /api/admin/formations/marketing]", error);
    return NextResponse.json({
      activePromotions: 0,
      activePromoCodes: 0,
      totalMarketingRevenue: 0,
      avgConversionRate: 0,
      promotionsByInstructor: [],
    });
  }
}
