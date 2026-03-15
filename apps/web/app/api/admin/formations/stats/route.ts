// GET /api/admin/formations/stats — Stats globales formations pour l'admin

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const IS_DEV = process.env.DEV_MODE === "true";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    // In dev mode, return empty stats (no database)
    if (IS_DEV) {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({
          month: d.toLocaleString("fr-FR", { month: "short" }),
          revenue: 0,
          commission: 0,
          enrollments: 0,
        });
      }

      return NextResponse.json({
        totalFormations: 0,
        totalStudents: 0,
        revenueThisMonth: 0,
        certificatesIssued: 0,
        pendingFormations: 0,
        pendingInstructors: 0,
        revenueByMonth: months,
        enrollmentsByMonth: months,
        topCategories: [],
        recentActivity: [],
        trends: {
          formationsTrend: 0,
          studentsTrend: 0,
          revenueTrend: 0,
          certificatesTrend: 0,
        },
        marketing: {
          totalProducts: 0,
          productSales: 0,
          productRevenue: 0,
          abandonedCarts: 0,
          recoveredCarts: 0,
          recoveryRate: 0,
          failedPayments: 0,
        },
      });
    }

    // Production mode — query database
    const prisma = (await import("@freelancehigh/db")).default;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalFormations,
      totalStudents,
      certificatesIssued,
      pendingFormations,
      pendingInstructors,
      recentEnrollments,
      recentCertificates,
      prevMonthFormations,
      prevMonthStudents,
      prevMonthCerts,
    ] = await Promise.all([
      prisma.formation.count({ where: { status: "ACTIF" } }),
      prisma.enrollment.count(),
      prisma.certificate.count(),
      prisma.formation.count({ where: { status: "EN_ATTENTE" } }),
      prisma.instructeurProfile.count({ where: { status: "EN_ATTENTE" } }),
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          formation: { select: { titleFr: true } },
        },
      }),
      prisma.certificate.findMany({
        take: 5,
        orderBy: { issuedAt: "desc" },
        include: {
          user: { select: { name: true } },
          enrollment: {
            include: {
              formation: { select: { titleFr: true } },
            },
          },
        },
      }),
      prisma.formation.count({
        where: { status: "ACTIF", createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
      }),
      prisma.enrollment.count({
        where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
      }),
      prisma.certificate.count({
        where: { issuedAt: { gte: startOfPrevMonth, lt: startOfMonth } },
      }),
    ]);

    // Revenue this month
    const monthRevenue = await prisma.enrollment.aggregate({
      where: { createdAt: { gte: startOfMonth }, paidAmount: { gt: 0 } },
      _sum: { paidAmount: true },
    });
    const revenueThisMonth = monthRevenue._sum.paidAmount ?? 0;

    // Revenue prev month (for trend)
    const prevRevenue = await prisma.enrollment.aggregate({
      where: { createdAt: { gte: startOfPrevMonth, lt: startOfMonth }, paidAmount: { gt: 0 } },
      _sum: { paidAmount: true },
    });
    const revenuePrevMonth = prevRevenue._sum.paidAmount ?? 0;

    // Current month counts for trend
    const thisMonthFormations = await prisma.formation.count({
      where: { status: "ACTIF", createdAt: { gte: startOfMonth } },
    });
    const thisMonthStudents = await prisma.enrollment.count({
      where: { createdAt: { gte: startOfMonth } },
    });
    const thisMonthCerts = await prisma.certificate.count({
      where: { issuedAt: { gte: startOfMonth } },
    });

    // Compute trends (percentage change vs previous month)
    function trend(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    const trends = {
      formationsTrend: trend(thisMonthFormations, prevMonthFormations),
      studentsTrend: trend(thisMonthStudents, prevMonthStudents),
      revenueTrend: trend(revenueThisMonth, revenuePrevMonth),
      certificatesTrend: trend(thisMonthCerts, prevMonthCerts),
    };

    // Revenue by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const enrollmentsByMonthRaw = await prisma.enrollment.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: twelveMonthsAgo }, paidAmount: { gt: 0 } },
      _sum: { paidAmount: true },
      _count: true,
    });

    const revenueMap = new Map<string, number>();
    const enrollCountMap = new Map<string, number>();
    for (const row of enrollmentsByMonthRaw) {
      const key = `${row.createdAt.getFullYear()}-${String(row.createdAt.getMonth() + 1).padStart(2, "0")}`;
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + (row._sum.paidAmount ?? 0));
      enrollCountMap.set(key, (enrollCountMap.get(key) ?? 0) + row._count);
    }

    const revenueByMonth = [];
    const enrollmentsByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rev = revenueMap.get(key) ?? 0;
      const count = enrollCountMap.get(key) ?? 0;
      const monthLabel = d.toLocaleString("fr-FR", { month: "short" });
      revenueByMonth.push({
        month: monthLabel,
        revenue: Math.round(rev),
        commission: Math.round(rev * 0.3),
      });
      enrollmentsByMonth.push({
        month: monthLabel,
        enrollments: count,
      });
    }

    // Top categories
    const categoriesWithCounts = await prisma.formationCategory.findMany({
      select: {
        nameFr: true,
        color: true,
        _count: { select: { formations: true } },
      },
      orderBy: { formations: { _count: "desc" } },
      take: 6,
    });

    const topCategories = categoriesWithCounts.map((c) => ({
      name: c.nameFr,
      value: c._count.formations,
      color: c.color || "#22C55E",
    }));

    // Recent activity
    const recentActivity = [
      ...recentEnrollments.map((e) => ({
        type: "enrollment",
        title: `Inscription : ${e.formation.titleFr}`,
        user: e.user.name,
        date: new Date(e.createdAt).toLocaleDateString("fr-FR"),
        timestamp: new Date(e.createdAt).toISOString(),
      })),
      ...recentCertificates.map((c) => ({
        type: "certificate",
        title: `Certificat : ${c.enrollment.formation.titleFr}`,
        user: c.user.name,
        date: new Date(c.issuedAt).toLocaleDateString("fr-FR"),
        timestamp: new Date(c.issuedAt).toISOString(),
      })),
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);

    // Marketing stats
    const [totalProducts, productSalesAgg, abandonedCartsTotal, recoveredCarts, failedPayments] = await Promise.all([
      prisma.digitalProduct.count({ where: { status: "ACTIF" } }),
      prisma.digitalProductPurchase.aggregate({ _sum: { paidAmount: true }, _count: true }),
      prisma.abandonedCart.count(),
      prisma.abandonedCart.count({ where: { status: "CONVERTI" } }),
      prisma.marketingEvent.count({ where: { type: "PAYMENT_FAILED" } }),
    ]);

    const marketing = {
      totalProducts,
      productSales: productSalesAgg._count,
      productRevenue: productSalesAgg._sum.paidAmount ?? 0,
      abandonedCarts: abandonedCartsTotal,
      recoveredCarts,
      recoveryRate: abandonedCartsTotal > 0 ? (recoveredCarts / abandonedCartsTotal) * 100 : 0,
      failedPayments,
    };

    return NextResponse.json({
      totalFormations,
      totalStudents,
      revenueThisMonth,
      certificatesIssued,
      pendingFormations,
      pendingInstructors,
      revenueByMonth,
      enrollmentsByMonth,
      topCategories,
      recentActivity,
      trends,
      marketing,
    });
  } catch (error) {
    console.error("[GET /api/admin/formations/stats]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
