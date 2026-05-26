// Refonte par Augustin Mékongo + Fatou Diallo — bureau 2026-05-26 (votes 7, 8, 13)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";

const PLATFORM_FEE = PLATFORM_COMMISSION_RATE; // 10% platform commission (single source of truth)

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    // Resolve the real user (by session.id OR session.email fallback) + ensure profile
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: null });
    const userId = ctx.userId;

    // Multi-shop : restreindre les stats à la boutique active
    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    const shopFilter = activeShopId ? { shopId: activeShopId } : {};

    // Get instructeur profile with formations + products — use resolved userId
    const profile = await prisma.instructeurProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        totalEarned: true,
        status: true,
        formations: {
          where: shopFilter,
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
          where: shopFilter,
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

    if (!profile) {
      const emptyKpis = { revenue: 0, sales: 0, students: 0, aov: 0 };
      return NextResponse.json({
        data: {
          kpis: { totalRevenue: 0, netRevenue: 0, totalStudents: 0, totalProducts: 0, avgRating: 0, totalReviews: 0 },
          monthlyChart: [],
          recentSales: [],
          topProducts: [],
          sparkline7d: [],
          topCountries: [],
          current: emptyKpis,
          previous: emptyKpis,
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
        country: e.user?.country ?? null,
        userId: e.userId ?? null,
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
        country: pu.user?.country ?? null,
        userId: pu.userId ?? null,
      }))
    );

    // Bundle purchases pour ce vendeur (filtrées par boutique active).
    // Note : ProductBundlePurchase n'a pas de relation `user` — userId est
    // un simple champ string. On fetch les pays via une requête User séparée.
    const bundlePurchases = await prisma.productBundlePurchase.findMany({
      where: {
        bundle: {
          instructeurId: profile.id,
          ...(activeShopId ? { shopId: activeShopId } : {}),
        },
      },
      select: {
        paidAmount: true,
        createdAt: true,
        userId: true,
        bundle: { select: { id: true, title: true } },
      },
    });
    const bundleUserIds = Array.from(new Set(bundlePurchases.map((bp) => bp.userId)));
    const bundleUsers = bundleUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: bundleUserIds } },
          select: { id: true, country: true },
        })
      : [];
    const bundleCountryByUserId = new Map(bundleUsers.map((u) => [u.id, u.country ?? null]));
    const allBundles = bundlePurchases.map((bp) => ({
      type: "bundle" as const,
      productId: bp.bundle.id,
      productTitle: bp.bundle.title,
      productType: "Pack" as string,
      amount: bp.paidAmount,
      createdAt: bp.createdAt,
      refunded: false,
      completed: true,
      country: bundleCountryByUserId.get(bp.userId) ?? null,
      userId: bp.userId,
    }));

    // Subscription invoices pour ce vendeur — uniquement les factures payées
    // (chaque ligne représente un encaissement réel de période)
    const subInvoices = await prisma.subscriptionInvoice.findMany({
      where: {
        status: "paid",
        subscription: {
          plan: {
            instructeurId: profile.id,
            ...(activeShopId ? { shopId: activeShopId } : {}),
          },
        },
      },
      select: {
        amount: true,
        createdAt: true,
        subscription: {
          select: {
            userId: true,
            plan: { select: { id: true, name: true } },
            user: { select: { country: true } },
          },
        },
      },
    });
    const allSubs = subInvoices.map((inv) => ({
      type: "subscription" as const,
      productId: inv.subscription.plan?.id ?? "",
      productTitle: inv.subscription.plan?.name ?? "Abonnement",
      productType: "Abonnement" as string,
      amount: inv.amount,
      createdAt: inv.createdAt,
      refunded: false,
      completed: true,
      country: inv.subscription.user?.country ?? null,
      userId: inv.subscription.userId ?? null,
    }));

    const allTxns = [...allEnrollments, ...allPurchases, ...allBundles, ...allSubs];
    const completedTxns = allTxns.filter((t) => !t.refunded);

    // ── KPIs ──
    const totalRevenue = completedTxns.reduce((s, t) => s + t.amount, 0);
    const netRevenue = totalRevenue * (1 - PLATFORM_FEE);
    const totalStudents = profile.formations.reduce((s, f) => s + f.studentsCount, 0);
    const totalProducts = profile.formations.length + profile.digitalProducts.length;

    // ── Period KPIs : current (J-30 → J) vs previous (J-60 → J-30) ──
    // Source de vérité pour les deltas affichés sur les cards vendeur.
    // Bureau 2026-05-26 (vote 7) : ajouter `current` + `previous` côte à côte,
    // rétrocompatibilité garantie (les clés existantes restent au top-level).
    const now30Ago = new Date(Date.now() - 30 * 86400000);
    const now60Ago = new Date(Date.now() - 60 * 86400000);
    const last30 = completedTxns.filter((t) => new Date(t.createdAt) >= now30Ago);
    const prev30 = completedTxns.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= now60Ago && d < now30Ago;
    });

    type PeriodKpis = {
      revenue: number;
      sales: number;
      students: number;
      aov: number;
    };
    const computePeriodKpis = (txns: typeof completedTxns): PeriodKpis => {
      const revenue = txns.reduce((s, t) => s + t.amount, 0);
      const sales = txns.length;
      const uniqUserIds = new Set<string>();
      for (const t of txns) {
        if (t.userId) uniqUserIds.add(t.userId);
      }
      const students = uniqUserIds.size;
      const aov = sales > 0 ? revenue / sales : 0;
      return {
        revenue: Math.round(revenue),
        sales,
        students,
        aov: Math.round(aov),
      };
    };
    const current: PeriodKpis = computePeriodKpis(last30);
    const previous: PeriodKpis = computePeriodKpis(prev30);

    const pctChange = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
    // `deltas` conservé pour rétro-compat (consommé par l'ancien DeltaBadge)
    const deltas = {
      revenue: pctChange(current.revenue, previous.revenue),
      sales: pctChange(current.sales, previous.sales),
      students: pctChange(current.students, previous.students),
    };

    // ── Revenue split (formations / digital / packs / abonnements, last 90d) ──
    const split90 = (() => {
      const cutoff = new Date(Date.now() - 90 * 86400000);
      let formations = 0;
      let digital = 0;
      let bundles = 0;
      let subscriptions = 0;
      for (const t of completedTxns) {
        if (new Date(t.createdAt) < cutoff) continue;
        if (t.type === "formation") formations += t.amount;
        else if (t.type === "product") digital += t.amount;
        else if (t.type === "bundle") bundles += t.amount;
        else if (t.type === "subscription") subscriptions += t.amount;
      }
      return [
        { name: "Formations", value: Math.round(formations) },
        { name: "Produits digitaux", value: Math.round(digital) },
        { name: "Packs", value: Math.round(bundles) },
        { name: "Abonnements", value: Math.round(subscriptions) },
      ];
    })();

    // ── Mini-sparklines (last 14d revenue per KPI card) ──
    const spark14 = (() => {
      const map = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        map.set(day, 0);
      }
      for (const t of completedTxns) {
        const key = new Date(t.createdAt).toISOString().slice(0, 10);
        if (map.has(key)) map.set(key, (map.get(key) || 0) + t.amount);
      }
      return [...map.entries()].map(([date, amount]) => ({ date, amount: Math.round(amount) }));
    })();

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
        where: { formation: { instructeurId: profile.id, ...(activeShopId ? { shopId: activeShopId } : {}) } },
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
        where: { product: { instructeurId: profile.id, ...(activeShopId ? { shopId: activeShopId } : {}) } },
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

    // ── 7-day sparkline ──
    const sparkline7d: { date: string; amount: number }[] = [];
    {
      const map = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        map.set(day, 0);
      }
      for (const t of completedTxns) {
        const key = new Date(t.createdAt).toISOString().slice(0, 10);
        if (map.has(key)) map.set(key, (map.get(key) || 0) + t.amount);
      }
      for (const [date, amount] of map) sparkline7d.push({ date, amount: Math.round(amount) });
    }

    // ── Top countries (by revenue, all time) ──
    const countryMap = new Map<string, { sales: number; revenue: number }>();
    for (const t of completedTxns) {
      const c = t.country || "??";
      const entry = countryMap.get(c) || { sales: 0, revenue: 0 };
      entry.sales += 1;
      entry.revenue += t.amount;
      countryMap.set(c, entry);
    }
    const topCountries = [...countryMap.entries()]
      .map(([country, v]) => ({ country, sales: v.sales, revenue: Math.round(v.revenue) }))
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
        sparkline7d,
        topCountries,
        deltas,
        split90,
        spark14,
        // Vote 7 — KPIs comparables côte à côte (J-30 vs J-60→J-30).
        // Format rétro-compatible : on AJOUTE ces blocs, on n'enlève rien.
        current,
        previous,
      },
    });
  } catch (err) {
    console.error("[vendeur/dashboard]", err);
    return NextResponse.json({ data: null });
  }
}
