import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { createAuditLog } from "@/lib/admin/audit";
import { createNotification } from "@/lib/notifications/service";
import { notifyAdmins } from "@/lib/agents/notify";
import { chatIA, estOpenRouterConfigure } from "@/lib/ai/openrouter";

/**
 * Agent RÉSOLUTION DES LITIGES (remboursements).
 *
 * Lit RefundRequest.status = "PENDING". Sous le plafond configurable
 * (par défaut 25 000 FCFA), l'agent DÉCIDE — rembourse ou refuse — avec un
 * motif écrit. Au-dessus, il ne décide pas et alerte l'admin (Telegram +
 * e-mail) : c'est trop d'argent pour un jugement en aveugle.
 *
 * L'exécution du remboursement effectif (versement passerelle) reste hors
 * scope de l'agent — il pose seulement le verdict sur RefundRequest.status
 * (APPROVED / REJECTED) qu'un cron de versement séparé traite. Consistant
 * avec le comportement historique où l'admin ne faisait qu'approuver.
 */

type Verdict = { decision: "REMBOURSE" | "REFUSE"; motif: string };

function extraireJson(t: string): Verdict | null {
  try {
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as Partial<Verdict>;
    if (j.decision !== "REMBOURSE" && j.decision !== "REFUSE") return null;
    if (!j.motif || typeof j.motif !== "string" || j.motif.trim().length < 10) return null;
    return { decision: j.decision, motif: j.motif.trim() };
  } catch { return null; }
}

export async function runDisputeResolution() {
  return recordRun("dispute_resolution", async () => {
    const cfg = await getAgentConfig("dispute_resolution");
    const plafondAuto = Math.max(0, Number(cfg.plafondAutoFcfa) || 25000);
    const lot = Math.max(1, Math.min(100, Number(cfg.batchSize) || 10));
    const consignes = String(cfg.instructions || "").trim();
    const agentId = await agentSystemUserId();
    const iaOk = estOpenRouterConfigure();

    const demandes = await prisma.refundRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: lot,
      select: {
        id: true, userId: true, enrollmentId: true, amount: true, reason: true, createdAt: true,
        user: { select: { email: true, name: true, createdAt: true } },
        enrollment: {
          select: {
            createdAt: true, completedAt: true,
            formation: { select: { title: true, instructeur: { select: { userId: true } } } },
          },
        },
      },
    });

    let decides = 0;
    let escalades = 0;
    let indetermines = 0;
    const DEBUT = Date.now();
    const BUDGET_MS = 220_000;

    for (const d of demandes) {
      if (Date.now() - DEBUT > BUDGET_MS) break;

      // Au-dessus du plafond : escalade sans décider.
      if (d.amount > plafondAuto) {
        const a = await proposeAction({
          agentKey: "dispute_resolution",
          type: "dispute_escalated",
          risk: "low",
          title: `Litige escaladé — ${Math.round(d.amount)} FCFA sur « ${d.enrollment?.formation?.title?.slice(0, 40) ?? "?"} »`,
          reasoning: `Montant ${Math.round(d.amount)} FCFA supérieur au plafond d'auto-décision (${plafondAuto} FCFA). Escalade admin.`,
          targetType: "refundRequest",
          targetId: d.id,
          payload: { auto: true, escalade: true, amount: d.amount },
          dedupeKey: `dispute_resolution-escalade-${d.id}`,
          execute: async () => {
            await notifyAdmins({
              subject: `Litige à examiner — ${Math.round(d.amount)} FCFA`,
              body: `Un remboursement de ${Math.round(d.amount)} FCFA est demandé (> plafond auto ${plafondAuto} FCFA). Motif client : ${d.reason.slice(0, 300)}`,
              url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com"}/admin/signalements/refunds/${d.id}`,
            }).catch(() => null);
            return { ok: true, escalade: true };
          },
        });
        if (a) escalades++;
        continue;
      }

      // Sous le plafond : l'agent décide via IA (avec contexte objectif).
      let verdict: Verdict | null = null;
      if (iaOk) {
        // Nombre de litiges déjà ouverts par cet acheteur (habitué du remboursement = signal).
        const litigesPasses = await prisma.refundRequest.count({
          where: { userId: d.userId, id: { not: d.id }, createdAt: { lt: d.createdAt } },
        });
        const ageInscription = Math.floor((d.createdAt.getTime() - d.user.createdAt.getTime()) / 86400_000);
        const ageAchat = d.enrollment?.createdAt
          ? Math.floor((d.createdAt.getTime() - d.enrollment.createdAt.getTime()) / 86400_000)
          : null;
        const acheve = !!d.enrollment?.completedAt;

        const systeme = [
          "Tu es l'agent de résolution des litiges de Novakou.",
          "Décision autonome et FINALE (personne ne relit).",
          "",
          `Plafond appliqué : ${plafondAuto} FCFA. Ce dossier est de ${Math.round(d.amount)} FCFA.`,
          "",
          "Rembourse (REMBOURSE) SI :",
          "  - Le fichier acheté n'a pas été livré ou n'est pas conforme à ce qui est annoncé (motif explicite du client).",
          "  - L'achat est très récent (< 3 jours) et le contenu N'A PAS été consommé (formation non achevée).",
          "  - L'acheteur n'a jamais ouvert de litige avant et le motif est plausible.",
          "",
          "Refuse (REFUSE) SI :",
          "  - Le contenu a été consommé/achevé — la personne a eu la valeur du produit.",
          "  - L'acheteur a déjà obtenu plusieurs remboursements (schéma d'abus).",
          "  - Le motif est manifestement infondé ou vide.",
          "",
          "Le motif de ta décision est ENVOYÉ à l'acheteur — sois clair, respectueux, et actionnable.",
          consignes ? `\nConsignes : ${consignes}` : "",
          "",
          'Réponds STRICTEMENT en JSON : {"decision":"REMBOURSE"|"REFUSE","motif":"phrase claire en français"}',
        ].join("\n");

        try {
          const rep = await chatIA({
            messages: [
              { role: "system", content: systeme },
              {
                role: "user",
                content: `Formation : « ${d.enrollment?.formation?.title ?? "?"} ». Montant : ${Math.round(d.amount)} FCFA.
Motif du client : """${d.reason.slice(0, 800)}"""

Contexte :
- Litiges déjà ouverts par cet acheteur : ${litigesPasses}
- Inscription client il y a ${ageInscription} j
- Achat il y a ${ageAchat ?? "?"} j
- Formation achevée : ${acheve ? "oui" : "non"}`,
              },
            ],
            maxTokens: 300, temperature: 0.2, json: true, timeoutMs: 25_000,
          });
          verdict = extraireJson(rep.texte);
        } catch (e) {
          console.warn("[dispute-resolution]", e instanceof Error ? e.message : e);
        }
      }
      if (!verdict) { indetermines++; continue; }

      const rembourse = verdict.decision === "REMBOURSE";
      const a = await proposeAction({
        agentKey: "dispute_resolution",
        type: "dispute_decision",
        risk: "low",
        title: `Litige ${rembourse ? "remboursé" : "refusé"} — ${Math.round(d.amount)} FCFA`,
        reasoning: verdict.motif,
        targetType: "refundRequest",
        targetId: d.id,
        payload: { auto: true, decision: verdict.decision, amount: d.amount },
        dedupeKey: `dispute_resolution-${d.id}`,
        execute: async () => {
          await prisma.refundRequest.update({
            where: { id: d.id },
            data: {
              status: rembourse ? "APPROVED" : "REJECTED",
              adminNote: verdict!.motif,
              resolvedAt: new Date(),
              resolvedBy: agentId,
            },
          });
          await createNotification({
            userId: d.userId,
            type: "system",
            title: rembourse ? "Remboursement approuvé" : "Remboursement refusé",
            message: `${verdict!.motif}${rembourse ? " Vous serez crédité sous quelques jours." : ""}`,
            link: "/apprenant/mes-formations",
          }).catch(() => null);
          await createAuditLog({
            actorId: agentId,
            action: rembourse ? "refund.approved" : "refund.rejected",
            targetType: "refundRequest",
            targetId: d.id,
            targetUserId: d.userId,
            details: { motif: verdict!.motif, amount: d.amount },
          }).catch(() => null);
          return { ok: true };
        },
      });
      if (a) decides++;
    }

    return {
      itemsProcessed: demandes.length,
      actionsCreated: decides + escalades,
      summary: `${demandes.length} litige(s) analysé(s) · ${decides} décidé(s) · ${escalades} escaladé(s)` + (indetermines ? ` · ${indetermines} indéterminé(s)` : ""),
    };
  });
}
