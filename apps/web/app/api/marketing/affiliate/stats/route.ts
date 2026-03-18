// GET /api/marketing/affiliate/stats — Return affiliate dashboard stats for the authenticated user
// Returns: totalClicks, totalConversions, totalEarned, pendingEarnings,
//          conversionRate, recentCommissions, topProducts, earningsByMonth

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

// ── Types ────────────────────────────────────────────────────────────────────

interface AffiliateStats {
  // KPIs
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
  conversionRate: string; // percentage string
  // Profile info
  affiliateCode: string;
  affiliateLink: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  commissionPercent: number;
  cookieDays: number;
  minPayoutAmount: number;
  canRequestPayout: boolean;
  // Recent commissions
  recentCommissions: {
    id: string;
    productName: string;
    productType: string; // "formation" | "product"
    orderAmount: number;
    commissionAmount: number;
    status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
    date: string;
  }[];
  // Top performing products
  topProducts: {
    id: string;
    name: string;
    type: string;
    clicks: number;
    conversions: number;
    earned: number;
    conversionRate: string;
  }[];
  // Earnings by month (last 6 months)
  earningsByMonth: {
    month: string;
    earned: number;
    conversions: number;
  }[];
  // Payout history
  payoutHistory: {
    id: string;
    amount: number;
    method: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    requestedAt: string;
    paidAt: string | null;
  }[];
}

// ── Mock data generator ──────────────────────────────────────────────────────

function generateMockStats(period: string): AffiliateStats {
  const now = new Date();
  const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];

  // Earnings by month (last 6 months)
  const earningsByMonth: AffiliateStats["earningsByMonth"] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    const baseEarned = 80 + (5 - i) * 35 + Math.floor(Math.random() * 50);
    const baseConversions = 3 + (5 - i) * 2 + Math.floor(Math.random() * 4);
    earningsByMonth.push({
      month: monthLabel,
      earned: baseEarned,
      conversions: baseConversions,
    });
  }

  const totalEarned = earningsByMonth.reduce((sum, m) => sum + m.earned, 0);
  const totalConversions = earningsByMonth.reduce((sum, m) => sum + m.conversions, 0);
  const totalClicks = Math.round(totalConversions / 0.037); // ~3.7% conversion rate
  const pendingEarnings = Math.round(totalEarned * 0.18);

  // Recent commissions
  const recentCommissions: AffiliateStats["recentCommissions"] = [
    {
      id: "comm-001",
      productName: "Formation Complete Next.js 14",
      productType: "formation",
      orderAmount: 89,
      commissionAmount: 22.25,
      status: "PAID",
      date: "2026-03-15T14:30:00Z",
    },
    {
      id: "comm-002",
      productName: "Pack UI Kit Figma — 200 composants",
      productType: "product",
      orderAmount: 24,
      commissionAmount: 6,
      status: "APPROVED",
      date: "2026-03-14T10:15:00Z",
    },
    {
      id: "comm-003",
      productName: "Formation React + TypeScript",
      productType: "formation",
      orderAmount: 69,
      commissionAmount: 17.25,
      status: "PENDING",
      date: "2026-03-13T16:45:00Z",
    },
    {
      id: "comm-004",
      productName: "Ebook : Reussir en freelance en Afrique",
      productType: "product",
      orderAmount: 15,
      commissionAmount: 3.75,
      status: "PAID",
      date: "2026-03-12T09:00:00Z",
    },
    {
      id: "comm-005",
      productName: "Templates Next.js SaaS Starter Kit",
      productType: "product",
      orderAmount: 70,
      commissionAmount: 17.5,
      status: "PAID",
      date: "2026-03-10T11:20:00Z",
    },
    {
      id: "comm-006",
      productName: "Formation Complete Next.js 14",
      productType: "formation",
      orderAmount: 89,
      commissionAmount: 22.25,
      status: "PENDING",
      date: "2026-03-08T08:45:00Z",
    },
    {
      id: "comm-007",
      productName: "Formation Python pour Data Science",
      productType: "formation",
      orderAmount: 59,
      commissionAmount: 14.75,
      status: "PAID",
      date: "2026-03-05T15:30:00Z",
    },
    {
      id: "comm-008",
      productName: "Pack icones SVG — 500 icones",
      productType: "product",
      orderAmount: 15,
      commissionAmount: 3.75,
      status: "REJECTED",
      date: "2026-03-03T12:10:00Z",
    },
  ];

  // Top products
  const topProducts: AffiliateStats["topProducts"] = [
    {
      id: "prod-top-001",
      name: "Formation Complete Next.js 14",
      type: "formation",
      clicks: 487,
      conversions: 23,
      earned: 512.75,
      conversionRate: "4.7",
    },
    {
      id: "prod-top-002",
      name: "Templates Next.js SaaS Starter Kit",
      type: "product",
      clicks: 324,
      conversions: 15,
      earned: 262.5,
      conversionRate: "4.6",
    },
    {
      id: "prod-top-003",
      name: "Formation React + TypeScript",
      type: "formation",
      clicks: 256,
      conversions: 11,
      earned: 189.75,
      conversionRate: "4.3",
    },
    {
      id: "prod-top-004",
      name: "Pack UI Kit Figma — 200 composants",
      type: "product",
      clicks: 198,
      conversions: 8,
      earned: 48,
      conversionRate: "4.0",
    },
    {
      id: "prod-top-005",
      name: "Ebook : Reussir en freelance",
      type: "product",
      clicks: 145,
      conversions: 5,
      earned: 18.75,
      conversionRate: "3.4",
    },
  ];

  // Payout history
  const payoutHistory: AffiliateStats["payoutHistory"] = [
    {
      id: "pay-001",
      amount: 150,
      method: "Mobile Money (Orange)",
      status: "COMPLETED",
      requestedAt: "2026-02-28T10:00:00Z",
      paidAt: "2026-03-02T14:00:00Z",
    },
    {
      id: "pay-002",
      amount: 200,
      method: "Virement SEPA",
      status: "COMPLETED",
      requestedAt: "2026-01-31T09:00:00Z",
      paidAt: "2026-02-03T16:00:00Z",
    },
    {
      id: "pay-003",
      amount: 75,
      method: "PayPal",
      status: "COMPLETED",
      requestedAt: "2025-12-28T11:00:00Z",
      paidAt: "2025-12-30T10:00:00Z",
    },
  ];

  const conversionRate = totalClicks > 0
    ? ((totalConversions / totalClicks) * 100).toFixed(1)
    : "0";

  return {
    totalClicks,
    totalConversions,
    totalEarned,
    pendingEarnings,
    conversionRate,
    affiliateCode: "DEMO25",
    affiliateLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://freelancehigh.com"}/formations?ref=DEMO25`,
    status: "ACTIVE",
    commissionPercent: 25,
    cookieDays: 30,
    minPayoutAmount: 20,
    canRequestPayout: pendingEarnings >= 20,
    recentCommissions,
    topProducts,
    earningsByMonth,
    payoutHistory,
  };
}

// ── GET — Affiliate stats ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    if (DEV_MODE) {
      const stats = generateMockStats(period);
      return NextResponse.json(stats);
    }

    // Production: aggregate from Prisma
    // const profile = await prisma.affiliateProfile.findUnique({ where: { userId: session.user.id }, include: { program: true } });
    // if (!profile) return NextResponse.json({ error: "Profil affilie non trouve" }, { status: 404 });
    //
    // const clicks = await prisma.affiliateClick.count({ where: { affiliateId: profile.id, createdAt: { gte: startDate } } });
    // const commissions = await prisma.affiliateCommission.findMany({ where: { affiliateId: profile.id }, orderBy: { createdAt: 'desc' }, take: 20 });
    // ... aggregate top products, earnings by month, etc.

    return NextResponse.json({
      totalClicks: 0,
      totalConversions: 0,
      totalEarned: 0,
      pendingEarnings: 0,
      conversionRate: "0",
      affiliateCode: "",
      affiliateLink: "",
      status: "PENDING",
      commissionPercent: 0,
      cookieDays: 0,
      minPayoutAmount: 20,
      canRequestPayout: false,
      recentCommissions: [],
      topProducts: [],
      earningsByMonth: [],
      payoutHistory: [],
    });
  } catch (error) {
    console.error("[GET /api/marketing/affiliate/stats]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
