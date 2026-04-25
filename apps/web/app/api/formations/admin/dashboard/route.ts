import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch in parallel
    const [
      totalUsers,
      newUsersToday,
      totalFormations,
      publishedFormations,
      pendingFormations,
      totalDigitalProducts,
      publishedProducts,
      pendingProducts,
      allEnrollments,
      allPurchases,
      recentEnrollments,
      recentPurchases,
      pendingFormationsList,
      pendingProductsList,
      pendingReports,
      pendingRefunds,
      platformRevenueAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.formation.count(),
      prisma.formation.count({ where: { status: "ACTIF" } }),
      prisma.formation.count({ where: { status: "EN_ATTENTE" } }),
      prisma.digitalProduct.count(),
      prisma.digitalProduct.count({ where: { status: "ACTIF" } }),
      prisma.digitalProduct.count({ where: { status: "EN_ATTENTE" } }),
      prisma.enrollment.findMany({
        select: { paidAmount: true, createdAt: true, refundedAt: true },
      }),
      prisma.digitalProductPurchase.findMany({
        select: { paidAmount: true, createdAt: true },
      }),
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          paidAmount: true,
          createdAt: true,
          refundedAt: true,
          user: { select: { name: true, email: true } },
          formation: { select: { title: true } },
        },
      }),
      prisma.digitalProductPurchase.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          paidAmount: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          product: { select: { title: true } },
        },
      }),
      prisma.formation.findMany({
        where: { status: "EN_ATTENTE" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          price: true,
          createdAt: true,
          thumbnail: true,
          instructeur: { select: { user: { select: { name: true } } } },
        },
      }),
      prisma.digitalProduct.findMany({
        where: { status: "EN_ATTENTE" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          price: true,
          createdAt: true,
          banner: true,
          productType: true,
          instructeur: { select: { user: { select: { name: true } } } },
        },
      }),
      prisma.discussionReport.count(),
      prisma.refundRequest.count({ where: { status: "PENDING" } }),
      prisma.platformRevenue.aggregate({
        _sum: { commissionAmount: true, grossAmount: true, affiliateAmount: true },
        _count: { id: true },
      }),
    ]);

    // Total revenue (lifetime)
    const totalEnrollmentRevenue = allEnrollments.reduce((s, e) => s + (e.refundedAt ? 0 : e.paidAmount), 0);
    const totalPurchaseRevenue = allPurchases.reduce((s, p) => s + p.paidAmount, 0);
    const totalRevenue = totalEnrollmentRevenue + totalPurchaseRevenue;

    // Platform commission from real PlatformRevenue ledger (precise), fallback to commission rate estimate
    const realCommission = platformRevenueAgg._sum.commissionAmount ?? 0;
    const realAffiliatePaid = platformRevenueAgg._sum.affiliateAmount ?? 0;
    const realGross = platformRevenueAgg._sum.grossAmount ?? 0;
    const platformCommission = realCommission > 0 ? realCommission : totalRevenue * PLATFORM_COMMISSION_RATE;

    // Transactions this month
    const enrollmentsThisMonth = allEnrollments.filter((e) => e.createdAt >= startOfMonth);
    const purchasesThisMonth = allPurchases.filter((p) => p.createdAt >= startOfMonth);
    const transactionsThisMonthCount = enrollmentsThisMonth.length + purchasesThisMonth.length;
    const transactionsThisMonthRevenue =
      enrollmentsThisMonth.reduce((s, e) => s + (e.refundedAt ? 0 : e.paidAmount), 0) +
      purchasesThisMonth.reduce((s, p) => s + p.paidAmount, 0);

    // Monthly chart — last 6 months
    const monthlyChart: { month: string; revenue: number; transactions: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = monthStart.toLocaleDateString("fr-FR", { month: "short" });
      const enrolls = allEnrollments.filter((e) => e.createdAt >= monthStart && e.createdAt < monthEnd);
      const purchs = allPurchases.filter((p) => p.createdAt >= monthStart && p.createdAt < monthEnd);
      const revenue =
        enrolls.reduce((s, e) => s + (e.refundedAt ? 0 : e.paidAmount), 0) +
        purchs.reduce((s, p) => s + p.paidAmount, 0);
      monthlyChart.push({ month: label, revenue, transactions: enrolls.length + purchs.length });
    }

    // Recent transactions (merged)
    const recentTransactions = [
      ...recentEnrollments.map((e) => ({
        id: e.id,
        type: "formation" as const,
        user: e.user.name ?? e.user.email,
        product: e.formation.title,
        amount: e.paidAmount,
        createdAt: e.createdAt,
        status: e.refundedAt ? "refunded" : "completed",
      })),
      ...recentPurchases.map((p) => ({
        id: p.id,
        type: "product" as const,
        user: p.user.name ?? p.user.email,
        product: p.product.title,
        amount: p.paidAmount,
        createdAt: p.createdAt,
        status: "completed",
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    // Pending items
    const pendingItems = [
      ...pendingFormationsList.map((f) => ({
        id: f.id,
        kind: "formation" as const,
        title: f.title,
        price: f.price,
        thumbnail: f.thumbnail,
        type: "Formation vidéo",
        seller: f.instructeur.user.name ?? "—",
        submittedAt: f.createdAt,
      })),
      ...pendingProductsList.map((p) => ({
        id: p.id,
        kind: "product" as const,
        title: p.title,
        price: p.price,
        thumbnail: p.banner,
        type: p.productType,
        seller: p.instructeur.user.name ?? "—",
        submittedAt: p.createdAt,
      })),
    ]
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 5);

    return NextResponse.json({
      data: {
        kpis: {
          totalRevenue,
          platformCommission,
          affiliatePayouts: realAffiliatePaid,
          ledgerGross: realGross,
          ledgerCount: platformRevenueAgg._count.id,
          totalUsers,
          newUsersToday,
          totalProducts: totalFormations + totalDigitalProducts,
          publishedProducts: publishedFormations + publishedProducts,
          pendingProducts: pendingFormations + pendingProducts,
          transactionsThisMonth: transactionsThisMonthCount,
          transactionsThisMonthRevenue,
        },
        quickStats: {
          pendingReports,
          pendingRefunds,
          pendingFormations,
          pendingProducts,
        },
        monthlyChart,
        recentTransactions,
        pendingItems,
      },
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json({ data: null });
  }
}
