// GET /api/instructeur/produits/stats — Stats du dashboard produits numériques

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";

// ── Route Handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Verify instructor profile exists and is approved
    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur || instructeur.status !== "APPROUVE") {
      return NextResponse.json({ error: "Compte instructeur non approuvé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "30d";

    // Query DigitalProduct + DigitalProductPurchase tables
    // Returns empty structure until purchase tracking is fully wired
    return NextResponse.json({
      totalRevenue: 0,
      revenueThisWeek: 0,
      totalClients: 0,
      totalSales: 0,
      revenueTrend: 0,
      salesTrend: 0,
      revenueByMonth: [],
      topProducts: [],
      recentPurchases: [],
      clients: [],
    });
  } catch (error) {
    console.error("[GET /api/instructeur/produits/stats]", error);
    return NextResponse.json({
      totalRevenue: 0,
      revenueThisWeek: 0,
      totalClients: 0,
      totalSales: 0,
      revenueTrend: 0,
      salesTrend: 0,
      revenueByMonth: [],
      topProducts: [],
      recentPurchases: [],
      clients: [],
    });
  }
}
