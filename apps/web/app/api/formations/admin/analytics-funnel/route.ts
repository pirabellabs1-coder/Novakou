// Admin Analytics — Funnel acheteur
// Owner : Fatou Diallo (Data) — bureau 2026-05-26
// Lit TrackingEventLog pour reconstruire le funnel views → cart → checkout → purchase.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type Period = "7d" | "30d" | "90d";
const PERIOD_DAYS: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };

const STEPS = [
  { key: "page_view",        label: "Visites",          types: ["page_view"] },
  { key: "intent_view",      label: "Vues produits",    types: ["formation_view", "product_view", "shop_view"] },
  { key: "cta_click",        label: "Clics CTA",        types: ["cta_click"] },
  { key: "add_to_cart",      label: "Ajouts panier",    types: ["add_to_cart"] },
  { key: "checkout_started", label: "Checkout entamé",  types: ["checkout_started"] },
  { key: "purchase",         label: "Achats",           types: ["purchase", "order_completed"] },
] as const;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const url = new URL(req.url);
    const period = (url.searchParams.get("period") as Period) || "30d";
    if (!(period in PERIOD_DAYS)) {
      return NextResponse.json({ error: "Période invalide" }, { status: 400 });
    }

    const now = new Date();
    const since = new Date(now.getTime() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000);
    const previousSince = new Date(since.getTime() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000);

    const allTypes = Array.from(new Set(STEPS.flatMap((s) => s.types)));

    // Agrégation principale : un seul groupBy pour la période courante + la précédente.
    const [currentAgg, previousAgg, byDevice, topPaths, topSearches] = await Promise.all([
      prisma.trackingEventLog.groupBy({
        by: ["type"],
        where: { type: { in: allTypes }, createdAt: { gte: since }, isBot: false },
        _count: { _all: true },
      }),
      prisma.trackingEventLog.groupBy({
        by: ["type"],
        where: { type: { in: allTypes }, createdAt: { gte: previousSince, lt: since }, isBot: false },
        _count: { _all: true },
      }),
      prisma.trackingEventLog.groupBy({
        by: ["deviceType"],
        where: { type: "page_view", createdAt: { gte: since }, isBot: false },
        _count: { _all: true },
      }),
      prisma.trackingEventLog.groupBy({
        by: ["path"],
        where: { type: "page_view", createdAt: { gte: since }, isBot: false },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      prisma.trackingEventLog.findMany({
        where: { type: "search", createdAt: { gte: since }, isBot: false },
        select: { metadata: true },
        take: 200,
      }),
    ]);

    const countByType = new Map<string, number>();
    for (const row of currentAgg) countByType.set(row.type, row._count._all);
    const prevByType = new Map<string, number>();
    for (const row of previousAgg) prevByType.set(row.type, row._count._all);

    const steps = STEPS.map((step) => {
      const current = step.types.reduce((s, t) => s + (countByType.get(t) ?? 0), 0);
      const previous = step.types.reduce((s, t) => s + (prevByType.get(t) ?? 0), 0);
      return { key: step.key, label: step.label, current, previous };
    });

    // Drop-off entre étapes (vs étape précédente du funnel)
    const stepsWithDropoff = steps.map((s, i, arr) => {
      const prev = i > 0 ? arr[i - 1].current : null;
      const conversionFromPrev = prev != null && prev > 0 ? s.current / prev : null;
      const conversionFromTop = arr[0].current > 0 ? s.current / arr[0].current : null;
      const delta = s.previous > 0 ? (s.current - s.previous) / s.previous : null;
      return { ...s, conversionFromPrev, conversionFromTop, delta };
    });

    // Devices
    const totalDevice = byDevice.reduce((s, d) => s + d._count._all, 0);
    const devices = byDevice
      .map((d) => ({ device: d.deviceType, count: d._count._all, share: totalDevice > 0 ? d._count._all / totalDevice : 0 }))
      .sort((a, b) => b.count - a.count);

    // Top searches : compter les "query" distincts depuis metadata
    const searchCounts = new Map<string, number>();
    for (const s of topSearches) {
      const q = ((s.metadata as { query?: string } | null)?.query ?? "").toString().trim().toLowerCase();
      if (!q) continue;
      searchCounts.set(q, (searchCounts.get(q) ?? 0) + 1);
    }
    const searches = [...searchCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return NextResponse.json({
      data: {
        period,
        since: since.toISOString(),
        steps: stepsWithDropoff,
        devices,
        topPaths: topPaths.map((p) => ({ path: p.path, count: p._count._all })),
        topSearches: searches,
      },
    });
  } catch (err) {
    console.error("[admin/analytics-funnel]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
