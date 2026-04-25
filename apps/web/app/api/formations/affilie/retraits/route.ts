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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ balance: 0, history: [] });

    // Return paid commissions as withdrawal history (proxy until a dedicated Withdrawal model exists)
    const paidCommissions = await prisma.affiliateCommission.findMany({
      where: { affiliateId: profile.id, status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      balance: profile.pendingEarnings,
      paidEarnings: profile.paidEarnings,
      history: paidCommissions.map((c) => ({
        id: c.id,
        amount: c.commissionAmount,
        paidAt: c.paidAt,
        ref: c.payoutRef,
      })),
    });
  } catch {
    return NextResponse.json({ balance: 0, history: [] });
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

    const { amount } = parsed.data;

    const profile = await prisma.affiliateProfile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json({ error: "Profil affilié introuvable" }, { status: 404 });
    if (profile.pendingEarnings < amount)
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });

    // In a real app, this would trigger a payout via CinetPay/Stripe
    // For now, we mark the withdrawal as requested
    await prisma.affiliateProfile.update({
      where: { id: profile.id },
      data: {
        pendingEarnings: { decrement: amount },
        paidEarnings: { increment: amount },
      },
    });

    return NextResponse.json({ success: true, message: "Retrait initié avec succès" }, { status: 201 });
  } catch (err) {
    console.error("[affilie/retraits POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
