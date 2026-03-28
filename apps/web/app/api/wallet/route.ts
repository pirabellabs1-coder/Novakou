import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { transactionStore } from "@/lib/dev/data-store";
import { checkRateLimit, recordFailedAttempt } from "@/lib/auth/rate-limiter";
import { emitEvent } from "@/lib/events/dispatcher";

// GET /api/wallet — Get wallet info + recent transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const section = searchParams.get("section"); // "transactions" for full list

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const summary = transactionStore.getSummary(session.user.id);
      const transactions = transactionStore.getByUser(session.user.id);
      return NextResponse.json({
        wallet: {
          id: "dev-wallet",
          balance: summary.available,
          pending: summary.pending,
          totalEarned: summary.totalEarned,
        },
        transactions: section === "transactions" ? transactions : transactions.slice(0, 10),
      });
    }

    const userId = session.user.id;
    const userRole = (session.user as Record<string, unknown>).role as string;

    // Determine if user is agency or freelance
    if (userRole === "AGENCE" || userRole === "agence") {
      const agencyProfile = await prisma.agencyProfile.findUnique({
        where: { userId },
      });

      if (!agencyProfile) {
        return NextResponse.json({ error: "Profil agence introuvable" }, { status: 404 });
      }

      // Upsert wallet (auto-create if missing)
      let wallet = await prisma.walletAgency.findUnique({
        where: { agencyId: agencyProfile.id },
      });
      if (!wallet) {
        wallet = await prisma.walletAgency.create({
          data: { agencyId: agencyProfile.id },
        });
      }

      const transactions = await prisma.walletTransaction.findMany({
        where: { agencyWalletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: section === "transactions" ? 100 : 10,
      });

      return NextResponse.json({ wallet, transactions });
    }

    // Freelance (default)
    let wallet = await prisma.walletFreelance.findUnique({
      where: { userId },
    });
    if (!wallet) {
      wallet = await prisma.walletFreelance.create({
        data: { userId },
      });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { freelanceWalletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: section === "transactions" ? 100 : 10,
    });

    // If wallet has 0 values, supplement from Order/Payment data
    let walletData: { id: string; balance: number; pending: number; totalEarned: number; createdAt: Date; updatedAt: Date } = wallet;
    if (wallet.balance === 0 && wallet.pending === 0 && wallet.totalEarned === 0) {
      const [completedOrdersAgg, pendingOrdersAgg, paymentAgg] = await Promise.all([
        prisma.order.aggregate({ where: { freelanceId: userId, status: "TERMINE" }, _sum: { freelancerPayout: true, amount: true } }),
        prisma.order.aggregate({ where: { freelanceId: userId, status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION"] } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { payeeId: userId, status: "COMPLETE" }, _sum: { amount: true } }),
      ]);
      const orderEarned = Math.round((completedOrdersAgg._sum.freelancerPayout ?? completedOrdersAgg._sum.amount ?? 0) * 100) / 100;
      const orderPending = Math.round((pendingOrdersAgg._sum.amount ?? 0) * 100) / 100;
      const paymentEarned = Math.round((paymentAgg._sum.amount ?? 0) * 100) / 100;
      const totalEarned = Math.max(orderEarned, paymentEarned);
      walletData = {
        ...wallet,
        balance: totalEarned,
        pending: orderPending,
        totalEarned,
      };
    }

    return NextResponse.json({ wallet: walletData, transactions });
  } catch (error) {
    console.error("[API /wallet GET]", error);
    return NextResponse.json({ error: "Erreur lors de la recuperation du wallet" }, { status: 500 });
  }
}

const VALID_METHODS = ["SEPA", "MOBILE_MONEY", "PAYPAL", "WISE", "CRYPTO"] as const;
const MINIMUM_WITHDRAWAL = 20;

// POST /api/wallet — Request withdrawal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // KYC level 3 required for withdrawals
    if ((session.user.kyc ?? 1) < 3) {
      return NextResponse.json(
        {
          error: "Verification d'identite requise pour retirer des fonds (KYC niveau 3 minimum).",
          code: "KYC_REQUIRED",
          requiredLevel: 3,
          currentLevel: session.user.kyc ?? 1,
        },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimitKey = `wallet-withdrawal:${session.user.id}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Trop de demandes. Veuillez patienter." }, { status: 429 });
    }
    recordFailedAttempt(rateLimitKey);

    const body = await request.json();
    const { amount, method, details } = body;

    if (typeof amount !== "number" || amount < MINIMUM_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Le montant minimum de retrait est de ${MINIMUM_WITHDRAWAL} EUR` },
        { status: 400 }
      );
    }

    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json(
        { error: `Methode invalide. Acceptees : ${VALID_METHODS.join(", ")}` },
        { status: 400 }
      );
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
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

      return NextResponse.json({ transaction }, { status: 201 });
    }

    const userId = session.user.id;
    const userRole = (session.user as Record<string, unknown>).role as string;

    if (userRole === "AGENCE" || userRole === "agence") {
      const agencyProfile = await prisma.agencyProfile.findUnique({
        where: { userId },
      });
      if (!agencyProfile) {
        return NextResponse.json({ error: "Profil agence introuvable" }, { status: 404 });
      }

      const wallet = await prisma.walletAgency.findUnique({
        where: { agencyId: agencyProfile.id },
      });
      if (!wallet || wallet.balance < amount) {
        return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
      }

      const [updatedWallet, transaction] = await prisma.$transaction([
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
            withdrawalMethod: method,
          },
        }),
      ]);

      emitEvent("withdrawal.requested", {
        userId, userName: session.user.name || "", userEmail: session.user.email || "",
        amount, method,
      }).catch(() => {});

      return NextResponse.json({ wallet: updatedWallet, transaction }, { status: 201 });
    }

    // Freelance
    const wallet = await prisma.walletFreelance.findUnique({
      where: { userId },
    });
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    const [updatedWallet, transaction] = await prisma.$transaction([
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
          withdrawalMethod: method,
        },
      }),
    ]);

    emitEvent("withdrawal.requested", {
      userId, userName: session.user.name || "", userEmail: session.user.email || "",
      amount, method,
    }).catch(() => {});

    return NextResponse.json({ wallet: updatedWallet, transaction }, { status: 201 });
  } catch (error) {
    console.error("[API /wallet POST]", error);
    return NextResponse.json({ error: "Erreur lors de la demande de retrait" }, { status: 500 });
  }
}
