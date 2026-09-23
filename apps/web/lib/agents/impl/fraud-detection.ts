import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { createAuditLog } from "@/lib/admin/audit";
import { createNotification } from "@/lib/notifications/service";
import { notifyAdmins } from "@/lib/agents/notify";

/**
 * Agent ANTI-FRAUDE PAIEMENTS & RETRAITS.
 *
 * Surveille CheckoutAttempt et InstructorWithdrawal des dernières N heures.
 * Détecte les schémas suspects par RÈGLES (déterministes, auditables) :
 *  - Compte-relais : compte créé il y a peu, encaissement immédiat, retrait
 *    demandé aussitôt.
 *  - Multiples tentatives de paiement en échec par un même acheteur.
 *  - Retrait d'un montant > seuil sur un compte KYC niveau 1.
 *
 * En cas de signal, SUSPEND le compte (statut User.status → SUSPENDU,
 * RÉVERSIBLE par l'admin), notifie l'utilisateur avec un motif, et alerte
 * l'admin par e-mail + Telegram.
 */

type Suspect = { userId: string; motifs: string[] };

export async function runFraudDetection() {
  return recordRun("fraud_detection", async () => {
    const cfg = await getAgentConfig("fraud_detection");
    const heures = Math.max(1, Number(cfg.fenetreHeures) || 24);
    const seuilRetraitCompteNeuf = Math.max(1000, Number(cfg.seuilRetraitCompteNeufFcfa) || 100000);
    const agentId = await agentSystemUserId();

    const depuis = new Date(Date.now() - heures * 3600_000);
    const compteNeufSeuil = new Date(Date.now() - 7 * 86400_000);

    const suspects = new Map<string, Suspect>();
    const ajouter = (userId: string, motif: string) => {
      const s = suspects.get(userId) ?? { userId, motifs: [] };
      if (!s.motifs.includes(motif)) s.motifs.push(motif);
      suspects.set(userId, s);
    };

    // Règle 1 : retrait ≥ seuil sur un compte de moins de 7 jours OU KYC niveau 1.
    const retraits = await prisma.instructorWithdrawal.findMany({
      where: { status: "EN_ATTENTE", createdAt: { gte: depuis }, amount: { gte: seuilRetraitCompteNeuf } },
      select: { amount: true, instructeur: { select: { user: { select: { id: true, createdAt: true, kyc: true, status: true } } } } },
    });
    for (const r of retraits) {
      const u = r.instructeur?.user;
      if (!u || u.status !== "ACTIF") continue;
      const jeune = u.createdAt >= compteNeufSeuil;
      const kycFaible = (u.kyc ?? 1) < 2;
      if (jeune) ajouter(u.id, `retrait de ${Math.round(r.amount)} FCFA sur un compte créé il y a moins de 7 jours`);
      if (kycFaible) ajouter(u.id, `retrait de ${Math.round(r.amount)} FCFA sans identité vérifiée (KYC niveau ${u.kyc ?? 1})`);
    }

    // Règle 2 : ≥ 4 échecs de paiement du même acheteur (email ou userId) sur la fenêtre.
    const echecs = await prisma.checkoutAttempt.groupBy({
      by: ["userId"],
      where: { status: "FAILED", createdAt: { gte: depuis }, userId: { not: null } },
      _count: { _all: true },
    });
    for (const e of echecs) {
      if ((e._count._all ?? 0) < 4 || !e.userId) continue;
      const u = await prisma.user.findUnique({ where: { id: e.userId }, select: { id: true, status: true } });
      if (!u || u.status !== "ACTIF") continue;
      ajouter(u.id, `${e._count._all} tentatives de paiement échouées en ${heures} h`);
    }

    let decides = 0;

    for (const s of suspects.values()) {
      const a = await proposeAction({
        agentKey: "fraud_detection",
        type: "user_suspended",
        risk: "low",
        title: `Compte suspendu — schéma suspect détecté`,
        reasoning: `Signaux : ${s.motifs.join(" · ")}. La suspension est RÉVERSIBLE : l'admin peut réactiver le compte via /admin/utilisateurs.`,
        targetType: "user",
        targetId: s.userId,
        payload: { auto: true, motifs: s.motifs },
        dedupeKey: `fraud_detection-${s.userId}-${new Date().toISOString().slice(0, 10)}`,
        execute: async () => {
          await prisma.user.update({
            where: { id: s.userId },
            data: { status: "SUSPENDU", suspendReason: `Suspension automatique par l'agent anti-fraude — ${s.motifs.join(" · ")}` },
          });
          await createNotification({
            userId: s.userId, type: "system", title: "Compte temporairement suspendu",
            message: `Votre compte a été suspendu à la suite d'une détection automatique (${s.motifs.join(" · ")}). Notre équipe examine votre situation — contactez le support si vous pensez qu'il s'agit d'une erreur.`,
            link: "/aide",
          }).catch(() => null);
          await createAuditLog({
            actorId: agentId, action: "user.suspended",
            targetType: "user", targetId: s.userId, targetUserId: s.userId,
            details: { motifs: s.motifs, source: "fraud_detection" },
          }).catch(() => null);
          await notifyAdmins({
            subject: `Compte suspendu (anti-fraude) — ${s.userId.slice(0, 8)}`,
            body: `L'agent anti-fraude a suspendu automatiquement un compte. Signaux : ${s.motifs.join(" · ")}. Suspension RÉVERSIBLE via /admin/utilisateurs.`,
            url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com"}/admin/utilisateurs`,
          }).catch(() => null);
          return { ok: true };
        },
      });
      if (a) decides++;
    }

    return {
      itemsProcessed: suspects.size,
      actionsCreated: decides,
      summary: `${suspects.size} compte(s) suspect(s) · ${decides} suspendu(s) (réversible)`,
    };
  });
}
