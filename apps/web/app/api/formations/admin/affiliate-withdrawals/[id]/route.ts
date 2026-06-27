import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import {
  initPayout as initPayGeniusPayout,
  isPayGeniusConfigured,
  classifyPayGeniusError,
} from "@/lib/paygenius";
import {
  getPayGeniusPayoutMethod,
  normalizePayGeniusMsisdn,
  shortPayGeniusMethodLabel,
} from "@/lib/paygenius-payout-methods";

type Params = { params: Promise<{ id: string }> };
type PayoutMode = "paygenius" | "manual";

function isAdmin(session: { user?: { role?: string | null } } | null): boolean {
  const role = session?.user?.role?.toString().toUpperCase();
  return role === "ADMIN" || IS_DEV;
}

/** Libère les commissions réservées (redeviennent retirables). */
async function releaseCommissions(withdrawalId: string) {
  await prisma.affiliateCommission.updateMany({
    where: { withdrawalId },
    data: { withdrawalId: null },
  });
}

/**
 * PATCH /api/formations/admin/affiliate-withdrawals/[id]
 *   { action: "approve", mode?: "paygenius" | "manual" }
 *   { action: "reject", refusedReason: string }
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const action: string = body.action;
    const refusedReason: string = (body.refusedReason ?? "").trim();
    const mode: PayoutMode = String(body.mode ?? "").toLowerCase() === "manual" ? "manual" : "paygenius";

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Action invalide (approve | reject)." }, { status: 400 });
    }

    const w = await prisma.affiliateWithdrawal.findUnique({
      where: { id },
      include: { affiliate: { select: { user: { select: { name: true, email: true } } } } },
    });
    if (!w) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    if (w.status !== "EN_ATTENTE") {
      return NextResponse.json({ error: `Cette demande a déjà été traitée (${w.status}).` }, { status: 400 });
    }

    // ─── REJECT : refuser + libérer les commissions réservées ──────────────────
    if (action === "reject") {
      if (refusedReason.length < 5) {
        return NextResponse.json({ error: "Motif de refus requis (5 caractères min)." }, { status: 400 });
      }
      await prisma.$transaction([
        prisma.affiliateWithdrawal.update({
          where: { id },
          data: { status: "REFUSE", processedAt: new Date(), refusedReason },
        }),
      ]);
      await releaseCommissions(id);
      await prisma.notification.create({
        data: {
          userId: w.userId,
          type: "PAYMENT",
          title: "Retrait refusé",
          message: `Votre retrait de ${Math.round(w.amount)} FCFA a été refusé. Motif : ${refusedReason}. Vos gains restent disponibles.`,
          link: "/affilie/retraits",
        },
      }).catch(() => null);
      return NextResponse.json({ data: { id, status: "REFUSE", refusedReason } });
    }

    // ─── APPROVE ───────────────────────────────────────────────────────────────
    const details = (w.accountDetails ?? {}) as Record<string, string>;
    const name = (w.affiliate?.user?.name || w.affiliate?.user?.email || "Affilié").trim();
    const email = w.affiliate?.user?.email ?? "";

    // Mode manuel : versement hors plateforme → TRAITE + commissions PAID.
    if (mode === "manual" || !isPayGeniusConfigured()) {
      await prisma.$transaction([
        prisma.affiliateWithdrawal.update({
          where: { id },
          data: { status: "TRAITE", processedAt: new Date(), paymentProvider: "manual" },
        }),
        prisma.affiliateCommission.updateMany({
          where: { withdrawalId: id },
          data: { status: "PAID", paidAt: new Date(), payoutRef: w.payoutRef },
        }),
        prisma.affiliateProfile.update({
          where: { id: w.affiliateId },
          data: { paidEarnings: { increment: w.amount } },
        }),
      ]);
      await prisma.notification.create({
        data: {
          userId: w.userId,
          type: "PAYMENT",
          title: "Retrait versé ✅",
          message: `Votre retrait de ${Math.round(w.amount)} FCFA a été traité manuellement.`,
          link: "/affilie/retraits",
        },
      }).catch(() => null);
      return NextResponse.json({ data: { id, status: "TRAITE", mode: "manual" } });
    }

    // Mode PayGenius : déclencher un vrai payout.
    const methodDef = getPayGeniusPayoutMethod(w.method);
    if (!methodDef) {
      return NextResponse.json({ error: `Méthode "${w.method}" inconnue dans le catalogue PayGenius.` }, { status: 400 });
    }

    let account = "";
    let recipientPhone = details.msisdn || details.phone || "";
    if (methodDef.requiredFields.includes("msisdn")) {
      if (!recipientPhone) return NextResponse.json({ error: "Numéro Mobile Money manquant." }, { status: 400 });
      account = normalizePayGeniusMsisdn(String(recipientPhone), methodDef.id);
      recipientPhone = account;
    } else if (methodDef.requiredFields.includes("iban")) {
      const ibanRaw = details.iban || "";
      if (!ibanRaw.trim()) return NextResponse.json({ error: "IBAN manquant." }, { status: 400 });
      account = ibanRaw.trim().toUpperCase().replace(/\s/g, "");
    }

    let payoutRefId: string;
    try {
      console.log(`[affiliate paygenius:payout] id=${id} amount=${Math.round(w.amount)} method=${methodDef.id}`);
      const payoutData = await initPayGeniusPayout({
        amount: Math.round(w.amount),
        currency: "XOF",
        description: `Retrait affilié Novakou - ${shortPayGeniusMethodLabel(methodDef.id)}`,
        recipient: {
          name,
          phone: recipientPhone || normalizePayGeniusMsisdn("0000000000", methodDef.id),
          email,
        },
        destination: {
          type: methodDef.destinationType,
          provider: methodDef.destinationProvider,
          account,
        },
        metadata: { type: "affiliate_withdrawal", withdrawalId: w.id, affiliateId: w.affiliateId, userId: w.userId },
        idempotency_key: `affwd_${w.id}`,
      });
      payoutRefId = payoutData.reference;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[affiliate paygenius:payout:error] id=${id} error=${msg}`);
      const classified = classifyPayGeniusError(msg);
      await prisma.affiliateWithdrawal.update({
        where: { id },
        data: {
          status: "REFUSE",
          processedAt: new Date(),
          paymentProvider: "paygenius",
          errorMessage: msg.slice(0, 500),
          refusedReason: `PayGenius: ${classified.userMessage}`,
        },
      }).catch(() => null);
      await releaseCommissions(id);
      return NextResponse.json(
        { error: classified.userMessage, code: "PAYGENIUS_INIT_FAILED", category: classified.category },
        { status: 502 },
      );
    }

    // Succès de l'init : on garde EN_ATTENTE, le webhook confirmera (TRAITE + PAID).
    await prisma.affiliateWithdrawal.update({
      where: { id },
      data: { paymentRef: payoutRefId, paymentProvider: "paygenius", errorMessage: null },
    });
    await prisma.notification.create({
      data: {
        userId: w.userId,
        type: "PAYMENT",
        title: "Retrait en cours",
        message: `Votre retrait de ${Math.round(w.amount)} FCFA via ${shortPayGeniusMethodLabel(methodDef.id)} (PayGenius) est en cours. Vous serez notifié dès réception.`,
        link: "/affilie/retraits",
      },
    }).catch(() => null);

    return NextResponse.json({
      data: { id, status: "EN_ATTENTE", mode: "paygenius", paymentRef: payoutRefId, note: "Envoyé à PayGenius. Le webhook confirmera le versement." },
    });
  } catch (err) {
    console.error("[admin/affiliate-withdrawals PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
