import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { isMonerooConfigured } from "@/lib/moneroo";
import {
  getPayoutMethod,
  normalizeMsisdn,
  shortMethodLabel,
} from "@/lib/moneroo-payout-methods";
import { sendWithdrawalPaidEmail, sendWithdrawalFailedEmail } from "@/lib/email/withdrawals";
import { executePayout } from "@/lib/payout/execute";
import { isFeexpayConfigured } from "@/lib/feexpay";
import { isFedapayConfigured } from "@/lib/fedapay";

type Params = { params: Promise<{ id: string }> };
type PayoutMode = "moneroo" | "manual";

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
 *   { action: "approve", mode?: "moneroo" | "manual" }  (défaut: moneroo)
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
    const mode: PayoutMode = String(body.mode ?? "").toLowerCase() === "manual" ? "manual" : "moneroo";

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
      await prisma.affiliateWithdrawal.update({
        where: { id },
        data: { status: "REFUSE", processedAt: new Date(), refusedReason },
      });
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
      await sendWithdrawalFailedEmail(w.affiliate?.user?.email, w.affiliate?.user?.name, w.amount, refusedReason, "/affilie/retraits");
      return NextResponse.json({ data: { id, status: "REFUSE", refusedReason } });
    }

    // ─── APPROVE ───────────────────────────────────────────────────────────────
    const details = (w.accountDetails ?? {}) as Record<string, string>;
    const fullName = (w.affiliate?.user?.name || w.affiliate?.user?.email || "Affilié").trim();
    const parts = fullName.split(/\s+/);
    const firstName = parts[0] || "Affilié";
    const lastName = parts.slice(1).join(" ") || "Novakou";
    const email = w.affiliate?.user?.email ?? "";

    // Mode manuel : versement hors plateforme → TRAITE + commissions PAID.
    const anyAutoProvider = isMonerooConfigured() || isFeexpayConfigured() || isFedapayConfigured();
    if (mode === "manual" || !anyAutoProvider) {
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
      await sendWithdrawalPaidEmail(w.affiliate?.user?.email, w.affiliate?.user?.name, w.amount, shortMethodLabel(w.method), "/affilie/retraits");
      return NextResponse.json({ data: { id, status: "TRAITE", mode: "manual" } });
    }

    // ─── Mode Moneroo : déclencher un vrai payout ──────────────────────────────
    const methodDef = getPayoutMethod(w.method);
    if (!methodDef) {
      return NextResponse.json({ error: `Méthode "${w.method}" inconnue dans le catalogue Moneroo.` }, { status: 400 });
    }

    const recipient: Record<string, string> = {};
    const missing: string[] = [];
    for (const fld of methodDef.requiredFields) {
      if (fld === "msisdn") {
        const raw = details.msisdn ?? details.phone;
        if (!raw || !String(raw).trim()) missing.push("msisdn (numéro Mobile Money)");
        else recipient.msisdn = normalizeMsisdn(String(raw), methodDef.id);
      } else {
        const val = details[fld];
        if (!val || !String(val).trim()) missing.push(fld);
        else recipient[fld] = String(val).trim();
      }
    }
    if (missing.length > 0) {
      return NextResponse.json({ error: `Coordonnées incomplètes : ${missing.join(", ")}` }, { status: 400 });
    }

    // ── VERSEMENT via orchestrateur : Moneroo → FeexPay → FedaPay ──────────────
    console.log(`[affiliate payout] id=${id} amount=${Math.round(w.amount)} method=${methodDef.id}`);
    const exec = await executePayout({
      method: methodDef.id,
      amount: Math.round(w.amount),
      msisdn: recipient.msisdn,
      customer: { email, firstName, lastName },
      description: `Retrait affilié Novakou - ${shortMethodLabel(methodDef.id)}`,
      withdrawalId: w.id,
    });

    if (!exec.ok) {
      if (exec.terminal === "ambiguous") {
        // Versement PEUT-ÊTRE parti → NE PAS libérer les commissions (sinon
        // l'affilié pourrait re-retirer le même montant) et NE PAS marquer REFUSE.
        await prisma.affiliateWithdrawal.update({
          where: { id },
          data: { errorMessage: exec.userMessage.slice(0, 500) },
        }).catch(() => null);
        console.error(`[affiliate payout:ambiguous] id=${id} ${exec.userMessage}`);
        return NextResponse.json(
          { error: exec.userMessage, code: "PAYOUT_AMBIGUOUS", attempts: exec.attempts },
          { status: 502 },
        );
      }
      // rejected / no_provider → REFUSE + libération des commissions réservées.
      await prisma.affiliateWithdrawal.update({
        where: { id },
        data: {
          status: "REFUSE",
          processedAt: new Date(),
          errorMessage: exec.userMessage.slice(0, 500),
          refusedReason: exec.userMessage.slice(0, 300),
        },
      }).catch(() => null);
      await releaseCommissions(id);
      console.error(`[affiliate payout:${exec.terminal}] id=${id} ${exec.userMessage}`);
      return NextResponse.json(
        { error: exec.userMessage, code: "PAYOUT_FAILED", terminal: exec.terminal, attempts: exec.attempts },
        { status: 502 },
      );
    }

    // Accepté : on garde EN_ATTENTE, le webhook du fournisseur confirmera
    // (TRAITE + commissions PAID + paidEarnings).
    await prisma.affiliateWithdrawal.update({
      where: { id },
      data: { paymentRef: exec.providerRef, paymentProvider: exec.provider, errorMessage: null },
    });
    console.log(`[affiliate payout:accepted] id=${id} provider=${exec.provider} ref=${exec.providerRef}`);
    await prisma.notification.create({
      data: {
        userId: w.userId,
        type: "PAYMENT",
        title: "Retrait en cours",
        message: `Votre retrait de ${Math.round(w.amount)} FCFA via ${shortMethodLabel(methodDef.id)} est en cours. Vous serez notifié dès réception.`,
        link: "/affilie/retraits",
      },
    }).catch(() => null);

    return NextResponse.json({
      data: { id, status: "EN_ATTENTE", provider: exec.provider, paymentRef: exec.providerRef, note: `Envoyé via ${exec.provider}. Le webhook confirmera le versement.` },
    });
  } catch (err) {
    console.error("[admin/affiliate-withdrawals PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
