import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { createAuditLog } from "@/lib/admin/audit";
import { notifyAdmins } from "@/lib/agents/notify";

/**
 * Agent ANTI-FRAUDE PAIEMENTS & RETRAITS.
 *
 * Surveille les retraits des dernières N heures et SIGNALE à l'admin
 * (e-mail + Telegram) les schémas suspects, par règles déterministes :
 *  - retrait d'un montant ≥ seuil sur un compte de moins de 7 jours ;
 *  - retrait d'un montant ≥ seuil sans identité vérifiée (KYC niveau 1).
 *
 * L'AGENT NE SUSPEND PLUS PERSONNE (décision fondateur du 2026-10-07). Il
 * suspendait automatiquement, et ses 5 suspensions reposaient TOUTES sur une
 * seule règle — « N tentatives de paiement échouées en 24 h » — alors que ces
 * échecs venaient surtout de NOS passerelles (FeexPay mal configurée, Wave
 * fermé, mode démo en production). Un vendeur s'est retrouvé bloqué au moment
 * de retirer ses gains. Cette règle est supprimée : un paiement échoué ne
 * prouve rien contre celui qui paie. Une suspension se décide désormais à
 * la main, dans l'admin, sur la base du signal.
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

    let decides = 0;

    for (const s of suspects.values()) {
      // Un SIGNAL pour l'admin, jamais une sanction : aucun changement de
      // statut, rien n'est envoyé à l'utilisateur. La clé de déduplication
      // limite l'alerte à une par compte et par jour.
      const a = await proposeAction({
        agentKey: "fraud_detection",
        type: "fraud_signal",
        risk: "low",
        title: `Signal anti-fraude à examiner`,
        reasoning: `Signaux : ${s.motifs.join(" · ")}. Aucune mesure automatique : à examiner par l'admin.`,
        targetType: "user",
        targetId: s.userId,
        payload: { auto: true, motifs: s.motifs },
        dedupeKey: `fraud_signal-${s.userId}-${new Date().toISOString().slice(0, 10)}`,
        execute: async () => {
          await createAuditLog({
            actorId: agentId, action: "fraud.signal",
            targetType: "user", targetId: s.userId, targetUserId: s.userId,
            details: { motifs: s.motifs, source: "fraud_detection" },
          }).catch(() => null);
          await notifyAdmins({
            subject: `Signal anti-fraude — compte ${s.userId.slice(0, 8)}`,
            body: `Signaux : ${s.motifs.join(" · ")}. Aucune mesure n'a été prise automatiquement : vérifiez le compte et décidez depuis /admin/utilisateurs.`,
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
      summary: `${suspects.size} compte(s) signalé(s) à l'admin · aucune suspension automatique`,
    };
  });
}
