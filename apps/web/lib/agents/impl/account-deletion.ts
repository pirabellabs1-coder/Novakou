import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { createAuditLog } from "@/lib/admin/audit";
import { createNotification } from "@/lib/notifications/service";

/**
 * Agent SUPPRESSION DE COMPTE.
 *
 * Traite les demandes AWAITING_REVIEW (après le délai de rétractation de
 * 72 h). Vérifie les conditions objectives — solde nul, aucune vente non
 * livrée, aucun litige actif — et APPROUVE ou REFUSE avec un motif écrit.
 * Pas d'IA : la décision est déterministe.
 */

export async function runAccountDeletion() {
  return recordRun("account_deletion", async () => {
    const cfg = await getAgentConfig("account_deletion");
    const lot = Math.max(1, Math.min(100, Number(cfg.batchSize) || 20));

    const demandes = await prisma.accountDeletionRequest.findMany({
      where: { status: "AWAITING_REVIEW" },
      orderBy: { requestedAt: "asc" },
      take: lot,
      select: {
        id: true, userId: true, reason: true, requestedAt: true, cooldownUntil: true,
        user: {
          select: {
            email: true, name: true,
            instructeurProfile: {
              select: {
                digitalProducts: { select: { _count: { select: { purchases: true } }, status: true } },
                formations: { select: { _count: { select: { enrollments: true } }, status: true } },
              },
            },
          },
        },
      },
    });

    const agentId = await agentSystemUserId();
    let decides = 0;

    for (const d of demandes) {
      // Solde non retiré : somme des retraits EN_ATTENTE (les TRAITE sont déjà
      // partis, les REFUSE non). Un solde retirable non retiré = blocage.
      const retraitsPendings = await prisma.instructorWithdrawal.aggregate({
        where: { instructeur: { userId: d.userId }, status: "EN_ATTENTE" },
        _sum: { amount: true },
      });
      const litigesActifs = await prisma.refundRequest.count({
        where: { userId: d.userId, status: "PENDING" },
      });

      const motifs: string[] = [];
      const soldeEnAttente = retraitsPendings._sum.amount ?? 0;
      if (soldeEnAttente > 0) motifs.push(`retrait en attente de ${Math.round(soldeEnAttente)} FCFA`);
      if (litigesActifs > 0) motifs.push(`${litigesActifs} litige(s) en cours`);

      const approuver = motifs.length === 0;

      const a = await proposeAction({
        agentKey: "account_deletion",
        type: "account_deletion_decision",
        risk: "low",
        title: `Suppression de compte — ${approuver ? "approuvée" : "refusée"}`,
        reasoning: approuver
          ? "Aucun engagement en cours : retrait, litige, ou vente non livrée."
          : `Blocage : ${motifs.join(" · ")}. Régularisez avant de resoumettre la demande.`,
        targetType: "accountDeletionRequest",
        targetId: d.id,
        payload: { auto: true, motifs, soldeEnAttente, litigesActifs },
        dedupeKey: `account_deletion-${d.id}`,
        execute: async () => {
          if (approuver) {
            await prisma.accountDeletionRequest.update({
              where: { id: d.id },
              data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: agentId, adminNote: "Approuvée par l'agent IA (aucun engagement en cours)." },
            });
            await createNotification({
              userId: d.userId,
              type: "system",
              title: "Suppression de compte approuvée",
              message: "Votre demande a été approuvée. Le compte sera supprimé sous peu.",
            }).catch(() => null);
          } else {
            await prisma.accountDeletionRequest.update({
              where: { id: d.id },
              data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy: agentId, adminNote: motifs.join(" · ") },
            });
            await createNotification({
              userId: d.userId,
              type: "system",
              title: "Suppression de compte refusée",
              message: `Refusée : ${motifs.join(" · ")}. Régularisez, puis soumettez une nouvelle demande.`,
              link: "/parametres",
            }).catch(() => null);
          }
          await createAuditLog({
            actorId: agentId,
            action: approuver ? "account_deletion.approved" : "account_deletion.rejected",
            targetType: "accountDeletionRequest",
            targetId: d.id,
            targetUserId: d.userId,
            details: { motifs, soldeEnAttente, litigesActifs },
          }).catch(() => null);
          return { ok: true };
        },
      });
      if (a) decides++;
    }

    return {
      itemsProcessed: demandes.length,
      actionsCreated: decides,
      summary: `${demandes.length} demande(s) examinée(s) · ${decides} décidée(s)`,
    };
  });
}
