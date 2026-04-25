import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

const COMMISSION_PCT = 40;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      include: {
        program: { select: { commissionPct: true, name: true } },
        commissions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true, orderId: true, orderType: true, orderAmount: true,
            commissionAmount: true, status: true, createdAt: true, paidAt: true,
          },
        },
        clicks: {
          where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          select: { createdAt: true, converted: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ isAffiliate: false, commissionPct: COMMISSION_PCT });
    }

    // Weekly clicks per day
    const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const weeklyClicks = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayClicks = profile.clicks.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.toDateString() === d.toDateString();
      });
      const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
      return { day: labels[dayIndex], clicks: dayClicks.length };
    });

    const totalWeekClicks = weeklyClicks.reduce((s, d) => s + d.clicks, 0);

    // Summary commissions
    const commissionSummary = {
      total: profile.totalEarned,
      confirmed: profile.commissions.filter((c) => c.status === "APPROVED").reduce((s, c) => s + c.commissionAmount, 0),
      pending: profile.pendingEarnings,
      paid: profile.paidEarnings,
    };

    const commissionPct = profile.program?.commissionPct ?? COMMISSION_PCT;
    const avgPerSale = profile.totalConversions > 0 ? profile.totalEarned / profile.totalConversions : 0;

    return NextResponse.json({
      isAffiliate: true,
      commissionPct,
      profile: {
        id: profile.id,
        affiliateCode: profile.affiliateCode,
        status: profile.status,
        totalClicks: profile.totalClicks,
        totalConversions: profile.totalConversions,
        totalEarned: profile.totalEarned,
        pendingEarnings: profile.pendingEarnings,
        paidEarnings: profile.paidEarnings,
        conversionRate: profile.conversionRate,
        createdAt: profile.createdAt,
      },
      weeklyClicks,
      totalWeekClicks,
      recentCommissions: profile.commissions,
      commissionSummary,
      quickStats: {
        conversionRatePct: profile.conversionRate,
        avgPerSaleXof: Math.round(avgPerSale),
      },
    });
  } catch (err) {
    console.error("[affilie/stats]", err);
    return NextResponse.json({ isAffiliate: false, commissionPct: COMMISSION_PCT });
  }
}
