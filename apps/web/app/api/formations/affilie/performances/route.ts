import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

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
        program: { select: { commissionPct: true } },
        clicks: { select: { createdAt: true, converted: true, landingPage: true } },
        commissions: { select: { commissionAmount: true, orderAmount: true, createdAt: true, status: true, orderId: true, orderType: true } },
      },
    });

    if (!profile) return NextResponse.json({ isAffiliate: false });

    // Monthly breakdown — last 6 months
    const monthly: { month: string; clicks: number; conversions: number; earnings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthLabel = d.toLocaleDateString("fr-FR", { month: "short" });

      const monthClicks = profile.clicks.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      });
      const monthCommissions = profile.commissions.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      });

      monthly.push({
        month: monthLabel,
        clicks: monthClicks.length,
        conversions: monthClicks.filter((c) => c.converted).length,
        earnings: monthCommissions.reduce((s, c) => s + c.commissionAmount, 0),
      });
    }

    // Per landing page breakdown (proxy for per-formation performance)
    const pageMap: Record<string, { page: string; clicks: number; conversions: number; earnings: number }> = {};
    for (const click of profile.clicks) {
      const page = click.landingPage ?? "/";
      if (!pageMap[page]) pageMap[page] = { page, clicks: 0, conversions: 0, earnings: 0 };
      pageMap[page].clicks++;
      if (click.converted) pageMap[page].conversions++;
    }
    for (const comm of profile.commissions) {
      // assign earnings to the most recent matching page (best effort)
      const pages = Object.values(pageMap);
      if (pages.length > 0) {
        pages.sort((a, b) => b.clicks - a.clicks);
        pageMap[pages[0].page].earnings += comm.commissionAmount;
      }
    }

    const totalClicks = profile.totalClicks;
    const totalConversions = profile.totalConversions;
    const totalEarnings = profile.totalEarned;
    const avgCtr = totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0;

    return NextResponse.json({
      isAffiliate: true,
      commissionPct: profile.program?.commissionPct ?? 40,
      monthly,
      perPage: Object.values(pageMap).sort((a, b) => b.earnings - a.earnings),
      totals: {
        clicks: totalClicks,
        conversions: totalConversions,
        earnings: totalEarnings,
        ctr: Math.round(avgCtr * 10) / 10,
      },
    });
  } catch {
    return NextResponse.json({ isAffiliate: false });
  }
}
