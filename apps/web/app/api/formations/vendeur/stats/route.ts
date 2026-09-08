import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { trackingStore } from "@/lib/tracking/tracking-store";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";
import { toIso2 } from "@/lib/tracking/geo";
import { visiteursParPays, visiteursUniques, tauxRebond } from "@/lib/formations/stats-pays";

// Single source of truth (10% — see lib/formations/constants.ts)
const PLATFORM_FEE = PLATFORM_COMMISSION_RATE;

type Period = "today" | "yesterday" | "7d" | "30d" | "90d" | "3m" | "6m" | "12m" | "all";

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

    // Filtre BOUTIQUE. Absent / "all" → cumulé (toutes les boutiques du vendeur).
    // Un id → seules les fiches de cette boutique. Comme les fiches chargées sont
    // déjà celles du vendeur, un id étranger ne fuit rien : il renvoie juste un
    // ensemble vide. Pas besoin d'une validation séparée.
    const shopIdParam = (searchParams.get("shopId") ?? "").trim();
    const shopFilter = shopIdParam && shopIdParam !== "all" ? { shopId: shopIdParam } : {};

    // ── Compute cutoff date for the period ──
    const now = new Date();
    // Le serveur tourne en UTC, le vendeur non : Cotonou est a UTC+1, Kampala
    // a UTC+3. Sans le decalage du navigateur, « aujourd'hui » commencerait a
    // minuit UTC et un vendeur consultant ses ventes en soiree verrait un jour
    // faux. On borne le decalage : une valeur aberrante venue du client ne doit
    // pas pouvoir deplacer la fenetre de plusieurs jours.
    const tzBrut = Number(searchParams.get("tz"));
    const tzMin = Number.isFinite(tzBrut) ? Math.max(-840, Math.min(840, tzBrut)) : 0;
    /** Minuit LOCAL du vendeur, exprime en instant absolu. */
    const minuitLocal = (decalageJours = 0) => {
      const local = new Date(Date.now() - tzMin * 60_000);
      local.setUTCHours(0, 0, 0, 0);
      local.setUTCDate(local.getUTCDate() + decalageJours);
      return new Date(local.getTime() + tzMin * 60_000);
    };

    // Borne de FIN. « Hier » sans elle incluait aujourd'hui : le filtre aurait
    // affiche deux jours en pretendant n'en montrer qu'un.
    let until: Date | null = null;
    let cutoff: Date | null = null;
    let days = 30;
    let monthsBack = 6;
    switch (period) {
      case "today":     days = 1; cutoff = minuitLocal(0); break;
      case "yesterday": days = 1; cutoff = minuitLocal(-1); until = minuitLocal(0); break;
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
        // Les boutiques servent a rattacher au vendeur les visiteurs de sa
        // VITRINE — ceux qui n'ouvrent aucune fiche produit et echappaient
        // donc entierement au comptage par pays.
        shops: {
          where: shopIdParam && shopIdParam !== "all" ? { id: shopIdParam } : {},
          select: { id: true },
        },
        formations: {
          where: shopFilter,
          select: {
            id: true,
            slug: true,
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
          where: shopFilter,
          select: {
            id: true,
            slug: true,
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
      visitorsByCountry: [] as { country: string; visitors: number; views: number }[],
      bounceRate: null as number | null,
      bounceSessions: 0,
      bounceCount: 0,
      topProducts: [] as { id: string; title: string; type: string; sales: number; revenue: number }[],
      ratingDist: [5,4,3,2,1].map((star) => ({ star, count: 0 })),
      conversionFunnel: { views: 0, productViews: 0, checkouts: 0, purchases: 0, conversionRate: 0 },
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

    const inPeriod = (t: Txn) =>
      (cutoff ? t.createdAt >= cutoff : true) && (until ? t.createdAt < until : true);
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
      // Normalise en code ISO-2 : fusionne « CI » et « Côte d'Ivoire », etc.
      const c = toIso2(t.country) ?? "??";
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
    // Entites du vendeur : ses boutiques ET son catalogue. Un evenement qui
    // porte l'une d'elles lui appartient.
    const vendorEntityIds = [...profile.shops.map((b) => b.id), ...productIds];

    // …mais la moitié des événements ne portent AUCUN entityId : la page
    // publique enregistre « /produit/mon-ebook » et rien d'autre. Mesuré sur un
    // vrai catalogue : 464 événements avec entityId, 457 identifiés par le seul
    // chemin. Filtrer sur le seul entityId perdait donc la moitié du trafic.
    const scopePaths = [
      ...profile.formations.map((f) => `/formation/${f.slug}`),
      ...profile.digitalProducts.map((p) => `/produit/${p.slug}`),
    ].filter((c) => !c.endsWith("/"));

    // ÉTAGE « PAIEMENT LANCÉ » DE L'ENTONNOIR.
    //
    // Il affichait « — » parce qu'on le cherchait dans le traceur : les
    // événements `checkout_started` ne portent NI entityId NI produit — juste
    // le chemin « /checkout » et un montant. Impossible de les rattacher à un
    // vendeur.
    //
    // La vérité est en base : une tentative de paiement EST une ligne avec son
    // `productId`. C'est aussi un meilleur signal — un bloqueur de publicité
    // empêche un événement de traceur, pas une écriture serveur.
    const checkoutsPromise = prisma.checkoutAttempt.count({
      where: {
        ...(cutoff ? { createdAt: { gte: cutoff } } : {}),
        OR: [
          { productId: { in: profile.digitalProducts.map((x) => x.id) } },
          { formationId: { in: profile.formations.map((x) => x.id) } },
        ],
      },
    });

    const [scopedEvents, sessions] = await Promise.all([
      // Filtre poussé en BASE, jamais en mémoire : `getEvents` plafonne à
      // 5 000 événements récents TOUTE PLATEFORME confondue. Filtrer après
      // coup faisait disparaître le trafic des petits vendeurs sous celui des
      // gros — et tronquait la période demandée aux ~4 derniers jours.
      trackingStore.getEvents({
        startDate: cutoff ? cutoff.toISOString() : undefined,
        productScope: { ids: vendorEntityIds, paths: scopePaths },
      }),
      trackingStore.getSessions(),
    ]);
    const checkouts = await checkoutsPromise;
    const sessionCountryMap = new Map(sessions.map((s) => [s.id, s.country] as const));

    // `scopedEvents` est DÉJÀ restreint aux pages de ce vendeur par la requête.
    // Ne reste ici que le tri par TYPE — on accepte plusieurs noms pour servir
    // l'ancien traceur (formation_viewed) comme le nouveau (product_view).
    const TYPES_VUE = new Set([
      "service_viewed", "formation_viewed", "formation_view", "product_view", "page_view",
    ]);
    const productViewEvents = scopedEvents.filter((e) => TYPES_VUE.has(e.type));

    const viewsByCountryMap = new Map<string, number>();
    for (const e of productViewEvents) {
      const c = toIso2(e.country || sessionCountryMap.get(e.sessionId)) ?? "??";
      viewsByCountryMap.set(c, (viewsByCountryMap.get(c) || 0) + 1);
    }
    const viewsByCountry = [...viewsByCountryMap.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // ── Visiteurs par pays ──────────────────────────────────────────────
    // « Visiteurs » compte des SESSIONS UNIQUES, pas des pages vues : un
    // curieux qui ouvre huit fiches reste un visiteur. C'est ce que le vendeur
    // entend par « d'ou viennent mes visiteurs ».
    //
    // Difference avec viewsByCountry juste au-dessus : celui-ci ne comptait que
    // les vues de FICHES PRODUIT. Un visiteur qui arrivait sur la vitrine et
    // repartait n'apparaissait nulle part — c'est precisement le trafic qu'un
    // vendeur veut voir pour juger de sa publicite.
    // Agregation en lib/formations/stats-pays.ts, couverte par
    // tests/stats-pays.spec.ts. `scopedEvents` est DEJA restreint au vendeur :
    // la fonction ne filtre rien elle-meme.
    const visitorsByCountry = visiteursParPays(scopedEvents, sessionCountryMap);

    // Taux de rebond : part des visiteurs repartis apres une seule page, sans
    // aucune interaction. Meme perimetre vendeur que ci-dessus.
    const bounce = tauxRebond(scopedEvents);

    // ── Conversion funnel ──
    // « Visiteurs » comptait TOUS les `page_view` de la PLATEFORME, toutes
    // boutiques confondues : la requête ne portait aucun filtre vendeur. Chacun
    // voyait donc les milliers de pages vues par les clients des AUTRES,
    // comparées à ses propres vues produit — deux populations différentes, et
    // une chute de « −97 % » parfaitement mécanique. Signalé le 2026-09-07 par
    // un vendeur qui pilotait une campagne TikTok sur ce chiffre.
    //
    // Les DEUX premiers étages comptent désormais des PERSONNES (sessions
    // distinctes) : mélanger des visiteurs uniques et des vues brutes ferait
    // remonter l'entonnoir au deuxième étage.
    const totalViews = visiteursUniques(scopedEvents);
    const sessionsFiche = new Set(
      productViewEvents
        .filter((e) => e.type !== "page_view")
        .map((e) => e.sessionId)
        .filter(Boolean),
    );
    // Repli : si le traceur n'émet que des `page_view` (ancien client), on
    // n'affiche pas un zéro trompeur au deuxième étage.
    const productViews = sessionsFiche.size > 0 ? sessionsFiche.size : totalViews;
    const purchases = periodTxns.length;
    const conversionFunnel = {
      views: totalViews,
      productViews,
      checkouts,
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
        visitorsByCountry,
        bounceRate: bounce.taux,
        bounceSessions: bounce.sessions,
        bounceCount: bounce.rebonds,
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
