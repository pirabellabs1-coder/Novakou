import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

/**
 * GET /api/formations/vendeur/checkout-attempts?status=failed|abandoned|all
 *
 * Retourne les tentatives de paiement echouees/abandonnees pour le vendeur
 * connecte. Le vendeur peut ensuite relancer par email ou WhatsApp.
 *
 * Filtre par defaut : status=failed,abandoned (pas les completed).
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "unresolved";
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

    let statusFilter: object;
    if (statusParam === "failed") statusFilter = { status: "FAILED" };
    else if (statusParam === "abandoned") statusFilter = { status: "ABANDONED" };
    else if (statusParam === "completed") statusFilter = { status: "COMPLETED" };
    else if (statusParam === "recovered") statusFilter = { status: "RECOVERED" };
    else if (statusParam === "all") statusFilter = {};
    else statusFilter = { status: { in: ["FAILED", "ABANDONED"] as const } }; // unresolved

    const attempts = await prisma.checkoutAttempt.findMany({
      where: {
        instructeurId: ctx.instructeurId,
        ...statusFilter,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        visitorEmail: true,
        visitorName: true,
        visitorPhone: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        failureReason: true,
        failureCode: true,
        providerRef: true,
        reminder1SentAt: true,
        reminder2SentAt: true,
        vendorContactedAt: true,
        recoveredAt: true,
        createdAt: true,
        formation: { select: { id: true, title: true, slug: true, price: true } },
        product: { select: { id: true, title: true, slug: true, price: true } },
      },
    });

    // Aggregate stats
    const stats = await prisma.checkoutAttempt.groupBy({
      by: ["status"],
      where: { instructeurId: ctx.instructeurId },
      _count: true,
      _sum: { amount: true },
    });

    const byStatus: Record<string, { count: number; amount: number }> = {};
    stats.forEach((s) => {
      byStatus[s.status] = {
        count: s._count,
        amount: s._sum.amount ?? 0,
      };
    });

    return NextResponse.json({
      data: attempts,
      stats: byStatus,
    });
  } catch (err) {
    console.error("[vendeur/checkout-attempts GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/formations/vendeur/checkout-attempts
 * Body: { id, action: "mark_contacted" }
 *
 * Le vendeur marque qu'il a contacte le visiteur manuellement.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const body = await request.json();
    const { id, action } = body as { id?: string; action?: string };
    if (!id || !action) {
      return NextResponse.json({ error: "id + action requis" }, { status: 400 });
    }

    // Verifie que l'attempt appartient bien au vendeur
    const existing = await prisma.checkoutAttempt.findUnique({
      where: { id },
      select: { instructeurId: true },
    });
    if (!existing || existing.instructeurId !== ctx.instructeurId) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    if (action === "mark_contacted") {
      const updated = await prisma.checkoutAttempt.update({
        where: { id },
        data: { vendorContactedAt: new Date() },
        select: { id: true, vendorContactedAt: true },
      });
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  } catch (err) {
    console.error("[vendeur/checkout-attempts PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
