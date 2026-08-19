// Réconciliation d'un payout (mise à jour du retrait après confirmation du
// fournisseur), commune à FeexPay et FedaPay.
//
// Réplique fidèlement les transitions du webhook la passerelle (handlePayoutWebhook)
// pour les trois types de retrait — vendeur/mentor, affilié, commission
// plateforme — mais de façon agnostique du fournisseur. Le webhook la passerelle
// garde sa propre logique (non touchée) ; ce module sert aux webhooks
// feexpay/fedapay.
//
// SÛRETÉ : le statut passé ici doit venir d'une VÉRIFICATION AUTHENTIFIÉE
// (appel API status du fournisseur), pas du corps brut du webhook — pour qu'un
// webhook falsifié ne puisse jamais forcer un "success".

import { prisma } from "@/lib/prisma";
import { shortMethodLabel } from "@/lib/payments/payout-catalog";
import { sendWithdrawalPaidEmail, sendWithdrawalFailedEmail } from "@/lib/email/withdrawals";
import { alerterAdminsVersementReussi } from "@/lib/payout/alerte-admin";

export type ReconcileStatus = "success" | "failed" | "pending";

export type ReconcileResult = {
  matched: boolean;
  kind?: "vendor" | "affiliate" | "platform";
  applied?: "TRAITE" | "REFUSE" | "ignored";
};

/**
 * Retrouve le retrait par `paymentRef == providerRef` et applique la transition
 * correspondant au statut. `providerLabel` est un libellé humain ("FeexPay",
 * "FedaPay") utilisé dans les messages.
 */
export async function reconcilePayout(
  providerRef: string,
  status: ReconcileStatus,
  providerLabel: string,
): Promise<ReconcileResult> {
  // ── Retrait VENDEUR / MENTOR ────────────────────────────────────────────
  const w = await prisma.instructorWithdrawal.findFirst({
    where: { paymentRef: providerRef },
    include: { instructeur: { include: { user: { select: { id: true, email: true, name: true } } } } },
  });
  if (w) {
    const link = w.method.endsWith("_mentor") ? "/mentor/finances" : "/wallet";
    if (status === "success") {
      if (w.status !== "TRAITE") {
        await prisma.instructorWithdrawal.update({
          where: { id: w.id },
          data: { status: "TRAITE", processedAt: new Date(), errorMessage: null },
        });
        await prisma.notification.create({
          data: {
            userId: w.instructeur.user.id, type: "PAYMENT", title: "Retrait versé ✅",
            message: `Vos ${Math.round(w.amount)} FCFA viennent d'être envoyés via ${shortMethodLabel(w.method)}. Vérifiez votre compte.`,
            link,
          },
        }).catch(() => null);
        await sendWithdrawalPaidEmail(w.instructeur.user.email, w.instructeur.user.name, w.amount, shortMethodLabel(w.method), link);
        await alerterAdminsVersementReussi({
          amount: w.amount,
          qui: w.method.endsWith("_mentor") ? "mentor" : "vendeur",
          method: shortMethodLabel(w.method),
          provider: providerLabel,
          providerRef,
          beneficiaire: w.instructeur.user.email,
        });
      }
      return { matched: true, kind: "vendor", applied: "TRAITE" };
    }
    if (status === "failed") {
      // Idempotence + anti-régression : ne JAMAIS écraser un retrait déjà
      // TRAITE (webhook "failed" périmé arrivé après le "success"), et ne pas
      // re-notifier/re-mailer si déjà REFUSE (replay du webhook = spam).
      if (w.status !== "EN_ATTENTE") {
        return { matched: true, kind: "vendor", applied: "ignored" };
      }
      await prisma.instructorWithdrawal.update({
        where: { id: w.id },
        data: {
          status: "REFUSE", processedAt: new Date(),
          errorMessage: `${providerLabel} a rejeté le payout.`,
          refusedReason: `Échec du transfert ${providerLabel} — vérifiez vos coordonnées et réessayez.`,
        },
      });
      await prisma.notification.create({
        data: {
          userId: w.instructeur.user.id, type: "PAYMENT", title: "Retrait échoué",
          message: `Votre retrait de ${Math.round(w.amount)} FCFA n'a pas pu aboutir. Vérifiez vos coordonnées et créez une nouvelle demande.`,
          link,
        },
      }).catch(() => null);
      await sendWithdrawalFailedEmail(w.instructeur.user.email, w.instructeur.user.name, w.amount, `Le transfert ${providerLabel} a échoué.`, link);
      return { matched: true, kind: "vendor", applied: "REFUSE" };
    }
    return { matched: true, kind: "vendor", applied: "ignored" };
  }

  // ── Retrait AFFILIÉ ─────────────────────────────────────────────────────
  const aw = await prisma.affiliateWithdrawal.findFirst({
    where: { paymentRef: providerRef },
    include: { affiliate: { select: { user: { select: { email: true, name: true } } } } },
  });
  if (aw) {
    if (status === "success") {
      if (aw.status !== "TRAITE") {
        await prisma.$transaction([
          prisma.affiliateWithdrawal.update({
            where: { id: aw.id }, data: { status: "TRAITE", processedAt: new Date(), errorMessage: null },
          }),
          prisma.affiliateCommission.updateMany({
            where: { withdrawalId: aw.id }, data: { status: "PAID", paidAt: new Date(), payoutRef: aw.payoutRef },
          }),
          prisma.affiliateProfile.update({
            where: { id: aw.affiliateId }, data: { paidEarnings: { increment: aw.amount } },
          }),
        ]);
        await prisma.notification.create({
          data: {
            userId: aw.userId, type: "PAYMENT", title: "Retrait versé ✅",
            message: `Vos ${Math.round(aw.amount)} FCFA viennent d'être envoyés. Vérifiez votre compte.`,
            link: "/affilie/retraits",
          },
        }).catch(() => null);
        await sendWithdrawalPaidEmail(aw.affiliate?.user?.email, aw.affiliate?.user?.name, aw.amount, "Mobile Money", "/affilie/retraits");
        await alerterAdminsVersementReussi({
          amount: aw.amount,
          qui: "affilié",
          method: "Mobile Money",
          provider: providerLabel,
          providerRef,
          beneficiaire: aw.affiliate?.user?.email ?? null,
        });
      }
      return { matched: true, kind: "affiliate", applied: "TRAITE" };
    }
    if (status === "failed") {
      // Idempotence + anti-régression (cf. branche vendeur) : seul un retrait
      // encore EN_ATTENTE peut passer REFUSE ; jamais d'écrasement d'un TRAITE,
      // jamais de double libération/notification sur replay.
      if (aw.status !== "EN_ATTENTE") {
        return { matched: true, kind: "affiliate", applied: "ignored" };
      }
      await prisma.affiliateWithdrawal.update({
        where: { id: aw.id },
        data: {
          status: "REFUSE", processedAt: new Date(),
          errorMessage: `${providerLabel} a rejeté le payout.`,
          refusedReason: `Échec du transfert ${providerLabel} — vos gains restent disponibles.`,
        },
      });
      // Libère les commissions réservées → redeviennent retirables.
      await prisma.affiliateCommission.updateMany({ where: { withdrawalId: aw.id }, data: { withdrawalId: null } });
      await prisma.notification.create({
        data: {
          userId: aw.userId, type: "PAYMENT", title: "Retrait échoué",
          message: `Votre retrait de ${Math.round(aw.amount)} FCFA n'a pas pu aboutir. Vos gains restent disponibles.`,
          link: "/affilie/retraits",
        },
      }).catch(() => null);
      await sendWithdrawalFailedEmail(aw.affiliate?.user?.email, aw.affiliate?.user?.name, aw.amount, `Le transfert ${providerLabel} a échoué.`, "/affilie/retraits");
      return { matched: true, kind: "affiliate", applied: "REFUSE" };
    }
    return { matched: true, kind: "affiliate", applied: "ignored" };
  }

  // ── Retrait COMMISSION PLATEFORME ───────────────────────────────────────
  const pp = await prisma.platformPayout.findFirst({ where: { paymentRef: providerRef } });
  if (pp) {
    if (status === "success") {
      if (pp.status !== "TRAITE") {
        await prisma.platformPayout.update({ where: { id: pp.id }, data: { status: "TRAITE", processedAt: new Date(), errorMessage: null } });
        const admin = await prisma.user.findUnique({ where: { id: pp.adminUserId }, select: { email: true, name: true } }).catch(() => null);
        if (admin?.email) await sendWithdrawalPaidEmail(admin.email, admin.name, pp.amount, "Mobile Money", "/admin/retraits");
      }
      return { matched: true, kind: "platform", applied: "TRAITE" };
    }
    if (status === "failed") {
      // Idempotence + anti-régression (cf. branche vendeur).
      if (pp.status !== "EN_ATTENTE") {
        return { matched: true, kind: "platform", applied: "ignored" };
      }
      await prisma.platformPayout.update({ where: { id: pp.id }, data: { status: "REFUSE", processedAt: new Date(), errorMessage: `${providerLabel} a rejeté le payout.` } });
      const admin = await prisma.user.findUnique({ where: { id: pp.adminUserId }, select: { email: true, name: true } }).catch(() => null);
      if (admin?.email) await sendWithdrawalFailedEmail(admin.email, admin.name, pp.amount, `Le transfert ${providerLabel} a échoué.`, "/admin/retraits");
      return { matched: true, kind: "platform", applied: "REFUSE" };
    }
    return { matched: true, kind: "platform", applied: "ignored" };
  }

  return { matched: false };
}
