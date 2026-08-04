// Auto-versement d'un retrait EN_ATTENTE (vendeur / mentor / affilié).
//
// Objectif : « validation auto » — dès qu'un retrait est demandé, on déclenche
// le versement réel via l'orchestrateur (FedaPay → FeexPay) sans
// étape d'approbation admin.
//
// ── Dégradations SÛRES (aucun blocage vendeur, aucun double paiement) ──
//   • Aucun fournisseur configuré / opérateur non routable / méthode non
//     automatisable / coordonnées incomplètes → on LAISSE EN_ATTENTE (l'admin
//     versera manuellement). On ne refuse jamais pour un problème de config.
//   • Refus provider (solde/IP/validation) → REFUSE (le solde est re-crédité
//     automatiquement car les REFUSE ne comptent pas dans le « déjà retiré »).
//   • Erreur ambiguë (réseau/timeout) → EN_ATTENTE + errorMessage (vérif admin),
//     jamais de REFUSE (le versement est peut-être parti → éviter le doublon).

import { prisma } from "@/lib/prisma";
import { executePayout } from "@/lib/payout/execute";
import {
  getPayoutMethod,
  normalizeMsisdn,
  resolveLegacyMethod,
  shortMethodLabel,
} from "@/lib/payments/payout-catalog";
import { computeVendorBalance, computeMentorBalance } from "@/lib/formations/wallet-balance";
import { isFeexpayConfigured } from "@/lib/feexpay";
import { isFedapayConfigured } from "@/lib/fedapay";

export type AutoPayoutResult =
  | { status: "SENT"; provider: string; paymentRef: string }   // accepté, webhook confirmera
  | { status: "PAID"; provider: string; paymentRef: string }   // déjà confirmé "success"
  | { status: "PENDING_MANUAL"; reason: string }               // laissé EN_ATTENTE → admin
  | { status: "PENDING_REVIEW"; reason: string }               // ambigu → vérif admin
  | { status: "REFUSED"; reason: string };                     // refusé → solde re-crédité

async function anyAutoProviderConfigured(): Promise<boolean> {
  const [fx, fd] = await Promise.all([isFeexpayConfigured(), isFedapayConfigured()]);
  return fx || fd;
}

async function notify(userId: string, title: string, message: string, link: string) {
  await prisma.notification
    .create({ data: { userId, type: "PAYMENT", title, message: message.slice(0, 300), link } })
    .catch(() => null);
}

/**
 * Auto-verse un InstructorWithdrawal EN_ATTENTE (vendeur ou mentor).
 * Idempotent : ne fait rien si déjà traité ou déjà envoyé (paymentRef présent).
 */
export async function processInstructorWithdrawalAuto(withdrawalId: string): Promise<AutoPayoutResult> {
  const w = await prisma.instructorWithdrawal.findUnique({
    where: { id: withdrawalId },
    include: {
      instructeur: { include: { user: { select: { id: true, name: true, email: true, country: true } } } },
    },
  });
  if (!w) return { status: "REFUSED", reason: "Retrait introuvable" };
  if (w.status !== "EN_ATTENTE" || w.paymentRef) {
    return { status: "SENT", provider: w.paymentProvider ?? "?", paymentRef: w.paymentRef ?? "" };
  }

  const isMentor = w.method.endsWith("_mentor");
  const link = isMentor ? "/mentor/finances" : "/wallet";
  const uid = w.instructeur.user.id;

  // Aucun fournisseur auto → laisser EN_ATTENTE (versement manuel admin).
  if (!(await anyAutoProviderConfigured())) {
    await notify(uid, "Demande de retrait enregistrée", `Votre retrait de ${Math.round(w.amount)} FCFA est en cours de traitement (24-48h ouvrées).`, link);
    return { status: "PENDING_MANUAL", reason: "Aucun fournisseur de versement configuré" };
  }

  // Re-valider le solde (source unique), en excluant le retrait courant du déjà-engagé.
  let available: number;
  if (isMentor) {
    const mp = await prisma.mentorProfile.findUnique({ where: { userId: uid }, select: { id: true } });
    if (!mp) {
      await markInstructorRefused(w.id, uid, isMentor, w.amount, "Profil mentor introuvable");
      return { status: "REFUSED", reason: "Profil mentor introuvable" };
    }
    const mb = await computeMentorBalance(mp.id, w.instructeurId);
    available = Math.max(0, mb.netReleased - (mb.withdrawnPending + mb.withdrawnTreated - w.amount));
  } else {
    const vb = await computeVendorBalance(w.instructeurId, { shopId: w.shopId });
    available = Math.max(0, vb.releasedNet - (vb.withdrawnPending + vb.withdrawnTreated - w.amount));
  }
  if (w.amount > available) {
    await markInstructorRefused(w.id, uid, isMentor, w.amount, `Solde insuffisant (disponible: ${Math.round(available)} FCFA)`);
    return { status: "REFUSED", reason: "Solde insuffisant" };
  }

  // Résoudre méthode + recipient.
  const rawMethod = w.method.replace(/_mentor$/, "");
  const userCountry = w.instructeur.user.country ?? null;
  const resolvedMethod = getPayoutMethod(rawMethod)
    ? rawMethod
    : resolveLegacyMethod(rawMethod, userCountry) ?? rawMethod;
  const methodDef = getPayoutMethod(resolvedMethod);
  if (!methodDef) {
    await prisma.instructorWithdrawal
      .update({ where: { id: w.id }, data: { errorMessage: `Méthode "${rawMethod}" non automatisable — versement manuel requis` } })
      .catch(() => null);
    await notify(uid, "Demande de retrait enregistrée", `Votre retrait de ${Math.round(w.amount)} FCFA est en cours de traitement (24-48h ouvrées).`, link);
    return { status: "PENDING_MANUAL", reason: `Méthode ${rawMethod} non automatisable` };
  }

  const details = (w.accountDetails ?? {}) as Record<string, unknown>;
  const recipient: Record<string, string> = {};
  const missing: string[] = [];
  for (const f of methodDef.requiredFields) {
    if (f === "msisdn") {
      const raw = details.msisdn ?? details.phone ?? details.phone_number;
      if (!raw || !String(raw).trim()) missing.push("msisdn");
      else recipient.msisdn = normalizeMsisdn(String(raw), resolvedMethod);
    } else {
      const val = details[f];
      if (!val || !String(val).trim()) missing.push(f);
      else recipient[f] = String(val).trim();
    }
  }
  if (missing.length > 0) {
    await prisma.instructorWithdrawal
      .update({ where: { id: w.id }, data: { errorMessage: `Coordonnées incomplètes : ${missing.join(", ")}` } })
      .catch(() => null);
    await notify(uid, "Demande de retrait enregistrée", `Votre retrait de ${Math.round(w.amount)} FCFA est en cours de traitement (24-48h ouvrées).`, link);
    return { status: "PENDING_MANUAL", reason: `Coordonnées incomplètes : ${missing.join(", ")}` };
  }

  const fullName = (w.instructeur.user.name || w.instructeur.user.email || "Vendeur").trim();
  const parts = fullName.split(/\s+/);
  const firstName = parts[0] || "Vendeur";
  const lastName = parts.slice(1).join(" ") || "Novakou";

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
      await prisma.instructorWithdrawal
        .update({ where: { id: w.id }, data: { errorMessage: exec.userMessage.slice(0, 500) } })
        .catch(() => null);
      await notify(uid, "Retrait en cours de vérification", `Votre retrait de ${Math.round(w.amount)} FCFA est en cours de vérification. Vous serez notifié sous peu.`, link);
      return { status: "PENDING_REVIEW", reason: exec.userMessage };
    }
    if (exec.terminal === "no_provider") {
      // Configuré mais opérateur non routable → laisser EN_ATTENTE (admin manuel).
      await prisma.instructorWithdrawal
        .update({ where: { id: w.id }, data: { errorMessage: exec.userMessage.slice(0, 500) } })
        .catch(() => null);
      await notify(uid, "Demande de retrait enregistrée", `Votre retrait de ${Math.round(w.amount)} FCFA est en cours de traitement (24-48h ouvrées).`, link);
      return { status: "PENDING_MANUAL", reason: exec.userMessage };
    }
    await markInstructorRefused(w.id, uid, isMentor, w.amount, exec.userMessage);
    return { status: "REFUSED", reason: exec.userMessage };
  }

  await prisma.instructorWithdrawal.update({
    where: { id: w.id },
    data: {
      paymentRef: exec.providerRef,
      paymentProvider: exec.provider,
      errorMessage: null,
      ...(exec.status === "success" ? { status: "TRAITE", processedAt: new Date() } : {}),
    },
  });
  await notify(uid, "Retrait en cours", `Votre retrait de ${Math.round(w.amount)} FCFA via ${shortMethodLabel(resolvedMethod)} est en cours de traitement. Vous serez notifié dès réception des fonds.`, link);

  return exec.status === "success"
    ? { status: "PAID", provider: exec.provider, paymentRef: exec.providerRef }
    : { status: "SENT", provider: exec.provider, paymentRef: exec.providerRef };
}

async function markInstructorRefused(id: string, userId: string, isMentor: boolean, amount: number, reason: string) {
  await prisma.instructorWithdrawal
    .update({
      where: { id },
      data: { status: "REFUSE", processedAt: new Date(), refusedReason: reason.slice(0, 300), errorMessage: reason.slice(0, 500) },
    })
    .catch(() => null);
  await notify(
    userId,
    "Retrait échoué",
    `Votre retrait de ${Math.round(amount)} FCFA n'a pas pu être traité. ${reason} Votre solde reste disponible.`,
    isMentor ? "/mentor/finances" : "/wallet",
  );
}

/**
 * Auto-verse un AffiliateWithdrawal EN_ATTENTE.
 * Idempotent. Sur refus → REFUSE + libère les commissions réservées.
 */
export async function processAffiliateWithdrawalAuto(withdrawalId: string): Promise<AutoPayoutResult> {
  const w = await prisma.affiliateWithdrawal.findUnique({
    where: { id: withdrawalId },
    include: { affiliate: { select: { user: { select: { name: true, email: true } } } } },
  });
  if (!w) return { status: "REFUSED", reason: "Retrait introuvable" };
  if (w.status !== "EN_ATTENTE" || w.paymentRef) {
    return { status: "SENT", provider: w.paymentProvider ?? "?", paymentRef: w.paymentRef ?? "" };
  }

  if (!anyAutoProviderConfigured()) {
    await notify(w.userId, "Demande de retrait enregistrée", `Votre retrait de ${Math.round(w.amount)} FCFA est en attente de versement (24-48h ouvrées).`, "/affilie/retraits");
    return { status: "PENDING_MANUAL", reason: "Aucun fournisseur de versement configuré" };
  }

  const methodDef = getPayoutMethod(w.method);
  if (!methodDef) {
    await notify(w.userId, "Demande de retrait enregistrée", `Votre retrait de ${Math.round(w.amount)} FCFA est en attente de versement.`, "/affilie/retraits");
    return { status: "PENDING_MANUAL", reason: `Méthode ${w.method} non automatisable` };
  }

  const details = (w.accountDetails ?? {}) as Record<string, string>;
  const recipient: Record<string, string> = {};
  const missing: string[] = [];
  for (const f of methodDef.requiredFields) {
    if (f === "msisdn") {
      const raw = details.msisdn ?? details.phone;
      if (!raw || !String(raw).trim()) missing.push("msisdn");
      else recipient.msisdn = normalizeMsisdn(String(raw), methodDef.id);
    } else {
      const val = details[f];
      if (!val || !String(val).trim()) missing.push(f);
      else recipient[f] = String(val).trim();
    }
  }
  if (missing.length > 0) {
    await notify(w.userId, "Demande de retrait enregistrée", `Votre retrait de ${Math.round(w.amount)} FCFA est en attente de versement.`, "/affilie/retraits");
    return { status: "PENDING_MANUAL", reason: `Coordonnées incomplètes : ${missing.join(", ")}` };
  }

  const fullName = (w.affiliate?.user?.name || w.affiliate?.user?.email || "Affilié").trim();
  const parts = fullName.split(/\s+/);
  const firstName = parts[0] || "Affilié";
  const lastName = parts.slice(1).join(" ") || "Novakou";
  const email = w.affiliate?.user?.email ?? "";

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
      await prisma.affiliateWithdrawal
        .update({ where: { id: w.id }, data: { errorMessage: exec.userMessage.slice(0, 500) } })
        .catch(() => null);
      await notify(w.userId, "Retrait en cours de vérification", `Votre retrait de ${Math.round(w.amount)} FCFA est en cours de vérification.`, "/affilie/retraits");
      return { status: "PENDING_REVIEW", reason: exec.userMessage };
    }
    if (exec.terminal === "no_provider") {
      await prisma.affiliateWithdrawal
        .update({ where: { id: w.id }, data: { errorMessage: exec.userMessage.slice(0, 500) } })
        .catch(() => null);
      await notify(w.userId, "Demande de retrait enregistrée", `Votre retrait de ${Math.round(w.amount)} FCFA est en attente de versement.`, "/affilie/retraits");
      return { status: "PENDING_MANUAL", reason: exec.userMessage };
    }
    // rejected → REFUSE + libérer les commissions réservées.
    await prisma.affiliateWithdrawal
      .update({
        where: { id: w.id },
        data: { status: "REFUSE", processedAt: new Date(), errorMessage: exec.userMessage.slice(0, 500), refusedReason: exec.userMessage.slice(0, 300) },
      })
      .catch(() => null);
    await prisma.affiliateCommission.updateMany({ where: { withdrawalId: w.id }, data: { withdrawalId: null } });
    await notify(w.userId, "Retrait échoué", `Votre retrait de ${Math.round(w.amount)} FCFA n'a pas pu être traité. ${exec.userMessage} Vos gains restent disponibles.`, "/affilie/retraits");
    return { status: "REFUSED", reason: exec.userMessage };
  }

  await prisma.affiliateWithdrawal.update({
    where: { id: w.id },
    data: { paymentRef: exec.providerRef, paymentProvider: exec.provider, errorMessage: null },
  });
  await notify(w.userId, "Retrait en cours", `Votre retrait de ${Math.round(w.amount)} FCFA via ${shortMethodLabel(methodDef.id)} est en cours. Vous serez notifié dès réception.`, "/affilie/retraits");
  return { status: "SENT", provider: exec.provider, paymentRef: exec.providerRef };
}
