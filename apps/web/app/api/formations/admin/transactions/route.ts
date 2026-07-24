import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { PLATFORM_COMMISSION_RATE, VENDOR_NET_RATE } from "@/lib/formations/constants";
import { classifyPaymentOrigin, ORIGIN_LABEL_FR } from "@/lib/formations/payment-origin";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // Bureau session 4 (P0 Amélie) — check rôle ADMIN strict (fuite PII massive sinon)
    const role = (session?.user as { role?: string } | undefined)?.role?.toUpperCase();
    if ((!session?.user || role !== "ADMIN") && !IS_DEV) {
      return NextResponse.json({ error: "Accès refusé — admin requis" }, { status: 403 });
    }

    const [enrollments, purchases] = await Promise.all([
      prisma.enrollment.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, paidAmount: true, createdAt: true, refundedAt: true, refundRequested: true,
          stripeSessionId: true,
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
          stripeSessionId: true,
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

    // Origine réelle de chaque accès (préfixe stripeSessionId) : c'est ce qui
    // distingue un VRAI paiement d'un accès gratuit/offert/test — la question
    // centrale de l'admin (« a-t-il payé ou pas ? »).
    const all = [
      ...enrollments.map((e) => {
        const origin = classifyPaymentOrigin(e.stripeSessionId, e.paidAmount);
        return {
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
          origin,
          originLabel: ORIGIN_LABEL_FR[origin],
        };
      }),
      ...purchases.map((p) => {
        const origin = classifyPaymentOrigin(p.stripeSessionId, p.paidAmount);
        return {
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
          origin,
          originLabel: ORIGIN_LABEL_FR[origin],
        };
      }),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const notRefunded = all.filter((t) => t.status !== "refunded");
    const paidRows = notRefunded.filter((t) => t.origin === "paid");
    const summary = {
      total: all.length,
      completed: all.filter((t) => t.status === "completed").length,
      refunded: all.filter((t) => t.status === "refunded").length,
      pendingRefund: all.filter((t) => t.status === "pending_refund").length,
      totalRevenue: notRefunded.reduce((s, t) => s + t.amount, 0),
      totalCommission: notRefunded.reduce((s, t) => s + t.commission, 0),
      totalNetPaid: notRefunded.reduce((s, t) => s + t.netAmount, 0),
      // Ventilation par origine : le VRAI argent encaissé vs le reste.
      paidCount: paidRows.length,
      freeCount: notRefunded.filter((t) => t.origin === "free" || t.origin === "gift" || t.origin === "test").length,
      viaOfferCount: notRefunded.filter((t) => t.origin === "subscription" || t.origin === "bundle").length,
      realRevenue: paidRows.reduce((s, t) => s + t.amount, 0),
      realCommission: paidRows.reduce((s, t) => s + t.commission, 0),
      realNetPaid: paidRows.reduce((s, t) => s + t.netAmount, 0),
    };

    return NextResponse.json({ data: all, summary });
  } catch (err) {
    console.error("[admin/transactions]", err);
    return NextResponse.json({ data: [], summary: null });
  }
}
