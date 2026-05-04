import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: [] });
    const profile = { id: ctx.instructeurId };

    // Multi-shop : transactions de la boutique active uniquement
    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    const shopFilter = activeShopId ? { shopId: activeShopId } : {};

    // Fetch enrollments + product purchases + bundle purchases + sub invoices in parallel
    const [enrollments, purchases, bundlePurchases, subInvoices] = await Promise.all([
      prisma.enrollment.findMany({
        where: { formation: { instructeurId: profile.id, ...shopFilter } },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          paidAmount: true,
          createdAt: true,
          refundedAt: true,
          refundRequested: true,
          user: { select: { name: true, email: true } },
          formation: { select: { title: true } },
        },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { product: { instructeurId: profile.id, ...shopFilter } },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          paidAmount: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          product: { select: { title: true, productType: true } },
        },
      }),
      prisma.productBundlePurchase.findMany({
        where: { bundle: { instructeurId: profile.id, ...shopFilter } },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          paidAmount: true,
          createdAt: true,
          userId: true,
          bundle: { select: { title: true } },
        },
      }),
      prisma.subscriptionInvoice.findMany({
        where: {
          status: "paid",
          subscription: {
            plan: { instructeurId: profile.id, ...shopFilter },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          amount: true,
          createdAt: true,
          subscription: {
            select: {
              user: { select: { name: true, email: true } },
              plan: { select: { name: true, interval: true } },
            },
          },
        },
      }),
    ]);

    // Fetch user names/emails for bundle buyers (no direct relation)
    const bundleUserIds = Array.from(new Set(bundlePurchases.map((bp) => bp.userId)));
    const bundleUsers = bundleUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: bundleUserIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const bundleUserById = new Map(bundleUsers.map((u) => [u.id, { name: u.name, email: u.email }]));

    const txns = [
      ...enrollments.map((e) => ({
        id: e.id,
        type: "formation",
        buyerName: e.user?.name ?? "Apprenant",
        buyerEmail: e.user?.email ?? "",
        productTitle: e.formation?.title ?? "Formation",
        productType: "Cours vidéo",
        amount: e.paidAmount,
        createdAt: e.createdAt,
        status: e.refundedAt !== null ? "refunded" : e.refundRequested ? "pending_refund" : "completed",
      })),
      ...purchases.map((p) => ({
        id: p.id,
        type: "product",
        buyerName: p.user?.name ?? "Client",
        buyerEmail: p.user?.email ?? "",
        productTitle: p.product?.title ?? "Produit",
        productType: p.product?.productType ?? "EBOOK",
        amount: p.paidAmount,
        createdAt: p.createdAt,
        status: "completed",
      })),
      ...bundlePurchases.map((bp) => {
        const u = bundleUserById.get(bp.userId);
        return {
          id: bp.id,
          type: "bundle",
          buyerName: u?.name ?? "Acheteur",
          buyerEmail: u?.email ?? "",
          productTitle: bp.bundle?.title ?? "Pack",
          productType: "Pack",
          amount: bp.paidAmount,
          createdAt: bp.createdAt,
          status: "completed",
        };
      }),
      ...subInvoices.map((inv) => ({
        id: inv.id,
        type: "subscription",
        buyerName: inv.subscription.user?.name ?? "Abonné",
        buyerEmail: inv.subscription.user?.email ?? "",
        productTitle: inv.subscription.plan?.name ?? "Abonnement",
        productType: inv.subscription.plan?.interval === "yearly" ? "Abonnement annuel" : "Abonnement mensuel",
        amount: inv.amount,
        createdAt: inv.createdAt,
        status: "completed",
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalRevenue = txns.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0);
    const pendingRevenue = txns.filter((t) => t.status === "pending_refund").reduce((s, t) => s + t.amount, 0);

    return NextResponse.json({
      data: txns,
      summary: {
        total: txns.length,
        completed: txns.filter((t) => t.status === "completed").length,
        refunded: txns.filter((t) => t.status === "refunded").length,
        totalRevenue: Math.round(totalRevenue),
        pendingRevenue: Math.round(pendingRevenue),
      },
    });
  } catch (err) {
    console.error("[vendeur/transactions]", err);
    return NextResponse.json({ data: [] });
  }
}
