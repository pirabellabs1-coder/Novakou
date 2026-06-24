import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { z } from "zod";

const withdrawSchema = z.object({
  amount: z.number().min(5000),
  method: z.enum(["WAVE", "ORANGE_MONEY", "MTN", "SEPA"]),
  phone: z.string().optional(),
  iban: z.string().optional(),
});

/**
 * Solde affilié RETIRABLE = somme des commissions APPROVED (validées, passé la
 * fenêtre de remboursement de 14 j). On N'utilise PAS pendingEarnings comme
 * solde retirable : ce champ inclut les commissions PENDING encore
 * remboursables → un affilié pouvait encaisser une commission annulée ensuite.
 */
async function getApprovedBalance(affiliateId: string): Promise<number> {
  const agg = await prisma.affiliateCommission.aggregate({
    where: { affiliateId, status: "APPROVED" },
    _sum: { commissionAmount: true },
  });
  return Math.round(agg._sum.commissionAmount ?? 0);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ balance: 0, pending: 0, paidEarnings: 0, history: [] });

    const [approved, pendingAgg, paidCommissions] = await Promise.all([
      getApprovedBalance(profile.id),
      prisma.affiliateCommission.aggregate({
        where: { affiliateId: profile.id, status: "PENDING" },
        _sum: { commissionAmount: true },
      }),
      prisma.affiliateCommission.findMany({
        where: { affiliateId: profile.id, status: "PAID" },
        orderBy: { paidAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      balance: approved,                                   // retirable maintenant
      pending: Math.round(pendingAgg._sum.commissionAmount ?? 0), // en validation (14 j)
      paidEarnings: profile.paidEarnings,
      history: paidCommissions.map((c) => ({
        id: c.id,
        amount: c.commissionAmount,
        paidAt: c.paidAt,
        ref: c.payoutRef,
      })),
    });
  } catch {
    return NextResponse.json({ balance: 0, pending: 0, paidEarnings: 0, history: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const { amount, method } = parsed.data;

    const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profil affilié introuvable" }, { status: 404 });

    // Commissions VALIDÉES (APPROVED) uniquement, plus anciennes d'abord.
    const approved = await prisma.affiliateCommission.findMany({
      where: { affiliateId: profile.id, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
      select: { id: true, commissionAmount: true },
    });
    const approvedTotal = approved.reduce((s, c) => s + c.commissionAmount, 0);

    if (amount > approvedTotal) {
      return NextResponse.json(
        { error: `Solde insuffisant. Disponible (validé) : ${Math.round(approvedTotal)} FCFA. Les commissions de moins de 14 jours sont encore en validation.` },
        { status: 400 },
      );
    }

    // Sélection FIFO des commissions couvrant le montant (commissions atomiques
    // → le total payé est ≥ montant demandé).
    const toPay: string[] = [];
    let acc = 0;
    for (const c of approved) {
      if (acc >= amount) break;
      toPay.push(c.id);
      acc += c.commissionAmount;
    }
    const paidTotal = Math.round(acc);
    const payoutRef = `affwd_${profile.id}_${Date.now().toString(36)}`;

    // Transaction : on marque les commissions PAID (le cron auto-payout ne les
    // repaiera donc PAS → plus de double paiement) et on met à jour les
    // compteurs du profil de façon cohérente.
    await prisma.$transaction([
      prisma.affiliateCommission.updateMany({
        where: { id: { in: toPay }, status: "APPROVED" },
        data: { status: "PAID", paidAt: new Date(), payoutRef },
      }),
      prisma.affiliateProfile.update({
        where: { id: profile.id },
        data: {
          pendingEarnings: { decrement: paidTotal },
          paidEarnings: { increment: paidTotal },
        },
      }),
    ]);

    await prisma.notification.create({
      data: {
        userId,
        type: "PAYMENT",
        title: "Retrait affilié enregistré",
        message: `Votre retrait de ${paidTotal} FCFA via ${method} est en cours de traitement.`,
        link: "/affilie/retraits",
      },
    }).catch(() => null);

    return NextResponse.json(
      { success: true, paidAmount: paidTotal, payoutRef, message: "Retrait initié avec succès" },
      { status: 201 },
    );
  } catch (err) {
    console.error("[affilie/retraits POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
