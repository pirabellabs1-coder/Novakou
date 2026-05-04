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

/**
 * Initiates a real payout via PayGenius or Moneroo after the DB transaction.
 * Updates the walletTransaction status based on the gateway response.
 *
 * For MOBILE_MONEY: calls PayGenius (primary) or Moneroo (fallback).
 * For SEPA/PAYPAL/WISE: logs for manual admin processing (no gateway yet).
 */
async function initiateGatewayPayout(
  transactionId: string,
  amount: number,
  method: string,
  user: { id: string; name: string | null; email: string },
  payoutDetails?: string,
): Promise<{ initiated: boolean; provider?: string; reference?: string; error?: string }> {
  // Only MOBILE_MONEY has automated gateway support currently
  if (method !== "MOBILE_MONEY") {
    // SEPA, PAYPAL, WISE, CRYPTO — require manual admin processing
    console.log(
      `[withdrawal] ${method} payout for transaction ${transactionId} requires manual admin processing`,
    );
    return { initiated: false, provider: "manual", error: "Méthode nécessitant un traitement manuel par l'admin" };
  }

  // Extract phone number from details (expected format: "provider:phone" e.g. "wave:+221771234567")
  const phone = payoutDetails?.includes(":") ? payoutDetails.split(":")[1]?.trim() : payoutDetails?.trim();
  const providerHint = payoutDetails?.includes(":") ? payoutDetails.split(":")[0]?.trim().toLowerCase() : "";

  if (!phone) {
    console.warn(`[withdrawal] No phone number in details for transaction ${transactionId}`);
    return { initiated: false, error: "Numéro de téléphone requis pour Mobile Money" };
  }

  const [first, ...rest] = (user.name ?? user.email.split("@")[0]).split(" ");
  const last = rest.join(" ") || first;

  // Try PayGenius first (primary payout provider)
  const { isPayGeniusConfigured } = await import("@/lib/paygenius");
  if (isPayGeniusConfigured()) {
    try {
      const { initPayout } = await import("@/lib/paygenius");
      const { resolvePayGeniusLegacyMethod, normalizePayGeniusMsisdn } = await import("@/lib/paygenius-payout-methods");

      // Resolve provider (wave, orange_money, mtn, etc.) to a PayGenius method ID
      const userCountry = (await prisma.user.findUnique({
        where: { id: user.id },
        select: { country: true },
      }))?.country ?? "CI";

      const methodId = resolvePayGeniusLegacyMethod(providerHint || "wave", userCountry);
      const normalizedPhone = normalizePayGeniusMsisdn(phone, methodId ?? undefined);

      const result = await initPayout({
        amount,
        currency: "XOF",
        description: `Retrait Novakou #${transactionId.slice(0, 8)}`,
        recipient: {
          name: `${first} ${last}`.trim(),
          phone: normalizedPhone,
          email: user.email,
        },
        destination: {
          type: "mobile_money",
          provider: providerHint || "wave",
          account: normalizedPhone,
        },
        metadata: { transactionId, userId: user.id },
        idempotency_key: transactionId,
      });

      // Update transaction with provider reference
      await prisma.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: "PAYOUT_PROCESSING",
          payoutProvider: "paygenius",
          payoutReference: result.reference,
        } as Record<string, unknown>,
      }).catch((e) => console.warn("[withdrawal] update payoutRef:", e));

      console.log(
        `[withdrawal] PayGenius payout initiated: ref=${result.reference}, status=${result.status}, amount=${amount} XOF`,
      );
      return { initiated: true, provider: "paygenius", reference: result.reference };
    } catch (err) {
      console.error("[withdrawal] PayGenius payout failed:", err);
      // Fall through to Moneroo
    }
  }

  // Fallback: Moneroo
  const { isMonerooConfigured } = await import("@/lib/moneroo");
  if (isMonerooConfigured()) {
    try {
      const { initPayout } = await import("@/lib/moneroo");

      // Moneroo wants phone WITHOUT "+" prefix
      const monerooPhone = phone.startsWith("+") ? phone.slice(1) : phone;

      // Map provider hint to Moneroo method code
      const MONEROO_METHOD_MAP: Record<string, string> = {
        wave: "wave_ci", orange_money: "orange_ci", orange: "orange_ci",
        mtn: "mtn_ci", moov: "moov_ci",
      };
      const monerooMethod = MONEROO_METHOD_MAP[providerHint] ?? "wave_ci";

      const result = await initPayout({
        amount,
        currency: "XOF",
        description: `Retrait Novakou #${transactionId.slice(0, 8)}`,
        customer: {
          email: user.email,
          first_name: first || "Vendeur",
          last_name: last || "Novakou",
          phone: monerooPhone,
        },
        method: monerooMethod,
        recipient: { msisdn: monerooPhone },
        metadata: { transactionId, userId: user.id },
      });

      // Update transaction with provider reference
      await prisma.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: "PAYOUT_PROCESSING",
          payoutProvider: "moneroo",
          payoutReference: result.id,
        } as Record<string, unknown>,
      }).catch((e) => console.warn("[withdrawal] update payoutRef:", e));

      console.log(
        `[withdrawal] Moneroo payout initiated: id=${result.id}, status=${result.status}, amount=${amount} XOF`,
      );
      return { initiated: true, provider: "moneroo", reference: result.id };
    } catch (err) {
      console.error("[withdrawal] Moneroo payout failed:", err);
    }
  }

  // No gateway available — mark for manual processing
  console.warn(`[withdrawal] No payout gateway configured — transaction ${transactionId} stays WALLET_PENDING`);
  return { initiated: false, error: "Aucun provider de payout configuré" };
}

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

      const agencyWallet = await prisma.walletAgency.findUnique({ where: { agencyId: agencyProfile.id } });
      if (!agencyWallet) {
        return NextResponse.json({ error: "Portefeuille agence introuvable" }, { status: 404 });
      }

      const transaction = await prisma.$transaction(async (tx) => {
        const freshWallet = await tx.walletAgency.findUnique({ where: { id: agencyWallet.id } });
        if (!freshWallet || freshWallet.balance < amount) {
          throw new Error("INSUFFICIENT_BALANCE");
        }
        await tx.walletAgency.update({
          where: { id: agencyWallet.id },
          data: { balance: { decrement: amount } },
        });
        return tx.walletTransaction.create({
          data: {
            agencyWalletId: agencyWallet.id,
            type: "WITHDRAWAL",
            amount: -amount,
            description: `Retrait vers ${method}${details ? ` - ${String(details).slice(0, 200)}` : ""}`,
            status: "WALLET_PENDING",
            withdrawalMethod: method as "SEPA" | "MOBILE_MONEY" | "PAYPAL" | "WISE" | "CRYPTO",
          },
        });
      }).catch((err) => {
        if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") return null;
        throw err;
      });

      if (!transaction) {
        return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
      }

      // Initiate actual gateway payout (async, non-blocking)
      const payoutResult = await initiateGatewayPayout(
        transaction.id, amount, method,
        { id: userId, name: session.user.name, email: session.user.email || "" },
        details,
      );

      recordFailedAttempt(rateLimitKey);

      emitEvent("withdrawal.requested", {
        userId, userName: session.user.name || "", userEmail: session.user.email || "",
        amount, method,
      }).catch(() => {});

      return NextResponse.json({
        transaction,
        payout: {
          initiated: payoutResult.initiated,
          provider: payoutResult.provider,
          reference: payoutResult.reference,
        },
      }, { status: 201 });
    }

    // Freelance — balance check + deduction inside a single interactive transaction
    const wallet = await prisma.walletFreelance.findUnique({ where: { userId } });
    if (!wallet) {
      return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const freshWallet = await tx.walletFreelance.findUnique({ where: { id: wallet.id } });
      if (!freshWallet || freshWallet.balance < amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
      await tx.walletFreelance.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
      return tx.walletTransaction.create({
        data: {
          freelanceWalletId: wallet.id,
          type: "WITHDRAWAL",
          amount: -amount,
          description: `Retrait vers ${method}${details ? ` - ${String(details).slice(0, 200)}` : ""}`,
          status: "WALLET_PENDING",
          withdrawalMethod: method as "SEPA" | "MOBILE_MONEY" | "PAYPAL" | "WISE" | "CRYPTO",
        },
      });
    }).catch((err) => {
      if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") return null;
      throw err;
    });

    if (!transaction) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    // Initiate actual gateway payout
    const payoutResult = await initiateGatewayPayout(
      transaction.id, amount, method,
      { id: userId, name: session.user.name, email: session.user.email || "" },
      details,
    );

    recordFailedAttempt(rateLimitKey);

    emitEvent("withdrawal.requested", {
      userId, userName: session.user.name || "", userEmail: session.user.email || "",
      amount, method,
    }).catch(() => {});

    return NextResponse.json({
      transaction,
      payout: {
        initiated: payoutResult.initiated,
        provider: payoutResult.provider,
        reference: payoutResult.reference,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[API /finances/withdrawal POST]", error);
    return NextResponse.json({ error: "Erreur lors de la demande de retrait" }, { status: 500 });
  }
}
