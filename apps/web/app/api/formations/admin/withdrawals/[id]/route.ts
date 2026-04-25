import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { initPayout, isMonerooConfigured, classifyMonerooError } from "@/lib/moneroo";
import {
  getPayoutMethod,
  normalizeMsisdn,
  resolveLegacyMethod,
  shortMethodLabel,
} from "@/lib/moneroo-payout-methods";

type Params = { params: Promise<{ id: string }> };

type AccountDetails = {
  // Nouveau format Moneroo : msisdn (digits only, international, sans +)
  msisdn?: string;
  // Legacy : certains comptes vendeurs ont stocké "phone" avant la migration
  phone?: string;
  // Legacy bancaire (non supporté en payout Moneroo)
  iban?: string;
  bic?: string;
  bank_name?: string;
  account_holder?: string;
  email?: string;
};

/**
 * PATCH /api/formations/admin/withdrawals/[id]
 *
 * Body :
 *   { action: "approve", mode?: "moneroo" | "manual" }
 *     → "moneroo" (défaut) : déclenche un vrai payout via Moneroo et passe
 *       à TRAITE si Moneroo renvoie success immédiatement, sinon laisse
 *       EN_ATTENTE (le webhook finira le job). Si Moneroo échoue à init, la
 *       demande reste EN_ATTENTE avec errorMessage rempli.
 *     → "manual" : l'admin fait le virement hors plateforme et marque
 *       simplement la demande comme TRAITE (ancien comportement).
 *
 *   { action: "refuse", refusedReason: string } → REFUSE + motif
 *
 * Admin-only (role=ADMIN). En dev, bypass de la verif role.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || (sessionRole !== "ADMIN" && !IS_DEV)) {
      return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action: string = body.action;
    const refusedReason: string = body.refusedReason ?? "";
    const mode: "moneroo" | "manual" = body.mode === "manual" ? "manual" : "moneroo";

    if (!["approve", "refuse", "retry", "reject"].includes(action)) {
      return NextResponse.json({ error: "Action invalide (approve | refuse | retry | reject)." }, { status: 400 });
    }

    const w = await prisma.instructorWithdrawal.findUnique({
      where: { id },
      include: {
        instructeur: {
          include: { user: { select: { id: true, name: true, email: true, country: true } } },
        },
      },
    });

    if (!w) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    // ─── REJECT : refuser manuellement un retrait EN_ATTENTE sans appeler Moneroo ─
    if (action === "reject") {
      if (w.status !== "EN_ATTENTE") {
        return NextResponse.json({ error: `Seuls les retraits EN_ATTENTE peuvent être refusés (actuel: ${w.status}).` }, { status: 400 });
      }
      const reason = (refusedReason || "Refusé manuellement par l'admin").trim();
      await prisma.instructorWithdrawal.update({
        where: { id },
        data: { status: "REFUSE", processedAt: new Date(), refusedReason: reason },
      });
      await prisma.notification.create({
        data: {
          userId: w.instructeur.user.id,
          type: "PAYMENT",
          title: "Retrait refusé",
          message: `Votre demande de retrait de ${Math.round(w.amount)} FCFA a été refusée. Motif : ${reason}`,
          link: w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet",
        },
      }).catch(() => null);
      return NextResponse.json({ data: { id, status: "REFUSE", refusedReason: reason } });
    }

    // ─── RETRY : relancer un retrait REFUSE ────────────────────────────────────
    if (action === "retry") {
      if (w.status !== "REFUSE") {
        return NextResponse.json({ error: `Seuls les retraits REFUSE peuvent être relancés (actuel: ${w.status}).` }, { status: 400 });
      }
      // Parse retryCount from accountDetails JSON
      const details = (w.accountDetails ?? {}) as Record<string, unknown>;
      const retryCount = typeof details._retryCount === "number" ? details._retryCount : 0;
      if (retryCount >= 3) {
        return NextResponse.json({ error: "Limite de 3 tentatives atteinte. Contactez le support Moneroo.", retryCount }, { status: 400 });
      }
      // Reset to EN_ATTENTE and increment retryCount
      await prisma.instructorWithdrawal.update({
        where: { id },
        data: {
          status: "EN_ATTENTE",
          processedAt: null,
          errorMessage: null,
          refusedReason: null,
          paymentRef: null,
          accountDetails: { ...details, _retryCount: retryCount + 1 },
        },
      });
      // Fall through to the approve logic below (action is "retry" but we treat it as approve)
    }

    if (action !== "approve" && action !== "retry") {
      // Only approve and retry reach the payout logic
    }

    if (action === "approve" && w.status !== "EN_ATTENTE") {
      return NextResponse.json(
        { error: `Cette demande a déjà été traitée (${w.status}).` },
        { status: 400 },
      );
    }

    const isMentor = w.method.endsWith("_mentor");
    const role = isMentor ? "mentor" : "vendeur";

    // ─── APPROVE : déclencher paiement réel via Moneroo OU manuel ──────────
    if (action === "approve") {
      if (mode === "manual" || !isMonerooConfigured()) {
        // Mode manuel (ancien comportement) : l'admin vire hors plateforme
        await prisma.instructorWithdrawal.update({
          where: { id },
          data: {
            status: "TRAITE",
            processedAt: new Date(),
            paymentProvider: "manual",
          },
        });

        await prisma.notification.create({
          data: {
            userId: w.instructeur.user.id,
            type: "PAYMENT",
            title: "Retrait approuvé",
            message: `Votre retrait de ${Math.round(w.amount)} FCFA a été traité manuellement.`,
            link: isMentor ? "/mentor/finances" : "/wallet",
          },
        }).catch(() => null);

        return NextResponse.json({ data: { id, status: "TRAITE", role, mode: "manual" } });
      }

      // Mode Moneroo : déclencher un vrai payout
      // Re-validate balance before payout (prevent negative balance if refund happened since request)
      const revenueRows = await prisma.platformRevenue.findMany({
        where: { instructeurId: w.instructeurId, orderType: { in: ["formation", "product"] } },
        select: { vendorAmount: true, createdAt: true },
      });
      const HOLD_MS = 24 * 3_600_000;
      const nowMs = Date.now();
      let netReleased = 0;
      for (const r of revenueRows) {
        if (nowMs - new Date(r.createdAt).getTime() >= HOLD_MS) netReleased += r.vendorAmount;
      }
      const allWithdrawals = await prisma.instructorWithdrawal.aggregate({
        where: {
          instructeurId: w.instructeurId,
          NOT: isMentor ? undefined : { method: { endsWith: "_mentor" } },
          ...(isMentor ? { method: { endsWith: "_mentor" } } : {}),
          status: { in: ["EN_ATTENTE", "TRAITE"] },
          id: { not: id }, // exclude current withdrawal from calculation
        },
        _sum: { amount: true },
      });
      const currentAvailable = Math.max(0, netReleased - (allWithdrawals._sum.amount ?? 0));
      if (w.amount > currentAvailable) {
        await prisma.instructorWithdrawal.update({
          where: { id },
          data: { status: "REFUSE", processedAt: new Date(), refusedReason: `Solde insuffisant au moment du payout (disponible: ${Math.round(currentAvailable)} FCFA, demandé: ${Math.round(w.amount)} FCFA)` },
        }).catch(() => null);
        return NextResponse.json(
          { error: `Solde insuffisant. Disponible : ${Math.round(currentAvailable)} FCFA. Le retrait a été refusé automatiquement.` },
          { status: 400 }
        );
      }

      // On retire le suffixe _mentor pour obtenir le vrai method code
      const rawMethod = w.method.replace(/_mentor$/, "");
      const userCountry = w.instructeur.user.country ?? null;
      // Si le vendeur a enregistré "orange_money" (legacy), on le résout selon le pays
      const resolvedMethod = getPayoutMethod(rawMethod)
        ? rawMethod
        : resolveLegacyMethod(rawMethod, userCountry) ?? rawMethod;
      const methodDef = getPayoutMethod(resolvedMethod);

      if (!methodDef) {
        await prisma.instructorWithdrawal.update({
          where: { id },
          data: {
            errorMessage: `Méthode inconnue dans le catalogue Moneroo : ${rawMethod}`,
          },
        }).catch(() => null);
        return NextResponse.json(
          {
            error: `Méthode "${rawMethod}" non supportée par Moneroo. Utilisez mode=manual ou corrigez la méthode enregistrée.`,
            code: "UNKNOWN_METHOD",
          },
          { status: 400 },
        );
      }

      // Construire le recipient selon les champs requis par la méthode
      const details = (w.accountDetails ?? {}) as AccountDetails;
      const recipient: Record<string, string> = {};
      const missing: string[] = [];
      for (const f of methodDef.requiredFields) {
        if (f === "msisdn") {
          // Accepte msisdn direct OU phone legacy (on normalise)
          const raw = details.msisdn ?? details.phone;
          if (!raw || !String(raw).trim()) {
            missing.push("msisdn (numéro Mobile Money)");
          } else {
            recipient.msisdn = normalizeMsisdn(String(raw));
          }
        } else {
          // account_number ou autre
          const val = (details as Record<string, unknown>)[f];
          if (!val || !String(val).trim()) {
            missing.push(f);
          } else {
            recipient[f] = String(val).trim();
          }
        }
      }
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Coordonnées incomplètes. Champs manquants : ${missing.join(", ")}` },
          { status: 400 },
        );
      }

      // Nom du bénéficiaire
      const fullName = (w.instructeur.user.name || w.instructeur.user.email || "Vendeur").trim();
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || "Vendeur";
      const lastName = nameParts.slice(1).join(" ") || "Novakou";

      let payoutData;
      try {
        console.log(`[moneroo:payout] id=${id} amount=${Math.round(w.amount)} currency=${methodDef.currency} method=${resolvedMethod}`);
        payoutData = await initPayout({
          amount: Math.round(w.amount),
          currency: methodDef.currency,
          description: `Retrait Novakou - ${shortMethodLabel(resolvedMethod)}`,
          customer: {
            email: w.instructeur.user.email,
            first_name: firstName,
            last_name: lastName,
          },
          method: resolvedMethod,
          recipient,
          metadata: {
            type: "vendor_withdrawal",
            withdrawalId: w.id,
            instructeurId: w.instructeurId,
            role,
            userId: w.instructeur.user.id,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[moneroo:payout:error] id=${id} amount=${Math.round(w.amount)} currency=${methodDef.currency} method=${resolvedMethod} error=${msg}`);
        const classified = classifyMonerooError(msg);
        await prisma.instructorWithdrawal.update({
          where: { id },
          data: {
            status: "REFUSE",
            processedAt: new Date(),
            paymentProvider: "moneroo",
            errorMessage: msg.slice(0, 500),
            refusedReason: `Moneroo: ${classified.userMessage}`,
          },
        }).catch(() => null);
        return NextResponse.json(
          {
            error: classified.userMessage,
            code: "MONEROO_INIT_FAILED",
            category: classified.category,
          },
          { status: 502 },
        );
      }

      // Moneroo : la réponse à /payouts/initialize ne contient que { id }.
      // Le statut final arrive via webhook (payout.initiated / success / failed).
      // On reste en EN_ATTENTE tant que le webhook n'a pas confirmé.
      await prisma.instructorWithdrawal.update({
        where: { id },
        data: {
          paymentRef: payoutData.id,
          paymentProvider: "moneroo",
          errorMessage: null,
          // status reste EN_ATTENTE — sera mis à TRAITE par le webhook
        },
      });

      // Notif : le paiement est en cours
      await prisma.notification.create({
        data: {
          userId: w.instructeur.user.id,
          type: "PAYMENT",
          title: "Retrait en cours",
          message: `Votre retrait de ${Math.round(w.amount)} FCFA via ${shortMethodLabel(resolvedMethod)} est en cours de traitement. Vous serez notifié quand les fonds arriveront sur votre compte.`,
          link: isMentor ? "/mentor/finances" : "/wallet",
        },
      }).catch(() => null);

      return NextResponse.json({
        data: {
          id,
          status: "EN_ATTENTE",
          role,
          mode: "moneroo",
          paymentRef: payoutData.id,
          note: "Envoyé à Moneroo. Le webhook confirmera le versement.",
        },
      });
    }

    // ─── REFUSE ────────────────────────────────────────────────────────────
    if (!refusedReason || typeof refusedReason !== "string" || refusedReason.trim().length < 5) {
      return NextResponse.json(
        { error: "Un motif de refus est requis (5 caractères minimum)." },
        { status: 400 },
      );
    }

    await prisma.instructorWithdrawal.update({
      where: { id },
      data: {
        status: "REFUSE",
        processedAt: new Date(),
        refusedReason: refusedReason.trim(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: w.instructeur.user.id,
        type: "PAYMENT",
        title: "Retrait refusé",
        message: `Votre demande de retrait a été refusée. Motif : ${refusedReason.trim()}`,
        link: isMentor ? "/mentor/finances" : "/wallet",
      },
    }).catch(() => null);

    return NextResponse.json({
      data: { id, status: "REFUSE", role, refusedReason: refusedReason.trim() },
    });
  } catch (err) {
    console.error("[admin/withdrawals PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
