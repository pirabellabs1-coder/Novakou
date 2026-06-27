import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import {
  initPayout as initMonerooPayout,
  isMonerooConfigured,
  classifyMonerooError,
} from "@/lib/moneroo";
import {
  getPayoutMethod,
  normalizeMsisdn,
  shortMethodLabel,
} from "@/lib/moneroo-payout-methods";

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
    if (mode === "manual" || !isMonerooConfigured()) {
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

    let payoutData;
    try {
      console.log(`[affiliate moneroo:payout] id=${id} amount=${Math.round(w.amount)} method=${methodDef.id}`);
      payoutData = await initMonerooPayout({
        amount: Math.round(w.amount),
        currency: methodDef.currency,
        description: `Retrait affilié Novakou - ${shortMethodLabel(methodDef.id)}`,
        customer: { email, first_name: firstName, last_name: lastName },
        method: methodDef.id,
        recipient,
        metadata: { type: "affiliate_withdrawal", withdrawalId: w.id, affiliateId: w.affiliateId, userId: w.userId },
        idempotencyKey: `affwd_${w.id}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[affiliate moneroo:payout:error] id=${id} error=${msg}`);
      const classified = classifyMonerooError(msg);
      await prisma.affiliateWithdrawal.update({
        where: { id },
        data: {
          status: "REFUSE",
          processedAt: new Date(),
          paymentProvider: "moneroo",
          errorMessage: msg.slice(0, 500),
          refusedReason: `Moneroo: ${classified.userMessage}`,
        },
      }).catch(() => null);
      await releaseCommissions(id);
      return NextResponse.json(
        { error: classified.userMessage, code: "MONEROO_INIT_FAILED", category: classified.category },
        { status: 502 },
      );
    }

    // Succès de l'init : on garde EN_ATTENTE, le webhook confirmera (TRAITE + PAID).
    await prisma.affiliateWithdrawal.update({
      where: { id },
      data: { paymentRef: payoutData.id, paymentProvider: "moneroo", errorMessage: null },
    });
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
      data: { id, status: "EN_ATTENTE", mode: "moneroo", paymentRef: payoutData.id, note: "Envoyé à Moneroo. Le webhook confirmera le versement." },
    });
  } catch (err) {
    console.error("[admin/affiliate-withdrawals PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, { status: 500 });
  }
}
