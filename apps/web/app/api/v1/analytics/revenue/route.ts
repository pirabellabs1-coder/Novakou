import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import {
  apiError,
  apiSuccess,
  parseDateRange,
} from "@/lib/api/v1-helpers";

/**
 * GET /api/v1/analytics/revenue
 *
 * Statistiques de revenus du vendeur sur une période.
 *
 * Query params:
 *   - from     (ISO 8601, défaut = il y a 30 jours)
 *   - to       (ISO 8601, défaut = aujourd'hui)
 *   - groupBy  ("day" | "week" | "month", défaut "day")
 *
 * Calculs : `paidAmount` cumulé, hors enrollments remboursés.
 *
 * Scope requis : read:analytics
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:analytics" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const url = new URL(request.url);
    const range = parseDateRange(url);
    const groupByRaw = url.searchParams.get("groupBy") ?? "day";
    const groupBy =
      groupByRaw === "week" || groupByRaw === "month" ? groupByRaw : "day";

    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = range.from ?? defaultFrom;
    const to = range.to ?? now;

    if (from > to) {
      return apiError(
        "INVALID_PARAMS",
        "from doit être antérieur ou égal à to",
        400,
      );
    }

    const [enrollments, purchases] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          formation: { instructeurId: ctx.instructeurId },
          createdAt: { gte: from, lte: to },
          refundedAt: null,
        },
        select: { paidAmount: true, createdAt: true },
      }),
      prisma.digitalProductPurchase.findMany({
        where: {
          product: { instructeurId: ctx.instructeurId },
          createdAt: { gte: from, lte: to },
        },
        select: { paidAmount: true, createdAt: true },
      }),
    ]);

    const allRows = [
      ...enrollments.map((e) => ({
        amount: e.paidAmount,
        date: e.createdAt,
      })),
      ...purchases.map((p) => ({ amount: p.paidAmount, date: p.createdAt })),
    ];

    // Bucket by groupBy
    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (const row of allRows) {
      const key = bucketKey(row.date, groupBy);
      const existing = buckets.get(key);
      if (existing) {
        existing.revenue += row.amount;
        existing.orders += 1;
      } else {
        buckets.set(key, { revenue: row.amount, orders: 1 });
      }
    }

    const breakdown = [...buckets.entries()]
      .map(([date, v]) => ({
        date,
        revenue: Math.round(v.revenue),
        orders: v.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const total = allRows.reduce((s, r) => s + r.amount, 0);

    return apiSuccess({
      total: Math.round(total),
      currency: "XOF",
      orders: allRows.length,
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
        groupBy,
      },
      breakdown,
    });
  } catch (err) {
    console.error("[v1/analytics/revenue GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}

function bucketKey(d: Date, groupBy: "day" | "week" | "month"): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  if (groupBy === "month") return `${y}-${m}`;
  if (groupBy === "week") {
    // ISO week number (UTC)
    const tmp = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
    const dayNum = (tmp.getUTCDay() + 6) % 7; // Mon=0
    tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
    const week =
      1 +
      Math.round(
        ((tmp.getTime() - firstThursday.getTime()) / 86400000 -
          3 +
          ((firstThursday.getUTCDay() + 6) % 7)) /
          7,
      );
    return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
