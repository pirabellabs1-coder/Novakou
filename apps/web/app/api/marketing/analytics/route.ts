// GET /api/marketing/analytics
//
// Un seul chemin : la base. La route servait auparavant des chiffres INVENTES
// des que DEV_MODE valait "true" (c'est le cas du .env.local de developpement) :
// 2 940 ventes et 150 000 FCFA pour un vendeur qui en avait realise deux.
// Impossible de faire confiance a un ecran d'analytics capable de mentir. — Comprehensive marketing analytics for instructor
// Params: ?period=7d|30d|3m|6m|1y

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getOrCreateInstructeurProfile } from "@/lib/formations/prisma-helpers";

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

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    if (!["7d", "30d", "3m", "6m", "1y"].includes(period)) {
      return NextResponse.json({ error: "Periode invalide. Valeurs acceptees: 7d, 30d, 3m, 6m, 1y" }, { status: 400 });
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
      await prisma.digitalProduct.findMany({
        where: { instructeurId: instructeur.id },
        select: { id: true },
      })
    ).map((p) => p.id);

    // Ventes de la période.
    //
    // `paidAmount` (ce que l'acheteur a RÉELLEMENT payé) et non `formation.price`
    // (le prix affiché aujourd'hui) : sinon un code promo, un bundle, un cadeau
    // ou une simple hausse de prix gonflait le revenu, et cette page contredisait
    // le tableau de bord et les finances, qui somment tous `paidAmount`.
    // Les inscriptions remboursées sont exclues : ce revenu est reparti.
    const currentEnrollments = await prisma.enrollment.findMany({
      where: {
        formationId: { in: formationIds },
        createdAt: { gte: startDate, lte: now },
        refundedAt: null,
      },
      include: {
        formation: { select: { title: true } },
        user: { select: { country: true } },
      },
    });

    // Get purchases for digital products
    const currentPurchases = await prisma.digitalProductPurchase.findMany({
      where: {
        productId: { in: productIds },
        createdAt: { gte: startDate, lte: now },
      },
      include: {
        product: { select: { title: true } },
        user: { select: { country: true } },
      },
    });

    // Période précédente, pour les deltas (même règle : montants payés).
    const prevEnrollments = await prisma.enrollment.findMany({
      where: {
        formationId: { in: formationIds },
        createdAt: { gte: prevStartDate, lt: startDate },
        refundedAt: null,
      },
      select: { paidAmount: true },
    });

    const prevPurchases = await prisma.digitalProductPurchase.findMany({
      where: {
        productId: { in: productIds },
        createdAt: { gte: prevStartDate, lt: startDate },
      },
      select: { paidAmount: true },
    });

    const prevEnrollmentCount = prevEnrollments.length;
    const prevPurchaseCount = prevPurchases.length;
    const prevRevenue =
      prevEnrollments.reduce((s, e) => s + e.paidAmount, 0) +
      prevPurchases.reduce((s, p) => s + p.paidAmount, 0);

    // Calculate overview metrics
    const formationRevenue = currentEnrollments.reduce((sum, e) => sum + e.paidAmount, 0);
    const productRevenue = currentPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const totalRevenue = formationRevenue + productRevenue;
    const totalSales = currentEnrollments.length + currentPurchases.length;
    const prevTotalSales = prevEnrollmentCount + prevPurchaseCount;
    const avgOrder = totalSales > 0 ? Math.round((totalRevenue / totalSales) * 100) / 100 : 0;
    const salesChange = prevTotalSales > 0 ? Math.round(((totalSales - prevTotalSales) / prevTotalSales) * 1000) / 10 : 0;

    // Funnel events — scopés aux tunnels de CE vendeur (sinon on comptait toute
    // la plateforme). Le tracker n'écrit que "view" et "click" (cf.
    // /api/marketing/funnels/[id]/events). On construit donc le tunnel réel :
    // vues → clics CTA → ventes effectives de la période.
    const funnelEvents = await prisma.funnelEvent.findMany({
      where: {
        funnel: { instructeurId: instructeur.id },
        createdAt: { gte: startDate, lte: now },
      },
      select: { eventType: true },
    });
    const prevFunnelViews = await prisma.funnelEvent.count({
      where: {
        funnel: { instructeurId: instructeur.id },
        eventType: "view",
        createdAt: { gte: prevStartDate, lt: startDate },
      },
    });

    const pageViews = funnelEvents.filter((e) => e.eventType === "view").length;
    const ctaClicks = funnelEvents.filter((e) => e.eventType === "click").length;
    const purchased = totalSales;
    const addToCart = ctaClicks;
    const checkout = ctaClicks;
    const conversionRate = pageViews > 0 ? Math.round((purchased / pageViews) * 1000) / 10 : 0;
    const prevConversionRate = prevFunnelViews > 0 ? Math.round((prevTotalSales / prevFunnelViews) * 1000) / 10 : 0;
    const conversionChange = prevConversionRate > 0 ? Math.round((conversionRate - prevConversionRate) * 10) / 10 : 0;

    // Build sales by product
    const salesMap = new Map<string, SalesByProduct>();
    for (const e of currentEnrollments) {
      const name = e.formation?.title || "Formation";
      const existing = salesMap.get(name);
      if (existing) {
        existing.sales += 1;
        existing.revenue += e.paidAmount;
      } else {
        salesMap.set(name, { name, type: "formation", sales: 1, revenue: e.paidAmount });
      }
    }
    for (const p of currentPurchases) {
      const name = p.product?.title || "Produit";
      const existing = salesMap.get(name);
      if (existing) {
        existing.sales += 1;
        existing.revenue += p.paidAmount;
      } else {
        salesMap.set(name, { name, type: "product", sales: 1, revenue: p.paidAmount });
      }
    }

    const salesByProduct = Array.from(salesMap.values()).sort((a, b) => b.revenue - a.revenue);

    // ── Deltas réels vs période précédente ───────────────────────────────────
    const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0;
    const prevAvgOrder = prevTotalSales > 0 ? prevRevenue / prevTotalSales : 0;
    const avgOrderChange = prevAvgOrder > 0 ? Math.round(((avgOrder - prevAvgOrder) / prevAvgOrder) * 1000) / 10 : 0;

    // ── Revenus par mois (formations + produits) ─────────────────────────────
    const monthMap = new Map<string, MonthlyRevenue>();
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    for (const e of currentEnrollments) {
      const k = monthKey(new Date(e.createdAt));
      const m = monthMap.get(k) ?? { month: k, formations: 0, products: 0 };
      m.formations += e.paidAmount;
      monthMap.set(k, m);
    }
    for (const p of currentPurchases) {
      const k = monthKey(new Date(p.createdAt));
      const m = monthMap.get(k) ?? { month: k, formations: 0, products: 0 };
      m.products += p.paidAmount;
      monthMap.set(k, m);
    }
    const revenueByMonth = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // ── Sources de trafic depuis les campagnes UTM du vendeur ────────────────
    const campaigns = await prisma.campaignTracker.findMany({
      where: { instructeurId: instructeur.id },
      select: { utmSource: true, totalClicks: true, totalConversions: true, totalRevenue: true },
    });
    const sourceMap = new Map<string, TrafficSource>();
    for (const c of campaigns) {
      const source = c.utmSource || "Direct";
      const s = sourceMap.get(source) ?? { source, visits: 0, conversions: 0, revenue: 0 };
      s.visits += c.totalClicks;
      s.conversions += c.totalConversions;
      s.revenue += c.totalRevenue;
      sourceMap.set(source, s);
    }
    const trafficSources = Array.from(sourceMap.values()).sort((a, b) => b.visits - a.visits);

    // ── Répartition géographique (pays des acheteurs) ────────────────────────
    const geoMap = new Map<string, GeographicEntry>();
    for (const e of currentEnrollments) {
      const country = e.user?.country || "Inconnu";
      const g = geoMap.get(country) ?? { country, revenue: 0, sales: 0 };
      g.revenue += e.paidAmount;
      g.sales += 1;
      geoMap.set(country, g);
    }
    for (const p of currentPurchases) {
      const country = p.user?.country || "Inconnu";
      const g = geoMap.get(country) ?? { country, revenue: 0, sales: 0 };
      g.revenue += p.paidAmount;
      g.sales += 1;
      geoMap.set(country, g);
    }
    const geographicData = Array.from(geoMap.values()).sort((a, b) => b.revenue - a.revenue);

    // ── Top pages = tunnels du vendeur (vues / conversions stockées) ─────────
    const funnels = await prisma.salesFunnel.findMany({
      where: { instructeurId: instructeur.id },
      select: { slug: true, totalViews: true, totalConversions: true },
      orderBy: { totalViews: "desc" },
      take: 10,
    });
    const topPages: TopPage[] = funnels.map((f) => ({
      path: `/f/${f.slug}`,
      views: f.totalViews,
      conversions: f.totalConversions,
    }));

    const data: AnalyticsResponse = {
      overview: {
        totalRevenue,
        revenueChange,
        totalSales,
        salesChange,
        conversionRate,
        conversionChange,
        averageOrderValue: avgOrder,
        avgOrderChange,
      },
      revenueByMonth,
      salesByProduct,
      trafficSources,
      conversionFunnel: { pageViews, addToCart, checkout, purchased },
      topPages,
      geographicData,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/marketing/analytics]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
