// GET /api/marketing/analytics — Comprehensive marketing analytics for instructor
// Params: ?period=7d|30d|3m|6m|1y

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getOrCreateInstructeurProfile } from "@/lib/formations/prisma-helpers";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthlyRevenue {
  month: string;
  formations: number;
  products: number;
}

interface SalesByProduct {
  name: string;
  type: "formation" | "product";
  sales: number;
  revenue: number;
}

interface TrafficSource {
  source: string;
  visits: number;
  conversions: number;
  revenue: number;
}

interface TopPage {
  path: string;
  views: number;
  conversions: number;
}

interface GeographicEntry {
  country: string;
  revenue: number;
  sales: number;
}

interface AnalyticsResponse {
  overview: {
    totalRevenue: number;
    revenueChange: number;
    totalSales: number;
    salesChange: number;
    conversionRate: number;
    conversionChange: number;
    averageOrderValue: number;
    avgOrderChange: number;
  };
  revenueByMonth: MonthlyRevenue[];
  salesByProduct: SalesByProduct[];
  trafficSources: TrafficSource[];
  conversionFunnel: {
    pageViews: number;
    addToCart: number;
    checkout: number;
    purchased: number;
  };
  topPages: TopPage[];
  geographicData: GeographicEntry[];
}

// ── Mock data generators ─────────────────────────────────────────────────────

function generateMockAnalytics(period: string): AnalyticsResponse {
  // Scale data based on period
  const multiplier = period === "7d" ? 0.25 : period === "30d" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;

  const baseRevenue = 12500;
  const baseSales = 245;

  const totalRevenue = Math.round(baseRevenue * multiplier);
  const totalSales = Math.round(baseSales * multiplier);
  const avgOrder = totalSales > 0 ? Math.round((totalRevenue / totalSales) * 100) / 100 : 0;

  // Monthly revenue data
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentMonth = now.getMonth();
  const monthCount = period === "7d" ? 1 : period === "30d" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;

  const revenueByMonth: MonthlyRevenue[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const mIdx = (currentMonth - i + 12) % 12;
    const formationsRev = Math.round(1800 + Math.random() * 2400);
    const productsRev = Math.round(600 + Math.random() * 1400);
    revenueByMonth.push({
      month: months[mIdx],
      formations: formationsRev,
      products: productsRev,
    });
  }

  // Sales by product
  const salesByProduct: SalesByProduct[] = [
    { name: "React & Next.js : Le guide complet 2026", type: "formation", sales: Math.round(67 * multiplier), revenue: Math.round(3350 * multiplier) },
    { name: "Python pour la Data Science", type: "formation", sales: Math.round(52 * multiplier), revenue: Math.round(2600 * multiplier) },
    { name: "Pack Templates Figma UI/UX Pro", type: "product", sales: Math.round(45 * multiplier), revenue: Math.round(1350 * multiplier) },
    { name: "Tailwind CSS Masterclass", type: "formation", sales: Math.round(38 * multiplier), revenue: Math.round(1900 * multiplier) },
    { name: "E-book Marketing Digital", type: "product", sales: Math.round(28 * multiplier), revenue: Math.round(560 * multiplier) },
    { name: "Node.js Backend Avance", type: "formation", sales: Math.round(22 * multiplier), revenue: Math.round(1540 * multiplier) },
    { name: "Kit Icones SVG Premium", type: "product", sales: Math.round(18 * multiplier), revenue: Math.round(270 * multiplier) },
    { name: "DevOps & Docker pour Developpeurs", type: "formation", sales: Math.round(15 * multiplier), revenue: Math.round(750 * multiplier) },
  ];

  // Traffic sources
  const trafficSources: TrafficSource[] = [
    { source: "direct", visits: Math.round(2100 * multiplier), conversions: Math.round(85 * multiplier), revenue: Math.round(4250 * multiplier) },
    { source: "organic", visits: Math.round(1800 * multiplier), conversions: Math.round(62 * multiplier), revenue: Math.round(3100 * multiplier) },
    { source: "social", visits: Math.round(950 * multiplier), conversions: Math.round(38 * multiplier), revenue: Math.round(1520 * multiplier) },
    { source: "email", visits: Math.round(680 * multiplier), conversions: Math.round(42 * multiplier), revenue: Math.round(2100 * multiplier) },
    { source: "paid", visits: Math.round(420 * multiplier), conversions: Math.round(15 * multiplier), revenue: Math.round(750 * multiplier) },
    { source: "affiliate", visits: Math.round(250 * multiplier), conversions: Math.round(8 * multiplier), revenue: Math.round(400 * multiplier) },
  ];

  // Conversion funnel
  const pageViews = Math.round(6200 * multiplier);
  const addToCart = Math.round(pageViews * 0.16);
  const checkout = Math.round(addToCart * 0.5);
  const purchased = Math.round(checkout * 0.61);

  // Top pages
  const topPages: TopPage[] = [
    { path: "/react-nextjs-guide-complet", views: Math.round(1240 * multiplier), conversions: Math.round(67 * multiplier) },
    { path: "/python-data-science", views: Math.round(980 * multiplier), conversions: Math.round(52 * multiplier) },
    { path: "/produits/pack-templates-figma", views: Math.round(720 * multiplier), conversions: Math.round(45 * multiplier) },
    { path: "/tailwind-css-masterclass", views: Math.round(650 * multiplier), conversions: Math.round(38 * multiplier) },
    { path: "/produits/ebook-marketing-digital", views: Math.round(480 * multiplier), conversions: Math.round(28 * multiplier) },
    { path: "/nodejs-backend-avance", views: Math.round(390 * multiplier), conversions: Math.round(22 * multiplier) },
  ];

  // Geographic data
  const geographicData: GeographicEntry[] = [
    { country: "SN", revenue: Math.round(3200 * multiplier), sales: Math.round(64 * multiplier) },
    { country: "CI", revenue: Math.round(2800 * multiplier), sales: Math.round(56 * multiplier) },
    { country: "FR", revenue: Math.round(2400 * multiplier), sales: Math.round(42 * multiplier) },
    { country: "CM", revenue: Math.round(1600 * multiplier), sales: Math.round(32 * multiplier) },
    { country: "MA", revenue: Math.round(1200 * multiplier), sales: Math.round(24 * multiplier) },
    { country: "BF", revenue: Math.round(800 * multiplier), sales: Math.round(16 * multiplier) },
    { country: "TN", revenue: Math.round(600 * multiplier), sales: Math.round(12 * multiplier) },
    { country: "CD", revenue: Math.round(400 * multiplier), sales: Math.round(8 * multiplier) },
  ];

  return {
    overview: {
      totalRevenue,
      revenueChange: 14.2,
      totalSales,
      salesChange: 8.5,
      conversionRate: 3.2,
      conversionChange: -0.5,
      averageOrderValue: avgOrder,
      avgOrderChange: 5.8,
    },
    revenueByMonth,
    salesByProduct,
    trafficSources,
    conversionFunnel: { pageViews, addToCart, checkout, purchased },
    topPages,
    geographicData,
  };
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    if (!["7d", "30d", "3m", "6m", "1y"].includes(period)) {
      return NextResponse.json({ error: "Periode invalide. Valeurs acceptees: 7d, 30d, 3m, 6m, 1y" }, { status: 400 });
    }

    if (DEV_MODE) {
      const data = generateMockAnalytics(period);
      return NextResponse.json(data);
    }

    // ── Production ──
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await getOrCreateInstructeurProfile(session.user.id);

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case "7d": startDate.setDate(now.getDate() - 7); break;
      case "30d": startDate.setDate(now.getDate() - 30); break;
      case "3m": startDate.setMonth(now.getMonth() - 3); break;
      case "6m": startDate.setMonth(now.getMonth() - 6); break;
      case "1y": startDate.setFullYear(now.getFullYear() - 1); break;
    }

    // Previous period for comparison
    const prevStartDate = new Date(startDate);
    const diff = now.getTime() - startDate.getTime();
    prevStartDate.setTime(startDate.getTime() - diff);

    // Get instructor's formation and product IDs
    const formationIds = (
      await prisma.formation.findMany({
        where: { instructeurId: instructeur.id },
        select: { id: true },
      })
    ).map((f) => f.id);

    const productIds = (
      await (prisma as any).product.findMany({
        where: { instructeurId: instructeur.id },
        select: { id: true },
      })
    ).map((p: any) => p.id);

    // Get enrollments (sales) for current period
    const currentEnrollments = await prisma.enrollment.findMany({
      where: {
        formationId: { in: formationIds },
        createdAt: { gte: startDate, lte: now },
      },
      include: {
        formation: { select: { title: true, price: true } },
      },
    });

    // Get purchases for digital products
    const currentPurchases = await (prisma as any).productPurchase.findMany({
      where: {
        productId: { in: productIds },
        createdAt: { gte: startDate, lte: now },
      },
      include: {
        product: { select: { title: true, price: true } },
      },
    });

    // Previous period counts for comparison
    const prevEnrollmentCount = await prisma.enrollment.count({
      where: {
        formationId: { in: formationIds },
        createdAt: { gte: prevStartDate, lt: startDate },
      },
    });

    const prevPurchaseCount = await (prisma as any).productPurchase.count({
      where: {
        productId: { in: productIds },
        createdAt: { gte: prevStartDate, lt: startDate },
      },
    });

    // Calculate overview metrics
    const formationRevenue = currentEnrollments.reduce((sum: number, e: any) => sum + (e.formation?.price || 0), 0);
    const productRevenue = currentPurchases.reduce((sum: number, p: any) => sum + (p.product?.price || 0), 0);
    const totalRevenue = formationRevenue + productRevenue;
    const totalSales = currentEnrollments.length + currentPurchases.length;
    const prevTotalSales = prevEnrollmentCount + prevPurchaseCount;
    const avgOrder = totalSales > 0 ? Math.round((totalRevenue / totalSales) * 100) / 100 : 0;
    const salesChange = prevTotalSales > 0 ? Math.round(((totalSales - prevTotalSales) / prevTotalSales) * 1000) / 10 : 0;

    // Get funnel events
    const funnelEvents = await prisma.funnelEvent.findMany({
      where: {
        createdAt: { gte: startDate, lte: now },
      },
    });

    const pageViews = funnelEvents.filter((e) => e.eventType === "PAGE_VIEW").length;
    const addToCart = funnelEvents.filter((e) => e.eventType === "ADD_TO_CART").length;
    const checkout = funnelEvents.filter((e) => e.eventType === "CHECKOUT_START").length;
    const purchased = funnelEvents.filter((e) => e.eventType === "PURCHASE").length;
    const conversionRate = pageViews > 0 ? Math.round((purchased / pageViews) * 1000) / 10 : 0;

    // Build sales by product
    const salesMap = new Map<string, SalesByProduct>();
    for (const e of currentEnrollments) {
      const name = e.formation?.title || "Formation";
      const existing = salesMap.get(name);
      if (existing) {
        existing.sales += 1;
        existing.revenue += e.formation?.price || 0;
      } else {
        salesMap.set(name, { name, type: "formation", sales: 1, revenue: e.formation?.price || 0 });
      }
    }
    for (const p of currentPurchases) {
      const name = p.product?.title || "Produit";
      const existing = salesMap.get(name);
      if (existing) {
        existing.sales += 1;
        existing.revenue += p.product?.price || 0;
      } else {
        salesMap.set(name, { name, type: "product", sales: 1, revenue: p.product?.price || 0 });
      }
    }

    const salesByProduct = Array.from(salesMap.values()).sort((a, b) => b.revenue - a.revenue);

    const data: AnalyticsResponse = {
      overview: {
        totalRevenue,
        revenueChange: 14.2, // TODO: calculate from previous period
        totalSales,
        salesChange,
        conversionRate,
        conversionChange: -0.5, // TODO: calculate from previous period
        averageOrderValue: avgOrder,
        avgOrderChange: 5.8, // TODO: calculate from previous period
      },
      revenueByMonth: [], // TODO: group by month from enrollments + purchases
      salesByProduct,
      trafficSources: [], // TODO: from campaign clicks / UTM tracking
      conversionFunnel: { pageViews, addToCart, checkout, purchased },
      topPages: [], // TODO: from page view tracking
      geographicData: [], // TODO: from user country data
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/marketing/analytics]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
