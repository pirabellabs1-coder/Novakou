import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { classifyPaymentOrigin } from "@/lib/formations/payment-origin";

/**
 * GET /api/formations/vendeur/clients
 *
 * Liste TOUTES les commandes des acheteurs du vendeur avec leur statut :
 *   - commandes finalisées (Enrollment / DigitalProductPurchase / Pack /
 *     Abonnement) → payé / gratuit / offert / abonnement / pack / remboursé
 *   - tentatives non finalisées (CheckoutAttempt) → en attente / échoué / abandonné
 * Scopé au vendeur + à la boutique active. Renvoie { orders, summary }.
 */

type OrderStatus =
  | "paye" | "gratuit" | "offert" | "abonnement" | "pack" | "rembourse"
  | "en_attente" | "echoue" | "annule";

function completedStatus(ref: string | null, amount: number, refunded: boolean): OrderStatus {
  if (refunded) return "rembourse";
  switch (classifyPaymentOrigin(ref, amount)) {
    case "paid":
    case "unknown":
      return "paye";
    case "free":
    case "test":
      return "gratuit";
    case "gift":
      return "offert";
    case "subscription":
      return "abonnement";
    case "bundle":
      return "pack";
    default:
      return "paye";
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: { orders: [], summary: null } });
    const instructeurId = ctx.instructeurId;

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    const shopFilter = activeShopId ? { shopId: activeShopId } : {};

    const [enrollments, purchases, bundlePurchases, subInvoices, attempts] = await Promise.all([
      prisma.enrollment.findMany({
        where: { formation: { instructeurId, ...shopFilter } },
        select: {
          id: true, paidAmount: true, stripeSessionId: true, createdAt: true, refundedAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
          formation: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      prisma.digitalProductPurchase.findMany({
        where: { product: { instructeurId, ...shopFilter } },
        select: {
          id: true, paidAmount: true, stripeSessionId: true, createdAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
          product: { select: { title: true, productType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      prisma.productBundlePurchase.findMany({
        where: { bundle: { instructeurId, ...(activeShopId ? { shopId: activeShopId } : {}) } },
        select: {
          id: true, paidAmount: true, status: true, refundedAt: true, createdAt: true, userId: true,
          bundle: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.subscriptionInvoice.findMany({
        where: { status: "paid", subscription: { plan: { instructeurId, ...(activeShopId ? { shopId: activeShopId } : {}) } } },
        select: {
          id: true, amount: true, createdAt: true,
          subscription: {
            select: {
              user: { select: { id: true, name: true, email: true, image: true } },
              plan: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.checkoutAttempt.findMany({
        where: { instructeurId, ...shopFilter, status: { in: ["STARTED", "FAILED", "ABANDONED"] } },
        select: {
          id: true, amount: true, status: true, createdAt: true, visitorName: true, visitorEmail: true,
          user: { select: { id: true, name: true, email: true, image: true } },
          formation: { select: { title: true } },
          product: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

    // Résolution des acheteurs de packs (pas de relation user sur la table).
    const bundleUserIds = [...new Set(bundlePurchases.map((b) => b.userId).filter(Boolean))] as string[];
    const bundleUsers = bundleUserIds.length
      ? await prisma.user.findMany({ where: { id: { in: bundleUserIds } }, select: { id: true, name: true, email: true, image: true } })
      : [];
    const bundleUserById = new Map(bundleUsers.map((u) => [u.id, u]));

    type Order = {
      id: string;
      buyerName: string;
      buyerEmail: string | null;
      avatar: string | null;
      productTitle: string;
      productType: string;
      amount: number;
      status: OrderStatus;
      date: string;
    };
    const orders: Order[] = [];

    for (const e of enrollments) {
      orders.push({
        id: `enr_${e.id}`,
        buyerName: e.user?.name ?? e.user?.email?.split("@")[0] ?? "Client",
        buyerEmail: e.user?.email ?? null,
        avatar: e.user?.image ?? null,
        productTitle: e.formation?.title ?? "Formation",
        productType: "Formation",
        amount: e.paidAmount,
        status: completedStatus(e.stripeSessionId, e.paidAmount, e.refundedAt !== null),
        date: e.createdAt.toISOString(),
      });
    }
    for (const p of purchases) {
      orders.push({
        id: `prd_${p.id}`,
        buyerName: p.user?.name ?? p.user?.email?.split("@")[0] ?? "Client",
        buyerEmail: p.user?.email ?? null,
        avatar: p.user?.image ?? null,
        productTitle: p.product?.title ?? "Produit",
        productType: p.product?.productType ?? "Produit numérique",
        amount: p.paidAmount,
        status: completedStatus(p.stripeSessionId, p.paidAmount, false),
        date: p.createdAt.toISOString(),
      });
    }
    for (const b of bundlePurchases) {
      const u = b.userId ? bundleUserById.get(b.userId) : null;
      orders.push({
        id: `bnd_${b.id}`,
        buyerName: u?.name ?? u?.email?.split("@")[0] ?? "Client",
        buyerEmail: u?.email ?? null,
        avatar: u?.image ?? null,
        productTitle: b.bundle?.title ?? "Pack",
        productType: "Pack",
        amount: b.paidAmount,
        status: b.refundedAt || b.status === "REFUNDED" ? "rembourse" : b.status === "CANCELLED" ? "annule" : "pack",
        date: b.createdAt.toISOString(),
      });
    }
    for (const s of subInvoices) {
      const u = s.subscription?.user;
      orders.push({
        id: `sub_${s.id}`,
        buyerName: u?.name ?? u?.email?.split("@")[0] ?? "Abonné",
        buyerEmail: u?.email ?? null,
        avatar: u?.image ?? null,
        productTitle: s.subscription?.plan?.name ?? "Abonnement",
        productType: "Abonnement",
        amount: s.amount,
        status: "abonnement",
        date: s.createdAt.toISOString(),
      });
    }
    for (const a of attempts) {
      const status: OrderStatus = a.status === "STARTED" ? "en_attente" : a.status === "FAILED" ? "echoue" : "annule";
      orders.push({
        id: `att_${a.id}`,
        buyerName: a.user?.name ?? a.visitorName ?? a.user?.email?.split("@")[0] ?? a.visitorEmail?.split("@")[0] ?? "Visiteur",
        buyerEmail: a.user?.email ?? a.visitorEmail ?? null,
        avatar: a.user?.image ?? null,
        productTitle: a.formation?.title ?? a.product?.title ?? "Commande",
        productType: a.formation ? "Formation" : a.product ? "Produit numérique" : "—",
        amount: a.amount,
        status,
        date: a.createdAt.toISOString(),
      });
    }

    orders.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());

    // ── Résumé ──
    const paidStatuses: OrderStatus[] = ["paye", "abonnement", "pack"];
    const uniqueClients = new Set<string>();
    let revenuePaid = 0;
    let countPending = 0;
    let countFailed = 0; // échoué + abandonné
    for (const o of orders) {
      if (paidStatuses.includes(o.status)) {
        revenuePaid += o.amount;
        if (o.buyerEmail) uniqueClients.add(o.buyerEmail.toLowerCase());
      }
      if (o.status === "en_attente") countPending += 1;
      if (o.status === "echoue" || o.status === "annule") countFailed += 1;
    }

    return NextResponse.json({
      data: {
        orders: orders.slice(0, 500),
        summary: {
          totalOrders: orders.length,
          uniqueClients: uniqueClients.size,
          revenuePaid: Math.round(revenuePaid),
          pending: countPending,
          cancelled: countFailed,
        },
      },
    });
  } catch (err) {
    console.error("[vendeur/clients]", err);
    return NextResponse.json({ data: { orders: [], summary: null } });
  }
}
