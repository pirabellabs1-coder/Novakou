import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const typeFilter = searchParams.get("type"); // "formation" | "product" | "bundle" | "subscription"

    // FIX : avant on ne listait QUE Enrollment + DigitalProductPurchase.
    // Un user qui achetait un Bundle ou s'abonnait à un SubscriptionPlan
    // ne voyait jamais l'achat dans ses commandes. Maintenant on inclut
    // les 4 types dans la timeline unifiée.
    const [enrollments, purchases, bundlePurchases, subscriptions] = await Promise.allSettled([
      prisma.enrollment.findMany({
        where: { userId },
        include: {
          formation: {
            select: {
              id: true, title: true, thumbnail: true, customCategory: true,
              instructeur: { select: { user: { select: { id: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true, title: true, productType: true, banner: true,
              instructeur: { select: { user: { select: { id: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.productBundlePurchase.findMany({
        where: { userId },
        include: {
          bundle: {
            select: {
              id: true, slug: true, title: true, thumbnail: true, banner: true,
              instructeurId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscription.findMany({
        where: { userId },
        include: {
          plan: {
            select: {
              id: true, name: true, imageUrl: true, bannerUrl: true, interval: true,
              instructeurId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const enrollmentList = enrollments.status === "fulfilled" ? enrollments.value : [];
    const purchaseList   = purchases.status   === "fulfilled" ? purchases.value   : [];
    const bundleList     = bundlePurchases.status === "fulfilled" ? bundlePurchases.value : [];
    const subList        = subscriptions.status === "fulfilled" ? subscriptions.value : [];

    // Merge into unified timeline (4 types maintenant)
    const orders = [
      ...enrollmentList.map((e) => ({
        id: e.id,
        type: "formation" as const,
        title: e.formation?.title ?? "Formation",
        thumbnail: e.formation?.thumbnail ?? null,
        category: e.formation?.customCategory ?? null,
        amount: e.paidAmount,
        currency: "XOF",
        status: e.refundedAt
          ? "REFUNDED"
          : e.refundRequested
          ? "REFUND_PENDING"
          : e.completedAt
          ? "COMPLETED"
          : "ACTIVE",
        createdAt: e.createdAt.toISOString(),
        progress: e.progress,
        refundRequested: e.refundRequested ?? false,
        refundedAt: e.refundedAt?.toISOString() ?? null,
        instructeurUserId: (e.formation as { instructeur?: { user?: { id?: string } } })?.instructeur?.user?.id ?? null,
      })),
      ...purchaseList.map((p) => ({
        id: p.id,
        type: "product" as const,
        title: p.product?.title ?? "Produit",
        thumbnail: p.product?.banner ?? null,
        category: p.product?.productType ?? null,
        amount: p.paidAmount,
        currency: "XOF",
        status: "COMPLETED" as const,
        createdAt: p.createdAt.toISOString(),
        progress: 100,
        instructeurUserId: (p.product as { instructeur?: { user?: { id?: string } } })?.instructeur?.user?.id ?? null,
      })),
      ...bundleList.map((b) => ({
        id: b.id,
        type: "bundle" as const,
        title: b.bundle?.title ?? "Pack",
        thumbnail: b.bundle?.thumbnail ?? b.bundle?.banner ?? null,
        category: "Pack",
        amount: b.paidAmount,
        currency: "XOF",
        status: "COMPLETED" as const,
        createdAt: b.createdAt.toISOString(),
        progress: 100,
        instructeurUserId: null,
      })),
      ...subList.map((s) => ({
        id: s.id,
        type: "subscription" as const,
        title: s.plan?.name ?? "Abonnement",
        thumbnail: s.plan?.imageUrl ?? s.plan?.bannerUrl ?? null,
        category: s.plan?.interval === "yearly" ? "Annuel" : "Mensuel",
        amount: s.totalPaid,
        currency: "XOF",
        // Map Subscription status → status standardisé
        status: s.status === "active" || s.status === "trialing"
          ? "ACTIVE"
          : s.status === "cancelled"
          ? "CANCELLED"
          : s.status === "expired"
          ? "EXPIRED"
          : "ACTIVE",
        createdAt: s.createdAt.toISOString(),
        progress: 100,
        instructeurUserId: null,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filtered = typeFilter ? orders.filter((o) => o.type === typeFilter) : orders;

    return NextResponse.json({ data: filtered });
  } catch (err) {
    console.error("[apprenant/commandes]", err);
    return NextResponse.json({ data: [] });
  }
}
