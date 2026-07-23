import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { isMonerooConfigured } from "@/lib/moneroo";
import {
  initPayout as initPayGeniusPayout,
  isPayGeniusConfigured,
  classifyPayGeniusError,
} from "@/lib/paygenius";
import {
  getPayoutMethod,
  normalizeMsisdn,
  resolveLegacyMethod,
  shortMethodLabel,
} from "@/lib/moneroo-payout-methods";
import { computeVendorBalance, computeMentorBalance } from "@/lib/formations/wallet-balance";
import { sendWithdrawalPaidEmail, sendWithdrawalFailedEmail } from "@/lib/email/withdrawals";
import {
  getPayGeniusPayoutMethod,
  normalizePayGeniusMsisdn,
  shortPayGeniusMethodLabel,
  resolvePayGeniusLegacyMethod,
} from "@/lib/paygenius-payout-methods";
import { executePayout } from "@/lib/payout/execute";
import { isFeexpayConfigured } from "@/lib/feexpay";
import { isFedapayConfigured } from "@/lib/fedapay";

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
 *   { action: "approve", mode?: "moneroo" | "paygenius" | "manual" }
 *     → "moneroo" (défaut) : payout via Moneroo
 *     → "paygenius"        : payout via PayGenius (wallet pré-financé requis)
 *     → "manual"           : virement hors plateforme, marque TRAITE direct
 *
 *   { action: "refuse", refusedReason: string } → REFUSE + motif
 *
 * Admin-only (role=ADMIN). En dev, bypass de la verif role.
 */
type PayoutMode = "moneroo" | "paygenius" | "manual";

function resolvePayoutMode(raw: unknown): PayoutMode {
  const v = String(raw ?? "").toLowerCase();
  if (v === "manual") return "manual";
  if (v === "paygenius") return "paygenius"; // GeniusPay retiré — toléré seulement si explicitement demandé
  // Moneroo = fournisseur de versement par défaut (GeniusPay retiré le 2026-06-27).
  return "moneroo";
}

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
    const mode: PayoutMode = resolvePayoutMode(body.mode);

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
      await sendWithdrawalFailedEmail(w.instructeur.user.email, w.instructeur.user.name, w.amount, reason, w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet");
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

    // ─── APPROVE : déclencher paiement réel via provider OU manuel ──────────
    if (action === "approve") {
      // Si aucun fournisseur automatique n'est configuré, on retombe en manuel.
      // Le mode "moneroo" (défaut) passe désormais par l'orchestrateur, qui
      // essaie Moneroo → FeexPay → FedaPay : il suffit qu'UN seul soit configuré.
      const anyAutoProvider = isMonerooConfigured() || isFeexpayConfigured() || isFedapayConfigured();
      const providerConfigured =
        mode === "paygenius" ? isPayGeniusConfigured() :
        mode === "manual" ? true :
        anyAutoProvider;

      if (mode === "manual" || !providerConfigured) {
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

        await sendWithdrawalPaidEmail(w.instructeur.user.email, w.instructeur.user.name, w.amount, shortMethodLabel(w.method.replace(/_mentor$/, "")), isMentor ? "/mentor/finances" : "/wallet");

        return NextResponse.json({ data: { id, status: "TRAITE", role, mode: "manual" } });
      }

      // Mode Moneroo OU PayGenius : déclencher un vrai payout.
      // Re-validation du solde via la SOURCE UNIQUE (wallet-balance) — évite de
      // payer si un remboursement est survenu depuis la demande, et calcule
      // correctement le solde mentor (via bookings, pas PlatformRevenue).
      let currentAvailable: number;
      if (isMentor) {
        const mentorProfile = await prisma.mentorProfile.findUnique({
          where: { userId: w.instructeur.user.id },
          select: { id: true },
        });
        if (!mentorProfile) {
          return NextResponse.json({ error: "Profil mentor introuvable." }, { status: 400 });
        }
        const mb = await computeMentorBalance(mentorProfile.id, w.instructeurId);
        currentAvailable = Math.max(0, mb.netReleased - (mb.withdrawnPending + mb.withdrawnTreated - w.amount));
      } else {
        const vb = await computeVendorBalance(w.instructeurId, { shopId: w.shopId });
        currentAvailable = Math.max(0, vb.releasedNet - (vb.withdrawnPending + vb.withdrawnTreated - w.amount));
      }
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
      const details = (w.accountDetails ?? {}) as AccountDetails;

      // Nom du bénéficiaire (commun aux deux providers)
      const fullName = (w.instructeur.user.name || w.instructeur.user.email || "Vendeur").trim();
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || "Vendeur";
      const lastName = nameParts.slice(1).join(" ") || "Novakou";

      const sharedMetadata = {
        type: "vendor_withdrawal",
        withdrawalId: w.id,
        instructeurId: w.instructeurId,
        role,
        userId: w.instructeur.user.id,
      };

      let payoutRefId: string;
      let methodLabelHumain: string;

      // ── BRANCH PAYGENIUS ───────────────────────────────────────────────
      if (mode === "paygenius") {
        // Résolution : si le vendeur a stocké un code générique ("orange_money",
        // "wave"…) ou un code Moneroo ("orange_ci"), on le convertit en code
        // PayGenius via le pays du vendeur.
        const pgMethodId =
          getPayGeniusPayoutMethod(rawMethod)?.id ??
          resolvePayGeniusLegacyMethod(rawMethod, userCountry);
        const methodDef = pgMethodId ? getPayGeniusPayoutMethod(pgMethodId) : undefined;
        if (!methodDef) {
          await prisma.instructorWithdrawal.update({
            where: { id },
            data: { errorMessage: `Méthode inconnue dans le catalogue PayGenius : ${rawMethod}` },
          }).catch(() => null);
          return NextResponse.json(
            {
              error: `Méthode "${rawMethod}" non supportée par PayGenius. Utilisez le versement manuel (mode=manual).`,
              code: "UNKNOWN_METHOD_PAYGENIUS",
            },
            { status: 400 },
          );
        }

        // Récupère le numéro / IBAN selon les champs requis
        const missing: string[] = [];
        let account = "";
        let recipientPhone = details.msisdn || details.phone || "";
        if (methodDef.requiredFields.includes("msisdn")) {
          if (!recipientPhone || !String(recipientPhone).trim()) {
            missing.push("msisdn (numéro Mobile Money)");
          } else {
            account = normalizePayGeniusMsisdn(String(recipientPhone), methodDef.id);
            recipientPhone = account; // PayGenius veut le même numéro côté recipient + destination
          }
        } else if (methodDef.requiredFields.includes("iban")) {
          const ibanRaw = details.iban || "";
          if (!ibanRaw.trim()) {
            missing.push("iban");
          } else {
            account = ibanRaw.trim().toUpperCase().replace(/\s/g, "");
            // pour bank_transfer, recipient.phone reste optionnel mais requis par l'API → on
            // utilise l'email du bénéficiaire comme contact si pas de phone
            if (!recipientPhone) recipientPhone = ""; // gérer plus bas
          }
        }
        if (missing.length > 0) {
          return NextResponse.json(
            { error: `Coordonnées incomplètes. Champs manquants : ${missing.join(", ")}` },
            { status: 400 },
          );
        }

        try {
          console.log(`[paygenius:payout] id=${id} amount=${Math.round(w.amount)} method=${methodDef.id}`);
          const payoutData = await initPayGeniusPayout({
            amount: Math.round(w.amount),
            currency: "XOF",
            description: `Retrait Novakou - ${shortPayGeniusMethodLabel(methodDef.id)}`,
            recipient: {
              name: `${firstName} ${lastName}`.trim(),
              phone: recipientPhone || normalizePayGeniusMsisdn("0000000000", methodDef.id),
              email: w.instructeur.user.email,
            },
            destination: {
              type: methodDef.destinationType,
              provider: methodDef.destinationProvider,
              account,
            },
            metadata: sharedMetadata,
            idempotency_key: `wd_${w.id}`,
          });
          payoutRefId = payoutData.reference; // on stocke la `reference` PYT-…
          methodLabelHumain = shortPayGeniusMethodLabel(methodDef.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[paygenius:payout:error] id=${id} amount=${Math.round(w.amount)} method=${methodDef.id} error=${msg}`);
          const classified = classifyPayGeniusError(msg);
          await prisma.instructorWithdrawal.update({
            where: { id },
            data: {
              status: "REFUSE",
              processedAt: new Date(),
              paymentProvider: "paygenius",
              errorMessage: msg.slice(0, 500),
              refusedReason: `PayGenius: ${classified.userMessage}`,
            },
          }).catch(() => null);
          return NextResponse.json(
            { error: classified.userMessage, code: "PAYGENIUS_INIT_FAILED", category: classified.category },
            { status: 502 },
          );
        }

        // Statut final via webhook (cashout.completed / payout.completed)
        await prisma.instructorWithdrawal.update({
          where: { id },
          data: {
            paymentRef: payoutRefId,
            paymentProvider: "paygenius",
            errorMessage: null,
          },
        });

        await prisma.notification.create({
          data: {
            userId: w.instructeur.user.id,
            type: "PAYMENT",
            title: "Retrait en cours",
            message: `Votre retrait de ${Math.round(w.amount)} FCFA via ${methodLabelHumain} (PayGenius) est en cours. Vous serez notifié quand les fonds arriveront.`,
            link: isMentor ? "/mentor/finances" : "/wallet",
          },
        }).catch(() => null);

        return NextResponse.json({
          data: {
            id,
            status: "EN_ATTENTE",
            role,
            mode: "paygenius",
            paymentRef: payoutRefId,
            note: "Envoyé à PayGenius. Le webhook confirmera le versement.",
          },
        });
      }

      // ── BRANCH MONEROO (par défaut) ─────────────────────────────────────
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
            error: `Méthode "${rawMethod}" non supportée par Moneroo. Utilisez mode=manual ou mode=paygenius selon votre besoin.`,
            code: "UNKNOWN_METHOD",
          },
          { status: 400 },
        );
      }

      // Construire le recipient selon les champs requis par la méthode
      const recipient: Record<string, string> = {};
      const missingMnr: string[] = [];
      for (const f of methodDef.requiredFields) {
        if (f === "msisdn") {
          const raw = details.msisdn ?? details.phone;
          if (!raw || !String(raw).trim()) {
            missingMnr.push("msisdn (numéro Mobile Money)");
          } else {
            recipient.msisdn = normalizeMsisdn(String(raw), resolvedMethod);
          }
        } else {
          const val = (details as Record<string, unknown>)[f];
          if (!val || !String(val).trim()) {
            missingMnr.push(f);
          } else {
            recipient[f] = String(val).trim();
          }
        }
      }
      if (missingMnr.length > 0) {
        return NextResponse.json(
          { error: `Coordonnées incomplètes. Champs manquants : ${missingMnr.join(", ")}` },
          { status: 400 },
        );
      }

      // ── VERSEMENT via orchestrateur : Moneroo → FeexPay → FedaPay ────────
      // Bascule automatique : si un fournisseur refuse (solde/IP/validation),
      // le MÊME versement est rejoué chez le suivant. Sur erreur ambiguë
      // (réseau/timeout) l'orchestrateur s'arrête sans REFUSE, pour éviter tout
      // double paiement (le retrait reste EN_ATTENTE + errorMessage à vérifier).
      console.log(`[payout] id=${id} amount=${Math.round(w.amount)} method=${resolvedMethod}`);
      const exec = await executePayout({
        method: resolvedMethod,
        amount: Math.round(w.amount),
        msisdn: recipient.msisdn,
        customer: { email: w.instructeur.user.email, firstName, lastName },
        description: `Retrait Novakou - ${shortMethodLabel(resolvedMethod)}`,
        withdrawalId: w.id,
      });

      if (!exec.ok) {
        if (exec.terminal === "ambiguous") {
          // Versement PEUT-ÊTRE pris → on garde EN_ATTENTE, pas de REFUSE.
          await prisma.instructorWithdrawal.update({
            where: { id },
            data: { errorMessage: exec.userMessage.slice(0, 500) },
          }).catch(() => null);
          console.error(`[payout:ambiguous] id=${id} ${exec.userMessage}`);
          return NextResponse.json(
            { error: exec.userMessage, code: "PAYOUT_AMBIGUOUS", attempts: exec.attempts },
            { status: 502 },
          );
        }
        // rejected (tous ont refusé) ou no_provider → REFUSE.
        await prisma.instructorWithdrawal.update({
          where: { id },
          data: {
            status: "REFUSE",
            processedAt: new Date(),
            errorMessage: exec.userMessage.slice(0, 500),
            refusedReason: exec.userMessage.slice(0, 300),
          },
        }).catch(() => null);
        console.error(`[payout:${exec.terminal}] id=${id} ${exec.userMessage}`);
        return NextResponse.json(
          { error: exec.userMessage, code: "PAYOUT_FAILED", terminal: exec.terminal, attempts: exec.attempts },
          { status: 502 },
        );
      }

      // Accepté par exec.provider. Statut final confirmé par le webhook du
      // fournisseur (sauf si déjà "success" au lancement).
      await prisma.instructorWithdrawal.update({
        where: { id },
        data: {
          paymentRef: exec.providerRef,
          paymentProvider: exec.provider,
          errorMessage: null,
          ...(exec.status === "success" ? { status: "TRAITE", processedAt: new Date() } : {}),
        },
      });
      console.log(`[payout:accepted] id=${id} provider=${exec.provider} ref=${exec.providerRef} status=${exec.status}`);

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
          status: exec.status === "success" ? "TRAITE" : "EN_ATTENTE",
          role,
          provider: exec.provider,
          paymentRef: exec.providerRef,
          note: `Envoyé via ${exec.provider}. Le webhook confirmera le versement.`,
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

    await sendWithdrawalFailedEmail(w.instructeur.user.email, w.instructeur.user.name, w.amount, refusedReason.trim(), isMentor ? "/mentor/finances" : "/wallet");

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
