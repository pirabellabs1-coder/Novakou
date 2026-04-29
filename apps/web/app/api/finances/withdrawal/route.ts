import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { transactionStore } from "@/lib/dev/data-store";
import { emitEvent } from "@/lib/events/dispatcher";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";

const VALID_METHODS_DEV = ["SEPA", "PayPal", "Wave", "Orange Money", "MTN Mobile Money"];
const VALID_METHODS_PRISMA = ["SEPA", "MOBILE_MONEY", "PAYPAL", "WISE", "CRYPTO"] as const;
const MINIMUM_WITHDRAWAL = 20;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // KYC level 3 required
    if ((session.user.kyc ?? 1) < 3) {
      return NextResponse.json(
        {
          error: "Verification d'identite requise pour retirer des fonds (KYC niveau 3 minimum).",
          code: "KYC_REQUIRED",
          requiredLevel: 3,
          currentLevel: session.user.kyc ?? 1,
          redirectTo: "/kyc",
        },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimitKey = `withdrawal:${session.user.id}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes de retrait. Veuillez patienter." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { amount, method, details } = body;

    if (typeof amount !== "number" || amount < MINIMUM_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Le montant minimum de retrait est de ${MINIMUM_WITHDRAWAL} EUR` },
        { status: 400 }
      );
    }

    recordFailedAttempt(rateLimitKey);

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      if (!method || !VALID_METHODS_DEV.includes(method)) {
        return NextResponse.json(
          { error: `Methode invalide. Acceptees : ${VALID_METHODS_DEV.join(", ")}` },
          { status: 400 }
        );
      }

      const summary = transactionStore.getSummary(session.user.id);
      if (amount > summary.available) {
        return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
      }

      const transaction = transactionStore.add({
        userId: session.user.id,
        type: "retrait",
        description: `Retrait vers ${method}${details ? ` - ${details}` : ""}`,
        amount: -amount,
        status: "en_attente",
        date: new Date().toISOString().slice(0, 10),
        method,
      });

      emitEvent("withdrawal.requested", {
        userId: session.user.id, userName: session.user.name || "", userEmail: session.user.email || "",
        amount, method,
      }).catch(() => {});

      return NextResponse.json({ transaction }, { status: 201 });
    }

    // Production: Prisma — use wallet models
    if (!method || !(VALID_METHODS_PRISMA as readonly string[]).includes(method)) {
      return NextResponse.json(
        { error: `Methode invalide. Acceptees : ${VALID_METHODS_PRISMA.join(", ")}` },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userRole = (session.user as Record<string, unknown>).role as string;

    if (userRole === "AGENCE" || userRole === "agence") {
      const agencyProfile = await prisma.agencyProfile.findUnique({ where: { userId }, select: { id: true } });
      if (!agencyProfile) {
        return NextResponse.json({ error: "Profil agence introuvable" }, { status: 404 });
      }

      const wallet = await prisma.walletAgency.findUnique({ where: { agencyId: agencyProfile.id } });
      if (!wallet || wallet.balance < amount) {
        return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
      }

      const [, transaction] = await prisma.$transaction([
        prisma.walletAgency.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } },
        }),
        prisma.walletTransaction.create({
          data: {
            agencyWalletId: wallet.id,
            type: "WITHDRAWAL",
            amount: -amount,
            description: `Retrait vers ${method}${details ? ` - ${details}` : ""}`,
            status: "WALLET_PENDING",
            withdrawalMethod: method as "SEPA" | "MOBILE_MONEY" | "PAYPAL" | "WISE" | "CRYPTO",
          },
        }),
      ]);

      emitEvent("withdrawal.requested", {
        userId, userName: session.user.name || "", userEmail: session.user.email || "",
        amount, method,
      }).catch(() => {});

      return NextResponse.json({ transaction }, { status: 201 });
    }

    // Freelance
    const wallet = await prisma.walletFreelance.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    const [, transaction] = await prisma.$transaction([
      prisma.walletFreelance.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          freelanceWalletId: wallet.id,
          type: "WITHDRAWAL",
          amount: -amount,
          description: `Retrait vers ${method}${details ? ` - ${details}` : ""}`,
          status: "WALLET_PENDING",
          withdrawalMethod: method as "SEPA" | "MOBILE_MONEY" | "PAYPAL" | "WISE" | "CRYPTO",
        },
      }),
    ]);

    emitEvent("withdrawal.requested", {
      userId, userName: session.user.name || "", userEmail: session.user.email || "",
      amount, method,
    }).catch(() => {});

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("[API /finances/withdrawal POST]", error);
    return NextResponse.json({ error: "Erreur lors de la demande de retrait" }, { status: 500 });
  }
}
