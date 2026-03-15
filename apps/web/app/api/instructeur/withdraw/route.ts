// POST /api/instructeur/withdraw — Demander un retrait

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { INSTRUCTOR_COMMISSION } from "@/lib/formations/prisma-helpers";
import { z } from "zod";
import { sendWithdrawalRequestEmail } from "@/lib/email/formations";

const withdrawSchema = z.object({
  amount: z.number().min(20).max(10000),
  method: z.enum(["virement", "paypal", "wave", "orange_money", "mtn"]),
  accountDetails: z.record(z.string(), z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructeur || instructeur.status !== "APPROUVE") {
      return NextResponse.json({ error: "Compte instructeur non approuvé" }, { status: 403 });
    }

    // Verification KYC obligatoire pour retirer des fonds (niveau 3 minimum)
    if ((session.user.kyc ?? 1) < 3) {
      return NextResponse.json(
        {
          error: "Verification d'identite requise pour retirer des fonds. Completez votre KYC (niveau 3 minimum).",
          code: "KYC_REQUIRED",
          requiredLevel: 3,
          currentLevel: session.user.kyc ?? 1,
          redirectTo: "/dashboard/kyc",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount, method, accountDetails } = withdrawSchema.parse(body);

    // Calculer le solde disponible
    const formations = await prisma.formation.findMany({
      where: { instructeurId: instructeur.id },
      select: { id: true },
    });
    const formationIds = formations.map((f) => f.id);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const allEnrollments = await prisma.enrollment.findMany({
      where: { formationId: { in: formationIds } },
      select: { paidAmount: true, createdAt: true },
    });

    const totalEarned = allEnrollments
      .filter((e) => new Date(e.createdAt) <= thirtyDaysAgo)
      .reduce((acc, e) => acc + e.paidAmount * INSTRUCTOR_COMMISSION, 0);

    const withdrawals = await prisma.instructorWithdrawal.findMany({
      where: { instructeurId: instructeur.id, status: { in: ["EN_ATTENTE", "TRAITE"] } },
    });

    const totalWithdrawn = withdrawals.reduce((acc, w) => acc + w.amount, 0);
    const availableBalance = Math.round((totalEarned - totalWithdrawn) * 100) / 100;

    if (amount > availableBalance) {
      return NextResponse.json(
        {
          error: `Solde insuffisant. Disponible : ${availableBalance.toFixed(2)}€`,
          available: availableBalance,
        },
        { status: 400 }
      );
    }

    const withdrawal = await prisma.instructorWithdrawal.create({
      data: {
        instructeurId: instructeur.id,
        amount,
        method,
        accountDetails: accountDetails as Record<string, string>,
        status: "EN_ATTENTE",
      },
    });

    // Email de confirmation
    sendWithdrawalRequestEmail({
      email: session.user.email!,
      name: session.user.name ?? "Instructeur",
      amount,
      method,
    }).catch((err) => console.error("[Email] sendWithdrawalRequestEmail:", err));

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[POST /api/instructeur/withdraw]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
