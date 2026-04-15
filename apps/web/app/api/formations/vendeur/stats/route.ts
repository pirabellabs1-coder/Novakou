import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

const PLATFORM_FEE = 0.20;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "6m";
    const monthsBack = period === "3m" ? 3 : period === "12m" ? 12 : 6;

    await getOrCreateInstructeur(userId); // ensure profile exists
    const profile = await prisma.instructeurProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        formations: {
          select: {
            id: true,
            title: true,
            studentsCount: true,
            rating: true,
            reviewsCount: true,
            status: true,
            price: true,
            customCategory: true,
            enrollments: {
              select: { paidAmount: true, createdAt: true, refundedAt: true, completedAt: true },
            },
          },
        },
        digitalProducts: {
          select: {
            id: true,
            title: true,
            salesCount: true,
            rating: true,
            reviewsCount: true,
            status: true,
            price: true,
            productType: true,
            purchases: {
              select: { paidAmount: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({
        data: { monthlyChart: [], topProducts: [], summary: { totalRevenue: 0, netRevenue: 0, totalSales: 0, avgPerSale: 0 } },
      });
    }

    // ── Build monthly chart ──
    const now = new Date();
    const months = Array.from({ length: monthsBack }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("fr-FR", { month: "short" }), amount: 0, netAmount: 0, sales: 0 };
    });

    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

    const allTxns = [
      ...profile.formations.flatMap((f) =>
        f.enrollments
          .filter((e) => e.refundedAt === null && new Date(e.createdAt) >= cutoff)
          .map((e) => ({ amount: e.paidAmount, createdAt: e.createdAt }))
      ),
      ...profile.digitalProducts.flatMap((p) =>
        p.purchases
          .filter((pu) => new Date(pu.createdAt) >= cutoff)
          .map((pu) => ({ amount: pu.paidAmount, createdAt: pu.createdAt }))
      ),
    ];

    for (const txn of allTxns) {
      const d = new Date(txn.createdAt);
      const entry = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (entry) {
        entry.amount += txn.amount;
        entry.netAmount += txn.amount * (1 - PLATFORM_FEE);
        entry.sales += 1;
      }
    }

    const monthlyChart = months.map((m) => ({
      month: m.label,
      amount: Math.round(m.amount),
      netAmount: Math.round(m.netAmount),
      sales: m.sales,
    }));

    // ── Summary for the period ──
    const totalRevenue = allTxns.reduce((s, t) => s + t.amount, 0);
    const netRevenue = totalRevenue * (1 - PLATFORM_FEE);
    const totalSales = allTxns.length;
    const avgPerSale = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

    // ── Top products (all time) ──
    const topProducts = [
      ...profile.formations.map((f) => {
        const active = f.enrollments.filter((e) => e.refundedAt === null);
        const completed = active.filter((e) => e.completedAt !== null).length;
        return {
          id: f.id,
          title: f.title,
          type: "Cours vidéo",
          revenue: active.reduce((s, e) => s + e.paidAmount, 0),
          sales: active.length,
          rating: f.rating,
          reviewsCount: f.reviewsCount,
          engagement: active.length > 0 ? Math.round((completed / active.length) * 100) : 0,
        };
      }),
      ...profile.digitalProducts.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.productType as string,
        revenue: p.purchases.reduce((s, pu) => s + pu.paidAmount, 0),
        sales: p.purchases.length,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        engagement: 0,
      })),
    ]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ── Rating distribution ──
    const allRatings = [
      ...profile.formations.map((f) => f.rating),
      ...profile.digitalProducts.map((p) => p.rating),
    ].filter((r) => r > 0);
    const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: allRatings.filter((r) => Math.round(r) === star).length,
    }));

    return NextResponse.json({
      data: {
        monthlyChart,
        topProducts,
        ratingDist,
        summary: {
          totalRevenue: Math.round(totalRevenue),
          netRevenue: Math.round(netRevenue),
          totalSales,
          avgPerSale,
        },
      },
    });
  } catch (err) {
    console.error("[vendeur/stats]", err);
    return NextResponse.json({ data: null });
  }
}
