// GET /api/marketing/overview — Unified marketing dashboard overview
// Aggregates stats from all 8 marketing subsystems into a single response.
// Params: ?period=7d|30d|3m|6m|1y

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

// ── Types ────────────────────────────────────────────────────────────────────

interface SubsystemStats {
  activeAffiliates: number;
  totalAffiliateRevenue: number;
  activeDiscounts: number;
  totalDiscountUses: number;
  activeFlashOffers: number;
  totalFlashRevenue: number;
  activeSequences: number;
  totalEmailsEnrolled: number;
  avgOpenRate: number;
  activeFunnels: number;
  totalFunnelRevenue: number;
  activePopups: number;
  totalPopupImpressions: number;
  totalPopupConversions: number;
  activeCampaigns: number;
  totalCampaignClicks: number;
  totalCampaignRevenue: number;
}

interface RevenueBySource {
  date: string;
  direct: number;
  affiliate: number;
  discount: number;
  funnel: number;
}

type ActivityType =
  | "affiliate_sale"
  | "discount_used"
  | "flash_purchase"
  | "email_sent"
  | "popup_conversion"
  | "funnel_purchase"
  | "campaign_click"
  | "sequence_enrollment";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  amount?: number;
  timestamp: string;
}

interface OverviewKPIs {
  totalRevenue: number;
  revenueChange: number;
  totalSales: number;
  salesChange: number;
  activeAffiliates: number;
  affiliatesChange: number;
  conversionRate: number;
  conversionChange: number;
  emailsSent: number;
  emailsSentChange: number;
  popupImpressions: number;
  popupImpressionsChange: number;
}

interface OverviewResponse {
  kpis: OverviewKPIs;
  subsystems: SubsystemStats;
  recentActivity: ActivityItem[];
  revenueByDay: RevenueBySource[];
}

// ── Mock data generators ─────────────────────────────────────────────────────

function generateMockActivity(): ActivityItem[] {
  const now = Date.now();
  const min = 60 * 1000;
  const hr = 60 * min;

  return [
    {
      id: "act_001",
      type: "affiliate_sale",
      description: "Aminata Diallo a genere une vente via son lien d'affiliation — React & Next.js",
      amount: 59.99,
      timestamp: new Date(now - 12 * min).toISOString(),
    },
    {
      id: "act_002",
      type: "discount_used",
      description: "Code BIENVENUE20 utilise sur la formation Python pour la Data Science",
      amount: 10,
      timestamp: new Date(now - 28 * min).toISOString(),
    },
    {
      id: "act_003",
      type: "popup_conversion",
      description: "Popup \"Remise de bienvenue\" — un utilisateur a clique sur le CTA",
      timestamp: new Date(now - 45 * min).toISOString(),
    },
    {
      id: "act_004",
      type: "funnel_purchase",
      description: "Vente via le funnel \"Lancement Formation React\" — upsell accepte",
      amount: 77.98,
      timestamp: new Date(now - 1.2 * hr).toISOString(),
    },
    {
      id: "act_005",
      type: "email_sent",
      description: "Sequence \"Suivi post-achat\" — email de rappel envoye a 12 apprenants",
      timestamp: new Date(now - 1.8 * hr).toISOString(),
    },
    {
      id: "act_006",
      type: "flash_purchase",
      description: "Offre flash -40% — React & Next.js vendu a 35.99EUR",
      amount: 35.99,
      timestamp: new Date(now - 2.5 * hr).toISOString(),
    },
    {
      id: "act_007",
      type: "campaign_click",
      description: "Campagne \"Facebook Ads - React Promo Mars\" — 23 nouveaux clics",
      timestamp: new Date(now - 3.1 * hr).toISOString(),
    },
    {
      id: "act_008",
      type: "sequence_enrollment",
      description: "5 nouveaux inscrits dans la sequence \"Sequence d'accueil\"",
      timestamp: new Date(now - 4 * hr).toISOString(),
    },
    {
      id: "act_009",
      type: "affiliate_sale",
      description: "Kofi Mensah a genere une vente — Pack Templates Figma",
      amount: 24.99,
      timestamp: new Date(now - 5.5 * hr).toISOString(),
    },
    {
      id: "act_010",
      type: "discount_used",
      description: "Code VIP30 utilise pour la premiere fois aujourd'hui",
      amount: 21,
      timestamp: new Date(now - 7 * hr).toISOString(),
    },
  ];
}

function generateRevenueByDay(days: number): RevenueBySource[] {
  const result: RevenueBySource[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    result.push({
      date: date.toISOString().split("T")[0],
      direct: Math.round(120 + Math.random() * 380),
      affiliate: Math.round(30 + Math.random() * 120),
      discount: Math.round(40 + Math.random() * 160),
      funnel: Math.round(60 + Math.random() * 240),
    });
  }

  return result;
}

function generateMockOverview(period: string): OverviewResponse {
  const multiplier =
    period === "7d" ? 0.25 : period === "30d" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;

  const days =
    period === "7d" ? 7 : period === "30d" ? 30 : period === "3m" ? 90 : period === "6m" ? 180 : 365;

  // Combined revenue from all subsystems
  const affiliateRevenue = Math.round(2380 * multiplier);
  const flashRevenue = Math.round(6210 * multiplier);
  const funnelRevenue = Math.round(13437 * multiplier);
  const directRevenue = Math.round(12500 * multiplier);
  const discountRevenue = Math.round(11490 * multiplier);
  const campaignRevenue = Math.round(6460 * multiplier);

  const totalRevenue = directRevenue + affiliateRevenue + flashRevenue + funnelRevenue;
  const totalSales = Math.round(245 * multiplier);

  const kpis: OverviewKPIs = {
    totalRevenue,
    revenueChange: 14.2,
    totalSales,
    salesChange: 8.5,
    activeAffiliates: 5,
    affiliatesChange: 2,
    conversionRate: 3.2,
    conversionChange: -0.5,
    emailsSent: Math.round(470 * multiplier),
    emailsSentChange: 12.8,
    popupImpressions: Math.round(11122 * multiplier),
    popupImpressionsChange: 18.3,
  };

  const subsystems: SubsystemStats = {
    // Affiliates
    activeAffiliates: 5,
    totalAffiliateRevenue: affiliateRevenue,
    // Discounts
    activeDiscounts: 3,
    totalDiscountUses: Math.round(133 * multiplier),
    // Flash Offers
    activeFlashOffers: 2,
    totalFlashRevenue: flashRevenue,
    // Email Sequences
    activeSequences: 3,
    totalEmailsEnrolled: Math.round(470 * multiplier),
    avgOpenRate: 65.1,
    // Funnels
    activeFunnels: 2,
    totalFunnelRevenue: funnelRevenue,
    // Popups
    activePopups: 3,
    totalPopupImpressions: Math.round(11122 * multiplier),
    totalPopupConversions: Math.round(1113 * multiplier),
    // Campaigns
    activeCampaigns: 3,
    totalCampaignClicks: Math.round(2355 * multiplier),
    totalCampaignRevenue: campaignRevenue,
  };

  return {
    kpis,
    subsystems,
    recentActivity: generateMockActivity(),
    revenueByDay: generateRevenueByDay(Math.min(days, 30)),
  };
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    if (!["7d", "30d", "3m", "6m", "1y"].includes(period)) {
      return NextResponse.json(
        { error: "Periode invalide. Valeurs acceptees: 7d, 30d, 3m, 6m, 1y" },
        { status: 400 },
      );
    }

    if (DEV_MODE) {
      const data = generateMockOverview(period);
      return NextResponse.json(data);
    }

    // ── Production: aggregate from real data ──

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

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

    // Parallel queries for each subsystem
    const [
      affiliatePrograms,
      discounts,
      flashOffers,
      sequences,
      funnels,
      popups,
      campaigns,
      enrollments,
      purchases,
    ] = await Promise.all([
      // Affiliates
      prisma.affiliateProgram.findMany({
        where: { instructeurId: instructeur.id },
        include: { affiliates: { where: { status: "ACTIVE" } } },
      }),
      // Discounts
      prisma.discountCode.findMany({
        where: { instructeurId: instructeur.id },
      }),
      // Flash Offers
      (async () => {
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

        return prisma.flashPromotion.findMany({
          where: {
            OR: [
              { formationId: { in: formationIds } },
              { digitalProductId: { in: productIds } },
            ],
          },
        });
      })(),
      // Sequences
      prisma.emailSequence.findMany({
        where: { instructeurId: instructeur.id },
      }),
      // Funnels
      db.salesFunnel.findMany({
        where: { instructeurId: instructeur.id },
      }),
      // Popups
      prisma.marketingPopup.findMany({
        where: { instructeurId: instructeur.id },
      }),
      // Campaigns
      prisma.campaignTracker.findMany({
        where: { instructeurId: instructeur.id },
      }),
      // Enrollments for revenue
      prisma.enrollment.findMany({
        where: {
          formation: { instructeurId: instructeur.id },
          createdAt: { gte: startDate, lte: now },
        },
        include: { formation: { select: { price: true } } },
      }),
      // Product purchases for revenue
      prisma.digitalProductPurchase.findMany({
        where: {
          digitalProduct: { instructeurId: instructeur.id },
          createdAt: { gte: startDate, lte: now },
        },
        include: { digitalProduct: { select: { price: true } } },
      }),
    ]);

    // Calculate combined KPIs
    const formationRevenue = enrollments.reduce(
      (sum, e) => sum + (e.formation?.price || 0),
      0,
    );
    const productRevenue = purchases.reduce(
      (sum, p) => sum + (p.digitalProduct?.price || 0),
      0,
    );
    const totalRevenue = formationRevenue + productRevenue;
    const totalSales = enrollments.length + purchases.length;

    // Affiliate stats
    const activeAffiliateCount = affiliatePrograms.reduce(
      (sum, p) => sum + p.affiliates.length,
      0,
    );
    const totalAffiliateRevenue = affiliatePrograms.reduce(
      (sum, p) => sum + p.totalPaidOut,
      0,
    );

    // Discount stats
    const activeDiscountCount = discounts.filter(
      (d) =>
        d.isActive &&
        !(d.maxUses !== null && d.usedCount >= d.maxUses) &&
        !(d.expiresAt && new Date(d.expiresAt) < now),
    ).length;

    // Flash offer stats
    const activeFlashCount = flashOffers.filter(
      (o) => o.isActive && o.startsAt <= now && o.endsAt > now,
    ).length;

    // Sequence stats
    const activeSequenceCount = sequences.filter((s) => s.isActive).length;
    const totalEnrolled = sequences.reduce((s, seq) => s + seq.totalEnrolled, 0);

    // Funnel stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeFunnelCount = funnels.filter((f: any) => f.isActive).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalFunnelRevenue = funnels.reduce((s: number, f: any) => s + (f.totalRevenue || 0), 0);

    // Popup stats
    const activePopupCount = popups.filter((p) => p.isActive).length;
    const totalImpressions = popups.reduce((s, p) => s + p.impressions, 0);
    const totalPopupConversions = popups.reduce((s, p) => s + p.conversions, 0);

    // Campaign stats
    const activeCampaignCount = campaigns.filter((c) => c.isActive).length;

    // Get funnel events for conversion rate
    const funnelEvents = await prisma.funnelEvent.findMany({
      where: { createdAt: { gte: startDate, lte: now } },
    });
    const pageViews = funnelEvents.filter((e) => e.eventType === "PAGE_VIEW").length;
    const purchased = funnelEvents.filter((e) => e.eventType === "PURCHASE").length;
    const conversionRate = pageViews > 0
      ? Math.round((purchased / pageViews) * 1000) / 10
      : 0;

    const kpis: OverviewKPIs = {
      totalRevenue,
      revenueChange: 0, // TODO: calculate from previous period
      totalSales,
      salesChange: 0,
      activeAffiliates: activeAffiliateCount,
      affiliatesChange: 0,
      conversionRate,
      conversionChange: 0,
      emailsSent: totalEnrolled,
      emailsSentChange: 0,
      popupImpressions: totalImpressions,
      popupImpressionsChange: 0,
    };

    const subsystems: SubsystemStats = {
      activeAffiliates: activeAffiliateCount,
      totalAffiliateRevenue,
      activeDiscounts: activeDiscountCount,
      totalDiscountUses: discounts.reduce((s, d) => s + d.usedCount, 0),
      activeFlashOffers: activeFlashCount,
      totalFlashRevenue: 0,
      activeSequences: activeSequenceCount,
      totalEmailsEnrolled: totalEnrolled,
      avgOpenRate: 0,
      activeFunnels: activeFunnelCount,
      totalFunnelRevenue,
      activePopups: activePopupCount,
      totalPopupImpressions: totalImpressions,
      totalPopupConversions,
      activeCampaigns: activeCampaignCount,
      totalCampaignClicks: 0,
      totalCampaignRevenue: 0,
    };

    const data: OverviewResponse = {
      kpis,
      subsystems,
      recentActivity: [], // TODO: build from recent events across subsystems
      revenueByDay: [], // TODO: group enrollments/purchases by day
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/marketing/overview]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
