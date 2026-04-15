import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";

const PLATFORM_FEE = PLATFORM_COMMISSION_RATE; // 5% platform commission (single source of truth)

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Get instructeur profile with formations + products
    await getOrCreateInstructeur(userId); // ensure profile exists
    const profile = await prisma.instructeurProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        totalEarned: true,
        status: true,
        formations: {
          select: {
            id: true,
            title: true,
            studentsCount: true,
            rating: true,
            reviewsCount: true,
            status: true,
            price: true,
            thumbnail: true,
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
            banner: true,
            purchases: {
              select: { paidAmount: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({
        data: {
          kpis: { totalRevenue: 0, netRevenue: 0, totalStudents: 0, totalProducts: 0, avgRating: 0, totalReviews: 0 },
          monthlyChart: [],
          recentSales: [],
          topProducts: [],
        },
      });
    }

    // ── All transactions ──
    const allEnrollments = profile.formations.flatMap((f) =>
      f.enrollments.map((e) => ({
        type: "formation" as const,
        productId: f.id,
        productTitle: f.title,
        productType: "Cours vidéo",
        amount: e.paidAmount,
        createdAt: e.createdAt,
        refunded: e.refundedAt !== null,
        completed: e.completedAt !== null,
      }))
    );
    const allPurchases = profile.digitalProducts.flatMap((p) =>
      p.purchases.map((pu) => ({
        type: "product" as const,
        productId: p.id,
        productTitle: p.title,
        productType: p.productType as string,
        amount: pu.paidAmount,
        createdAt: pu.createdAt,
        refunded: false,
        completed: true,
      }))
    );
    const allTxns = [...allEnrollments, ...allPurchases];
    const completedTxns = allTxns.filter((t) => !t.refunded);

    // ── KPIs ──
    const totalRevenue = completedTxns.reduce((s, t) => s + t.amount, 0);
    const netRevenue = totalRevenue * (1 - PLATFORM_FEE);
    const totalStudents = profile.formations.reduce((s, f) => s + f.studentsCount, 0);
    const totalProducts = profile.formations.length + profile.digitalProducts.length;

    const ratingItems = [
      ...profile.formations.filter((f) => f.reviewsCount > 0).map((f) => ({ r: f.rating, c: f.reviewsCount })),
      ...profile.digitalProducts.filter((p) => p.reviewsCount > 0).map((p) => ({ r: p.rating, c: p.reviewsCount })),
    ];
    const totalReviews = ratingItems.reduce((s, x) => s + x.c, 0);
    const avgRating =
      totalReviews > 0 ? ratingItems.reduce((s, x) => s + x.r * x.c, 0) / totalReviews : 0;

    // ── Monthly chart (last 6 months) ──
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("fr-FR", { month: "short" }), amount: 0, sales: 0 };
    });
    for (const txn of completedTxns) {
      const d = new Date(txn.createdAt);
      const entry = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (entry) { entry.amount += txn.amount; entry.sales += 1; }
    }
    const monthlyChart = months.map((m) => ({ month: m.label, amount: Math.round(m.amount), sales: m.sales }));

    // ── Recent sales (with buyer names — separate query) ──
    const [recentEnrollments, recentPurchases] = await Promise.all([
      prisma.enrollment.findMany({
        where: { formation: { instructeurId: profile.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          paidAmount: true,
          createdAt: true,
          refundedAt: true,
          user: { select: { name: true } },
          formation: { select: { title: true } },
        },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { product: { instructeurId: profile.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          paidAmount: true,
          createdAt: true,
          user: { select: { name: true } },
          product: { select: { title: true } },
        },
      }),
    ]);

    const recentSales = [
      ...recentEnrollments
        .filter((e) => e.refundedAt === null)
        .map((e) => ({
          id: e.id,
          buyerName: e.user?.name ?? "Apprenant",
          productTitle: e.formation?.title ?? "Formation",
          productType: "Cours vidéo",
          amount: e.paidAmount,
          createdAt: e.createdAt,
        })),
      ...recentPurchases.map((p) => ({
        id: p.id,
        buyerName: p.user?.name ?? "Client",
        productTitle: p.product?.title ?? "Produit",
        productType: "Produit numérique",
        amount: p.paidAmount,
        createdAt: p.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // ── Top products ──
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
          status: f.status,
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
        status: p.status,
        engagement: 0,
      })),
    ]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      data: {
        kpis: {
          totalRevenue: Math.round(totalRevenue),
          netRevenue: Math.round(netRevenue),
          totalStudents,
          totalProducts,
          avgRating: Math.round(avgRating * 100) / 100,
          totalReviews,
        },
        monthlyChart,
        recentSales,
        topProducts,
      },
    });
  } catch (err) {
    console.error("[vendeur/dashboard]", err);
    return NextResponse.json({ data: null });
  }
}
