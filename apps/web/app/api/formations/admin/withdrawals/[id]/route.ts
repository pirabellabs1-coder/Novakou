import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { initPayout, isMonerooConfigured } from "@/lib/moneroo";
import { getPayoutMethod, resolveLegacyMethod, shortMethodLabel } from "@/lib/moneroo-payout-methods";

type Params = { params: Promise<{ id: string }> };

type AccountDetails = {
  phone?: string;
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

    if (action !== "approve" && action !== "refuse") {
      return NextResponse.json({ error: "Action invalide (approve | refuse)." }, { status: 400 });
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
    if (w.status !== "EN_ATTENTE") {
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

      // Valider que les champs requis sont presents
      const details = (w.accountDetails ?? {}) as AccountDetails;
      const methodDetails: Record<string, string> = {};
      const missing: string[] = [];
      for (const f of methodDef.requiredFields) {
        const val = details[f];
        if (!val || !String(val).trim()) {
          missing.push(f);
        } else {
          methodDetails[f] = String(val).trim();
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
          method_details: methodDetails,
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
        await prisma.instructorWithdrawal.update({
          where: { id },
          data: {
            paymentProvider: "moneroo",
            errorMessage: msg.slice(0, 500),
          },
        }).catch(() => null);
        return NextResponse.json(
          {
            error: `Moneroo payout initialization failed: ${msg}`,
            code: "MONEROO_INIT_FAILED",
          },
          { status: 502 },
        );
      }

      // Statut initial : Moneroo renvoie souvent "pending" ou "processing"
      // On marque TRAITE seulement si "success" d'emblée, sinon on laisse
      // EN_ATTENTE en attendant le webhook.
      const isImmediateSuccess = payoutData.status === "success";
      const newStatus = isImmediateSuccess ? "TRAITE" : "EN_ATTENTE";
      await prisma.instructorWithdrawal.update({
        where: { id },
        data: {
          status: newStatus,
          paymentRef: payoutData.id,
          paymentProvider: "moneroo",
          processedAt: isImmediateSuccess ? new Date() : null,
          errorMessage: null,
        },
      });

      // Notif
      await prisma.notification.create({
        data: {
          userId: w.instructeur.user.id,
          type: "PAYMENT",
          title: isImmediateSuccess ? "Retrait versé" : "Retrait en cours",
          message: isImmediateSuccess
            ? `Vos ${Math.round(w.amount)} FCFA ont été envoyés via ${shortMethodLabel(resolvedMethod)}.`
            : `Votre retrait de ${Math.round(w.amount)} FCFA est en cours de traitement par Moneroo. Vous serez notifié quand il sera versé.`,
          link: isMentor ? "/mentor/finances" : "/wallet",
        },
      }).catch(() => null);

      return NextResponse.json({
        data: {
          id,
          status: newStatus,
          role,
          mode: "moneroo",
          monerooStatus: payoutData.status,
          paymentRef: payoutData.id,
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
