import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { PLATFORM_COMMISSION_RATE, VENDOR_NET_RATE } from "@/lib/formations/constants";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const [enrollments, purchases] = await Promise.all([
      prisma.enrollment.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, paidAmount: true, createdAt: true, refundedAt: true, refundRequested: true,
          user: { select: { name: true, email: true } },
          formation: {
            select: {
              title: true,
              instructeur: { select: { user: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.digitalProductPurchase.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, paidAmount: true, createdAt: true,
          user: { select: { name: true, email: true } },
          product: {
            select: {
              title: true, productType: true,
              instructeur: { select: { user: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);

    const all = [
      ...enrollments.map((e) => ({
        id: e.id,
        type: "formation" as const,
        productTitle: e.formation.title,
        productType: "Formation",
        buyerName: e.user.name ?? e.user.email,
        buyerEmail: e.user.email,
        sellerName: e.formation.instructeur.user.name ?? "—",
        amount: e.paidAmount,
        commission: e.paidAmount * PLATFORM_COMMISSION_RATE,
        netAmount: e.paidAmount * VENDOR_NET_RATE,
        createdAt: e.createdAt,
        status: e.refundedAt ? "refunded" : e.refundRequested ? "pending_refund" : "completed",
      })),
      ...purchases.map((p) => ({
        id: p.id,
        type: "product" as const,
        productTitle: p.product.title,
        productType: p.product.productType,
        buyerName: p.user.name ?? p.user.email,
        buyerEmail: p.user.email,
        sellerName: p.product.instructeur.user.name ?? "—",
        amount: p.paidAmount,
        commission: p.paidAmount * PLATFORM_COMMISSION_RATE,
        netAmount: p.paidAmount * VENDOR_NET_RATE,
        createdAt: p.createdAt,
        status: "completed",
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const summary = {
      total: all.length,
      completed: all.filter((t) => t.status === "completed").length,
      refunded: all.filter((t) => t.status === "refunded").length,
      pendingRefund: all.filter((t) => t.status === "pending_refund").length,
      totalRevenue: all.filter((t) => t.status !== "refunded").reduce((s, t) => s + t.amount, 0),
      totalCommission: all.filter((t) => t.status !== "refunded").reduce((s, t) => s + t.commission, 0),
      totalNetPaid: all.filter((t) => t.status !== "refunded").reduce((s, t) => s + t.netAmount, 0),
    };

    return NextResponse.json({ data: all, summary });
  } catch (err) {
    console.error("[admin/transactions]", err);
    return NextResponse.json({ data: [], summary: null });
  }
}
