import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initPayout, isMonerooConfigured, classifyMonerooError } from "@/lib/moneroo";
import {
  getPayoutMethod,
  normalizeMsisdn,
  resolveLegacyMethod,
  shortMethodLabel,
} from "@/lib/moneroo-payout-methods";
import { requireCronAuth } from "@/lib/cron/auth";
import { computeVendorBalance, computeMentorBalance } from "@/lib/formations/wallet-balance";

/**
 * GET /api/cron/auto-payout
 *
 * Cron Vercel — tourne toutes les 10 minutes.
 *
 * Auto-approuve et envoie les payouts Moneroo pour les retraits vendeurs/mentors
 * qui sont EN_ATTENTE depuis plus de AUTO_DELAY_MS (défaut 10 min) et qui n'ont
 * pas encore été envoyés à Moneroo (pas de paymentRef).
 *
 * Flow :
 *   1. Trouver les withdrawals EN_ATTENTE + pas de paymentRef + createdAt > delay
 *   2. Pour chacun : valider le solde, résoudre la méthode, initPayout Moneroo
 *   3. En cas de succès → stocker paymentRef (le webhook finalisera à TRAITE)
 *   4. En cas d'échec → marquer REFUSE avec message d'erreur
 *
 * L'admin peut toujours approuver manuellement avant le délai via le panel.
 */

export const maxDuration = 60; // Vercel Pro : jusqu'à 60s
export const dynamic = "force-dynamic";

// Délai avant auto-approbation (10 min par défaut, configurable via env)
const AUTO_DELAY_MS = Number(process.env.AUTO_PAYOUT_DELAY_MINUTES || 10) * 60 * 1000;

type AccountDetails = {
  msisdn?: string;
  phone?: string;
  phone_number?: string;
  _retryCount?: number;
};

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  // PayGenius = gateway unique. L'auto-payout Moneroo est désactivé par défaut :
  // les versements passent par l'approbation admin → PayGenius (un humain valide
  // chaque payout, plus sûr). Pour réactiver l'ancien auto-payout Moneroo,
  // poser explicitement MONEROO_AUTO_PAYOUT=true.
  if (process.env.MONEROO_AUTO_PAYOUT !== "true") {
    return NextResponse.json({
      skipped: true,
      reason: "Auto-payout Moneroo désactivé (PayGenius = gateway unique ; versements via approbation admin)",
    });
  }

  if (!isMonerooConfigured()) {
    return NextResponse.json({ skipped: true, reason: "MONEROO_SECRET_KEY non configurée" });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - AUTO_DELAY_MS);

  // Trouver les retraits éligibles à l'auto-payout
  const pending = await prisma.instructorWithdrawal.findMany({
    where: {
      status: "EN_ATTENTE",
      paymentRef: null, // pas encore envoyé à Moneroo
      createdAt: { lte: cutoff }, // créé il y a plus de X minutes
    },
    include: {
      instructeur: {
        include: { user: { select: { id: true, name: true, email: true, country: true } } },
      },
    },
    take: 20, // traiter max 20 par exécution pour rester dans le timeout
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0, message: "Aucun retrait à auto-payer" });
  }

  const results: Array<{ id: string; status: string; error?: string }> = [];

  for (const w of pending) {
    const isMentor = w.method.endsWith("_mentor");

    // ── Valider le solde disponible (source unique : wallet-balance) ──────
    // Mentor : solde calculé sur mentorBooking (les revenus mentor n'ont pas
    // d'instructeurId en base → introuvables via PlatformRevenue). Vendeur :
    // PlatformRevenue des 4 types vendables, scopé à la boutique du retrait.
    let availableForThis: number;
    if (isMentor) {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: w.instructeur.user.id },
        select: { id: true },
      });
      if (!mentorProfile) {
        await prisma.instructorWithdrawal.update({
          where: { id: w.id },
          data: { errorMessage: "Auto-payout : profil mentor introuvable" },
        }).catch(() => null);
        results.push({ id: w.id, status: "SKIP", error: "mentor_introuvable" });
        continue;
      }
      const bal = await computeMentorBalance(mentorProfile.id, w.instructeurId);
      // Exclure le retrait courant (déjà compté en EN_ATTENTE) du déjà-engagé.
      availableForThis = bal.netReleased - (bal.withdrawnPending + bal.withdrawnTreated - w.amount);
    } else {
      const bal = await computeVendorBalance(w.instructeurId, { shopId: w.shopId });
      availableForThis = bal.releasedNet - (bal.withdrawnPending + bal.withdrawnTreated - w.amount);
    }
    const available = Math.max(0, availableForThis);

    if (w.amount > available) {
      await prisma.instructorWithdrawal.update({
        where: { id: w.id },
        data: {
          status: "REFUSE",
          processedAt: now,
          refusedReason: `Auto-payout : solde insuffisant (disponible: ${Math.round(available)} FCFA, demandé: ${Math.round(w.amount)} FCFA)`,
        },
      }).catch(() => null);
      results.push({ id: w.id, status: "REFUSE", error: "solde_insuffisant" });
      continue;
    }

    // ── Résoudre la méthode Moneroo ──────────────────────────────────────
    const rawMethod = w.method.replace(/_mentor$/, "");
    const userCountry = w.instructeur.user.country ?? null;
    const resolvedMethod = getPayoutMethod(rawMethod)
      ? rawMethod
      : resolveLegacyMethod(rawMethod, userCountry) ?? rawMethod;
    const methodDef = getPayoutMethod(resolvedMethod);

    if (!methodDef) {
      await prisma.instructorWithdrawal.update({
        where: { id: w.id },
        data: { errorMessage: `Auto-payout : méthode "${rawMethod}" non reconnue` },
      }).catch(() => null);
      results.push({ id: w.id, status: "SKIP", error: `methode_inconnue:${rawMethod}` });
      continue;
    }

    // ── Construire le recipient ──────────────────────────────────────────
    const details = (w.accountDetails ?? {}) as AccountDetails;
    const recipient: Record<string, string> = {};
    const missing: string[] = [];

    for (const f of methodDef.requiredFields) {
      if (f === "msisdn") {
        const raw = details.msisdn ?? details.phone ?? details.phone_number;
        if (!raw || !String(raw).trim()) {
          missing.push("msisdn");
        } else {
          recipient.msisdn = normalizeMsisdn(String(raw), resolvedMethod);
        }
      } else {
        const val = (details as Record<string, unknown>)[f];
        if (!val || !String(val).trim()) {
          missing.push(f);
        } else {
          recipient[f] = String(val).trim();
        }
      }
    }

    if (missing.length > 0) {
      await prisma.instructorWithdrawal.update({
        where: { id: w.id },
        data: { errorMessage: `Auto-payout : champs manquants — ${missing.join(", ")}` },
      }).catch(() => null);
      results.push({ id: w.id, status: "SKIP", error: `champs_manquants:${missing.join(",")}` });
      continue;
    }

    // ── Envoyer le payout Moneroo ────────────────────────────────────────
    const fullName = (w.instructeur.user.name || w.instructeur.user.email || "Vendeur").trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || "Vendeur";
    const lastName = nameParts.slice(1).join(" ") || "Novakou";

    try {
      console.log(`[auto-payout] id=${w.id} amount=${Math.round(w.amount)} method=${resolvedMethod}`);
      const payoutData = await initPayout({
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
          role: isMentor ? "mentor" : "vendeur",
          userId: w.instructeur.user.id,
          auto: true,
        },
      });

      // Succès init → stocker paymentRef, le webhook confirmera
      await prisma.instructorWithdrawal.update({
        where: { id: w.id },
        data: {
          paymentRef: payoutData.id,
          paymentProvider: "moneroo",
          errorMessage: null,
        },
      });

      await prisma.notification.create({
        data: {
          userId: w.instructeur.user.id,
          type: "PAYMENT",
          title: "Retrait en cours",
          message: `Votre retrait de ${Math.round(w.amount)} FCFA via ${shortMethodLabel(resolvedMethod)} a été approuvé automatiquement et est en cours de traitement.`,
          link: isMentor ? "/mentor/finances" : "/wallet",
        },
      }).catch(() => null);

      results.push({ id: w.id, status: "SENT", });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[auto-payout:error] id=${w.id} error=${msg}`);
      const classified = classifyMonerooError(msg);

      await prisma.instructorWithdrawal.update({
        where: { id: w.id },
        data: {
          status: "REFUSE",
          processedAt: now,
          paymentProvider: "moneroo",
          errorMessage: msg.slice(0, 500),
          refusedReason: `Auto-payout : ${classified.userMessage}`,
        },
      }).catch(() => null);

      await prisma.notification.create({
        data: {
          userId: w.instructeur.user.id,
          type: "PAYMENT",
          title: "Retrait échoué",
          message: `Votre retrait de ${Math.round(w.amount)} FCFA n'a pas pu être traité automatiquement. ${classified.userMessage}`,
          link: isMentor ? "/mentor/finances" : "/wallet",
        },
      }).catch(() => null);

      results.push({ id: w.id, status: "REFUSE", error: classified.category });
    }
  }

  const sent = results.filter((r) => r.status === "SENT").length;
  const refused = results.filter((r) => r.status === "REFUSE").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log(`[auto-payout] done: ${sent} sent, ${refused} refused, ${skipped} skipped`);

  return NextResponse.json({
    processed: pending.length,
    sent,
    refused,
    skipped,
    results,
  });
}
