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

    // Fetch enrollments and digital product purchases in parallel
    const [enrollments, purchases] = await Promise.all([
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
    ]);

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
