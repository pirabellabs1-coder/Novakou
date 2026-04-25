import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { trackingStore } from "@/lib/tracking/tracking-store";

const PLATFORM_FEE = 0.20;

type Period = "7d" | "30d" | "90d" | "3m" | "6m" | "12m" | "all";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: null });
    const userId = ctx.userId;

    const { searchParams } = new URL(request.url);
    const period: Period = (searchParams.get("period") as Period) ?? "30d";

    // ── Compute cutoff date for the period ──
    const now = new Date();
    let cutoff: Date | null = null;
    let days = 30;
    let monthsBack = 6;
    switch (period) {
      case "7d":  days = 7;  cutoff = new Date(Date.now() - 7  * 86400000); break;
      case "30d": days = 30; cutoff = new Date(Date.now() - 30 * 86400000); break;
      case "90d": days = 90; cutoff = new Date(Date.now() - 90 * 86400000); break;
      case "3m":  monthsBack = 3;  cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1); break;
      case "6m":  monthsBack = 6;  cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1); break;
      case "12m": monthsBack = 12; cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1); break;
      case "all": cutoff = null; break;
    }

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
              select: {
                paidAmount: true,
                createdAt: true,
                refundedAt: true,
                completedAt: true,
                userId: true,
                user: { select: { country: true } },
              },
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
              select: {
                paidAmount: true,
                createdAt: true,
                userId: true,
                user: { select: { country: true } },
              },
            },
          },
        },
      },
    });

    const empty = {
      overview: { revenue: 0, netRevenue: 0, orders: 0, uniqueCustomers: 0, avgOrder: 0, deltaRevenue: 0, deltaOrders: 0 },
      revenueOverTime: [] as { date: string; amount: number; orders: number }[],
      salesByCountry: [] as { country: string; count: number; revenue: number }[],
      viewsByCountry: [] as { country: string; count: number }[],
      topProducts: [] as { id: string; title: string; type: string; sales: number; revenue: number }[],
      ratingDist: [5,4,3,2,1].map((star) => ({ star, count: 0 })),
      conversionFunnel: { views: 0, productViews: 0, purchases: 0, conversionRate: 0 },
      monthlyTrend: [] as { month: string; revenue: number; orders: number }[],
      revenueByType: [] as { type: string; value: number }[],
      // Legacy keys preserved for backward compat with old UI
      monthlyChart: [] as { month: string; amount: number; netAmount: number; sales: number }[],
      summary: { totalRevenue: 0, netRevenue: 0, totalSales: 0, avgPerSale: 0 },
    };

    if (!profile) return NextResponse.json({ data: empty });

    // ── Flatten transactions ──
    type Txn = {
      amount: number;
      createdAt: Date;
      productId: string;
      productTitle: string;
      productType: string;
      kind: "formation" | "product";
      userId: string;
      country: string | null;
      refunded: boolean;
    };

    const allTxns: Txn[] = [
      ...profile.formations.flatMap((f) =>
        f.enrollments.map((e) => ({
          amount: e.paidAmount,
          createdAt: e.createdAt,
          productId: f.id,
          productTitle: f.title,
          productType: "Formation",
          kind: "formation" as const,
          userId: e.userId,
          country: e.user?.country ?? null,
          refunded: e.refundedAt !== null,
        }))
      ),
      ...profile.digitalProducts.flatMap((p) =>
        p.purchases.map((pu) => ({
          amount: pu.paidAmount,
          createdAt: pu.createdAt,
          productId: p.id,
          productTitle: p.title,
          productType: String(p.productType),
          kind: "product" as const,
          userId: pu.userId,
          country: pu.user?.country ?? null,
          refunded: false,
        }))
      ),
    ].filter((t) => !t.refunded);

    const inPeriod = (t: Txn) => (cutoff ? t.createdAt >= cutoff : true);
    const periodTxns = allTxns.filter(inPeriod);

    // ── Overview ──
    const totalRevenue = periodTxns.reduce((s, t) => s + t.amount, 0);
    const netRevenue = totalRevenue * (1 - PLATFORM_FEE);
    const orders = periodTxns.length;
    const uniqueCustomers = new Set(periodTxns.map((t) => t.userId)).size;
    const avgOrder = orders > 0 ? totalRevenue / orders : 0;

    // Delta vs previous equivalent period (same length before cutoff)
    let deltaRevenue = 0;
    let deltaOrders = 0;
    if (cutoff) {
      const windowMs = Date.now() - cutoff.getTime();
      const prevStart = new Date(cutoff.getTime() - windowMs);
      const prev = allTxns.filter((t) => t.createdAt >= prevStart && t.createdAt < cutoff!);
      const prevRev = prev.reduce((s, t) => s + t.amount, 0);
      deltaRevenue = prevRev > 0 ? ((totalRevenue - prevRev) / prevRev) * 100 : 0;
      deltaOrders = prev.length > 0 ? ((orders - prev.length) / prev.length) * 100 : 0;
    }

    // ── Revenue over time (daily for short periods, monthly for longer) ──
    const revenueOverTime: { date: string; amount: number; orders: number }[] = [];
    if (period === "7d" || period === "30d" || period === "90d") {
      const map = new Map<string, { amount: number; orders: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        map.set(key, { amount: 0, orders: 0 });
      }
      for (const t of periodTxns) {
        const key = t.createdAt.toISOString().slice(0, 10);
        const entry = map.get(key);
        if (entry) {
          entry.amount += t.amount;
          entry.orders += 1;
        }
      }
      for (const [date, v] of map) {
        revenueOverTime.push({ date, amount: Math.round(v.amount), orders: v.orders });
      }
    }

    // ── Monthly trend (last 12 months, always computed for the chart) ──
    const months: { year: number; month: number; label: string; key: string; revenue: number; orders: number }[] =
      Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        return {
          year: d.getFullYear(),
          month: d.getMonth(),
          label: d.toLocaleDateString("fr-FR", { month: "short" }),
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          revenue: 0,
          orders: 0,
        };
      });
    for (const t of allTxns) {
      const d = t.createdAt;
      const entry = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
      if (entry) {
        entry.revenue += t.amount;
        entry.orders += 1;
      }
    }
    const monthlyTrend = months.map((m) => ({ month: m.label, revenue: Math.round(m.revenue), orders: m.orders }));

    // Legacy monthlyChart for backward compat
    const legacyMonths = months.slice(-monthsBack);
    const monthlyChart = legacyMonths.map((m) => ({
      month: m.label,
      amount: Math.round(m.revenue),
      netAmount: Math.round(m.revenue * (1 - PLATFORM_FEE)),
      sales: m.orders,
    }));

    // ── Sales by country ──
    const salesByCountryMap = new Map<string, { count: number; revenue: number }>();
    for (const t of periodTxns) {
      const c = t.country || "??";
      const entry = salesByCountryMap.get(c) || { count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += t.amount;
      salesByCountryMap.set(c, entry);
    }
    const salesByCountry = [...salesByCountryMap.entries()]
      .map(([country, v]) => ({ country, count: v.count, revenue: Math.round(v.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    // ── Views by country (from tracking store) ──
    const productIds = [...profile.formations.map((f) => f.id), ...profile.digitalProducts.map((p) => p.id)];
    const allEvents = trackingStore.getEvents({
      startDate: cutoff ? cutoff.toISOString() : undefined,
    });
    const sessions = trackingStore.getSessions();
    const sessionCountryMap = new Map(sessions.map((s) => [s.id, s.country] as const));

    // Views = all page_view/service_viewed/formation_viewed events whose entityId matches our products
    // OR path contains the product id (fallback). For general views, include all events on /formations paths.
    const productViewEvents = allEvents.filter(
      (e) =>
        (e.type === "service_viewed" || e.type === "formation_viewed" || e.type === "page_view") &&
        ((e.entityId && productIds.includes(e.entityId)) ||
          productIds.some((id) => e.path?.includes(id)))
    );

    const viewsByCountryMap = new Map<string, number>();
    for (const e of productViewEvents) {
      const c = e.country || sessionCountryMap.get(e.sessionId) || "??";
      viewsByCountryMap.set(c, (viewsByCountryMap.get(c) || 0) + 1);
    }
    const viewsByCountry = [...viewsByCountryMap.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // ── Conversion funnel ──
    const totalViews = allEvents.filter((e) => e.type === "page_view").length;
    const productViews = productViewEvents.length;
    const purchases = periodTxns.length;
    const conversionFunnel = {
      views: totalViews,
      productViews,
      purchases,
      conversionRate: productViews > 0 ? Math.round((purchases / productViews) * 10000) / 100 : 0,
    };

    // ── Top products (by revenue in period) ──
    const productAgg = new Map<string, { title: string; type: string; sales: number; revenue: number }>();
    for (const t of periodTxns) {
      const key = t.productId;
      const entry = productAgg.get(key) || { title: t.productTitle, type: t.productType, sales: 0, revenue: 0 };
      entry.sales += 1;
      entry.revenue += t.amount;
      productAgg.set(key, entry);
    }
    const topProducts = [...productAgg.entries()]
      .map(([id, v]) => ({ id, title: v.title, type: v.type, sales: v.sales, revenue: Math.round(v.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ── Revenue by type (donut) ──
    const typeAgg = new Map<string, number>();
    for (const t of periodTxns) {
      const bucket = t.kind === "formation" ? "Formations" : t.productType || "Produits digitaux";
      typeAgg.set(bucket, (typeAgg.get(bucket) || 0) + t.amount);
    }
    const revenueByType = [...typeAgg.entries()]
      .map(([type, value]) => ({ type, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    // ── Rating distribution ──
    const allRatings = [
      ...profile.formations.map((f) => ({ r: f.rating, c: f.reviewsCount })),
      ...profile.digitalProducts.map((p) => ({ r: p.rating, c: p.reviewsCount })),
    ].filter((x) => x.c > 0);
    const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: allRatings.filter((x) => Math.round(x.r) === star).reduce((s, x) => s + x.c, 0),
    }));

    return NextResponse.json({
      data: {
        overview: {
          revenue: Math.round(totalRevenue),
          netRevenue: Math.round(netRevenue),
          orders,
          uniqueCustomers,
          avgOrder: Math.round(avgOrder),
          deltaRevenue: Math.round(deltaRevenue * 10) / 10,
          deltaOrders: Math.round(deltaOrders * 10) / 10,
        },
        revenueOverTime,
        salesByCountry,
        viewsByCountry,
        topProducts,
        ratingDist,
        conversionFunnel,
        monthlyTrend,
        revenueByType,
        // Legacy keys
        monthlyChart,
        summary: {
          totalRevenue: Math.round(totalRevenue),
          netRevenue: Math.round(netRevenue),
          totalSales: orders,
          avgPerSale: Math.round(avgOrder),
        },
      },
    });
  } catch (err) {
    console.error("[vendeur/stats]", err);
    return NextResponse.json({ data: null });
  }
}
