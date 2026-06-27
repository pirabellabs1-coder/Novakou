import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { z } from "zod";
import {
  getPayoutMethod,
  normalizeMsisdn,
  shortMethodLabel,
} from "@/lib/moneroo-payout-methods";
import { notifyAdmins } from "@/lib/agents/notify";

const MIN_WITHDRAWAL = 5000;

const withdrawSchema = z.object({
  amount: z.number().min(MIN_WITHDRAWAL),
  method: z.string().min(2), // id méthode Moneroo (ex: "wave_ci")
  msisdn: z.string().optional(),
  iban: z.string().optional(),
});

/**
 * Solde affilié RETIRABLE = commissions APPROVED NON déjà réservées par un
 * retrait (withdrawalId = null). On ne touche pas pendingEarnings (qui inclut
 * des commissions encore remboursables).
 */
async function getApprovedBalance(affiliateId: string): Promise<number> {
  const agg = await prisma.affiliateCommission.aggregate({
    where: { affiliateId, status: "APPROVED", withdrawalId: null },
    _sum: { commissionAmount: true },
  });
  return Math.round(agg._sum.commissionAmount ?? 0);
}

const STATUS_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente de versement",
  TRAITE: "Payé",
  REFUSE: "Refusé",
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ balance: 0, pending: 0, reserved: 0, paidEarnings: 0, history: [] });

    const [approved, pendingAgg, reservedAgg, withdrawals] = await Promise.all([
      getApprovedBalance(profile.id),
      prisma.affiliateCommission.aggregate({
        where: { affiliateId: profile.id, status: "PENDING" },
        _sum: { commissionAmount: true },
      }),
      prisma.affiliateCommission.aggregate({
        where: { affiliateId: profile.id, status: "APPROVED", withdrawalId: { not: null } },
        _sum: { commissionAmount: true },
      }),
      prisma.affiliateWithdrawal.findMany({
        where: { affiliateId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    return NextResponse.json({
      balance: approved,                                          // retirable maintenant
      pending: Math.round(pendingAgg._sum.commissionAmount ?? 0), // en validation (14 j)
      reserved: Math.round(reservedAgg._sum.commissionAmount ?? 0), // retrait en attente
      paidEarnings: profile.paidEarnings,
      history: withdrawals.map((w) => ({
        id: w.id,
        amount: w.amount,
        method: w.method,
        methodLabel: shortMethodLabel(w.method) || w.method,
        status: w.status,
        statusLabel: STATUS_LABEL[w.status] ?? w.status,
        refusedReason: w.refusedReason,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
      })),
    });
  } catch (err) {
    console.error("[affilie/retraits GET]", err);
    return NextResponse.json({ balance: 0, pending: 0, reserved: 0, paidEarnings: 0, history: [] });
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
    const { amount, method, msisdn } = parsed.data;

    // Méthode Moneroo valide ?
    const methodDef = getPayoutMethod(method);
    if (!methodDef) {
      return NextResponse.json({ error: "Méthode de paiement non reconnue." }, { status: 400 });
    }

    // Coordonnées requises (méthodes Moneroo affiliés = Mobile Money → msisdn).
    const accountDetails: Record<string, string> = {};
    if (methodDef.requiredFields.includes("msisdn")) {
      if (!msisdn || !msisdn.trim())
        return NextResponse.json({ error: "Numéro Mobile Money requis." }, { status: 400 });
      accountDetails.msisdn = normalizeMsisdn(msisdn.trim(), methodDef.id);
    }

    const profile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      select: { id: true, user: { select: { name: true, email: true } } },
    });
    if (!profile) return NextResponse.json({ error: "Profil affilié introuvable" }, { status: 404 });

    // Commissions VALIDÉES non réservées, plus anciennes d'abord.
    const approved = await prisma.affiliateCommission.findMany({
      where: { affiliateId: profile.id, status: "APPROVED", withdrawalId: null },
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

    // Sélection FIFO couvrant le montant (commissions atomiques → total ≥ montant).
    const toReserve: string[] = [];
    let acc = 0;
    for (const c of approved) {
      if (acc >= amount) break;
      toReserve.push(c.id);
      acc += c.commissionAmount;
    }
    const reservedTotal = Math.round(acc);
    const payoutRef = `affwd_${profile.id}_${Date.now().toString(36)}`;

    // Transaction : créer la demande EN_ATTENTE et RÉSERVER les commissions
    // (withdrawalId) — elles restent APPROVED mais ne sont plus retirables.
    // AUCUN versement ici : l'admin validera et déclenchera le payout Moneroo.
    const withdrawal = await prisma.$transaction(async (tx) => {
      const wd = await tx.affiliateWithdrawal.create({
        data: {
          affiliateId: profile.id,
          userId,
          amount: reservedTotal,
          method: methodDef.id,
          accountDetails,
          status: "EN_ATTENTE",
          payoutRef,
        },
      });
      await tx.affiliateCommission.updateMany({
        where: { id: { in: toReserve }, status: "APPROVED", withdrawalId: null },
        data: { withdrawalId: wd.id },
      });
      return wd;
    });

    // Notification à l'affilié (demande enregistrée, en attente de versement).
    await prisma.notification.create({
      data: {
        userId,
        type: "PAYMENT",
        title: "Demande de retrait enregistrée",
        message: `Votre retrait de ${reservedTotal} FCFA via ${shortMethodLabel(methodDef.id)} est en attente de versement. Vous serez notifié dès qu'il sera traité.`,
        link: "/affilie/retraits",
      },
    }).catch(() => null);

    // Alerte admin (Telegram + e-mail) pour traiter le versement.
    await notifyAdmins({
      subject: `Retrait affilié à verser — ${reservedTotal} FCFA`,
      body: `${profile.user?.name ?? "Un affilié"} (${profile.user?.email ?? "?"}) demande un retrait de ${reservedTotal} FCFA via ${shortMethodLabel(methodDef.id)}. À valider et verser depuis l'espace admin.`,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/admin/affiliate-withdrawals`,
    }).catch(() => null);

    return NextResponse.json(
      { success: true, withdrawalId: withdrawal.id, amount: reservedTotal, payoutRef, message: "Demande de retrait enregistrée. Versement après validation." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[affilie/retraits POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
