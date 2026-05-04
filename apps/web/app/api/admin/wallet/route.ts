import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

/**
 * Admin wallet endpoint — historiquement adossé à des tables `AdminWallet`,
 * `AdminTransaction` et `AdminPayout` qui n'ont jamais été créées en DB. Les
 * trois `prisma.adminXxx.findFirst()` retournaient donc `Cannot read properties
 * of undefined (reading 'findFirst')` et la page `/admin/retraits` plantait en 500.
 *
 * Réécriture : on dérive ces totaux des modèles qui existent réellement —
 *   - PlatformRevenue : chaque vente (formation, produit, marketplace order)
 *     enregistre une ligne avec `commissionAmount`. La somme = solde plateforme.
 *   - Order.commission : commissions du marketplace freelance (avant
 *     PlatformRevenue) — on l'inclut pour ne rater aucun revenu historique.
 *   - InstructorWithdrawal en status TRAITE : payouts déjà sortis.
 */

// GET /api/admin/wallet — Aggregated platform fee balance + recent operations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== "admin" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const section = searchParams.get("section"); // "transactions" | "payouts" | null (all)

    // ── Solde plateforme (commissions encaissées) ─────────────────────────
    const [platformRevenueAgg, marketplaceCommissionsAgg, payoutsTotalAgg] = await Promise.all([
      prisma.platformRevenue.aggregate({
        _sum: { commissionAmount: true, grossAmount: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { status: { in: ["TERMINE", "LIVRE"] } },
        _sum: { commission: true },
      }),
      prisma.instructorWithdrawal.aggregate({
        where: { status: "TRAITE" },
        _sum: { amount: true },
      }),
    ]);

    const totalFeesCollected = Math.round(
      ((platformRevenueAgg._sum.commissionAmount ?? 0) + (marketplaceCommissionsAgg._sum.commission ?? 0)) * 100,
    ) / 100;
    const totalGrossProcessed = Math.round((platformRevenueAgg._sum.grossAmount ?? 0) * 100) / 100;
    const totalPaidOut = Math.round((payoutsTotalAgg._sum.amount ?? 0) * 100) / 100;
    // Le "solde disponible" plateforme = commissions encaissées − payouts envoyés.
    // Sur Novakou, les payouts vendeur sortent du wallet vendeur (instructeur),
    // pas de la commission plateforme — donc le solde réel disponible reste
    // toutes les commissions encaissées (totalFeesCollected). On expose les deux
    // chiffres pour que la page admin puisse afficher ce qu'elle veut.
    const wallet = {
      id: "platform-derived",
      currency: "XOF",
      totalFeesCollected,
      totalFeesReleased: totalFeesCollected, // alias rétro-compat avec l'ancien client
      totalGrossProcessed,
      totalPaidOut,
      operationsCount: platformRevenueAgg._count,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result: Record<string, unknown> = { wallet };

    // ── Transactions récentes (dernières commissions encaissées) ──────────
    // PlatformRevenue stocke `instructeurId` en scalaire sans relation Prisma —
    // on fait donc une 2ᵉ requête pour récupérer le nom du vendeur.
    if (!section || section === "transactions") {
      const recent = await prisma.platformRevenue.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      const instructeurIds = Array.from(new Set(recent.map((r) => r.instructeurId).filter((v): v is string => !!v)));
      const instructeurs = instructeurIds.length > 0
        ? await prisma.instructeurProfile.findMany({
            where: { id: { in: instructeurIds } },
            select: { id: true, user: { select: { name: true, email: true } } },
          })
        : [];
      const byId = new Map(instructeurs.map((i) => [i.id, i] as const));
      result.transactions = recent.map((r) => {
        const ins = r.instructeurId ? byId.get(r.instructeurId) : undefined;
        return {
          id: r.id,
          date: r.createdAt,
          type: r.orderType,
          grossAmount: r.grossAmount,
          commission: r.commissionAmount,
          vendor: ins?.user?.name ?? ins?.user?.email ?? "—",
          currency: r.currency,
          paymentRef: r.paymentRef,
        };
      });
    }

    // ── Payouts vendeurs récents (informationnels) ────────────────────────
    if (!section || section === "payouts") {
      const recentPayouts = await prisma.instructorWithdrawal.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
          processedAt: true,
          instructeur: { select: { user: { select: { name: true, email: true } } } },
        },
      });
      result.payouts = recentPayouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt,
        processedAt: p.processedAt,
        vendor: p.instructeur?.user?.name ?? p.instructeur?.user?.email ?? "—",
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /admin/wallet GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur wallet" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/wallet — Ce endpoint était censé créer un payout admin
 * vers la table AdminPayout (qui n'existe pas). Tant que les payouts admin
 * ne sont pas modélisés, on retourne 501 plutôt qu'une fausse réussite —
 * l'admin verra clairement que la fonctionnalité n'est pas active.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Les retraits plateforme ne sont pas encore activés. Les commissions sont conservées sur le compte de l'opérateur Novakou — contactez le support pour un virement manuel.",
    },
    { status: 501 },
  );
}
