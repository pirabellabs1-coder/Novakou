import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/charts
 * Admin-only. Returns time series + aggregations for the global admin dashboard.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || role !== "ADMIN") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [enrollments, purchases, bookings, usersByDay, platformRev] = await Promise.all([
      prisma.enrollment.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, refundedAt: null },
        select: { createdAt: true, paidAmount: true },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, paidAmount: true },
      }),
      prisma.mentorBooking.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          escrowStatus: { in: ["HELD", "RELEASED"] },
        },
        select: { createdAt: true, paidAmount: true, status: true, escrowStatus: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, role: true, formationsRole: true },
      }),
      prisma.platformRevenue.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { orderType: true, grossAmount: true, commissionAmount: true, createdAt: true },
      }),
    ]);

    // Build 30-day revenue series
    const byDay = new Map<string, { formations: number; products: number; mentors: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { formations: 0, products: 0, mentors: 0 });
    }
    for (const e of enrollments) {
      const key = e.createdAt.toISOString().slice(0, 10);
      const b = byDay.get(key);
      if (b) b.formations += e.paidAmount;
    }
    for (const p of purchases) {
      const key = p.createdAt.toISOString().slice(0, 10);
      const b = byDay.get(key);
      if (b) b.products += p.paidAmount;
    }
    for (const m of bookings) {
      const key = m.createdAt.toISOString().slice(0, 10);
      const b = byDay.get(key);
      if (b) b.mentors += m.paidAmount;
    }
    const revenueSeries = Array.from(byDay.entries()).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      ...v,
      total: v.formations + v.products + v.mentors,
    }));

    // 7-day new users
    const usersByDayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      usersByDayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const u of usersByDay) {
      const key = u.createdAt.toISOString().slice(0, 10);
      usersByDayMap.set(key, (usersByDayMap.get(key) ?? 0) + 1);
    }
    const newUsersSeries = Array.from(usersByDayMap.entries()).map(([date, n]) => ({
      date: new Date(date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      count: n,
    }));

    // Revenue breakdown (pie)
    const grossFormations = enrollments.reduce((s, e) => s + e.paidAmount, 0);
    const grossProducts = purchases.reduce((s, p) => s + p.paidAmount, 0);
    const grossMentors = bookings.reduce((s, b) => s + b.paidAmount, 0);
    const breakdown = [
      { name: "Formations", value: grossFormations, color: "#006e2f" },
      { name: "Produits digitaux", value: grossProducts, color: "#22c55e" },
      { name: "Sessions mentor", value: grossMentors, color: "#60a5fa" },
    ].filter((x) => x.value > 0);

    // Commission totals
    const totalCommission = platformRev.reduce((s, r) => s + r.commissionAmount, 0);
    const totalGross = platformRev.reduce((s, r) => s + r.grossAmount, 0);

    return NextResponse.json({
      data: {
        revenueSeries,
        newUsersSeries,
        breakdown,
        totals: {
          grossLast30: grossFormations + grossProducts + grossMentors,
          commissionLast30: totalCommission,
          commissionPercent: totalGross > 0 ? (totalCommission / totalGross) * 100 : 0,
          newUsersLast7: usersByDay.length,
          mentorBookingsLast30: bookings.length,
        },
      },
    });
  } catch (err) {
    console.error("[admin/charts GET]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
