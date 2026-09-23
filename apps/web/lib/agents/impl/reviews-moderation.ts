import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { createNotification } from "@/lib/notifications/service";
import { createAuditLog } from "@/lib/admin/audit";
import { chatIA, estOpenRouterConfigure } from "@/lib/ai/openrouter";
import { playbookPour } from "../playbooks";

/**
 * Agent MODÉRATION AVIS.
 *
 * Lit chaque nouvel avis (produits + formations) et SUPPRIME autonomement
 * ceux qui sont manifestement faux, insultants ou hors-sujet. Un motif est
 * envoyé à l'auteur de l'avis supprimé.
 *
 * L'auto-avis (vendeur qui note son propre produit) est détecté sans IA :
 * l'ID du user et l'ID du vendeur du produit suffisent.
 */

type Verdict = { decision: "GARDER" | "SUPPRIMER"; motif: string };

function extraireJson(texte: string): Verdict | null {
  try {
    const m = texte.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as Partial<Verdict>;
    if (j.decision !== "GARDER" && j.decision !== "SUPPRIMER") return null;
    if (!j.motif || typeof j.motif !== "string" || j.motif.trim().length < 5) return null;
    return { decision: j.decision, motif: j.motif.trim() };
  } catch { return null; }
}

async function analyserAvis(a: { rating: number; comment: string; kind: "product" | "formation"; produitTitre: string }, consignes: string): Promise<Verdict | null> {
  const systeme = [
    playbookPour("reviews_moderation"),
    "",
    "── AVIS À TRAITER MAINTENANT ──",
    "Tu es l'agent de modération des avis de Novakou.",
    "Ta décision est FINALE : personne ne la relit avant qu'elle s'applique. Sois strict sur la fraude évidente, tolérant sur les avis simplement mal écrits ou pas gentils.",
    "",
    "SUPPRIME si tu observes :",
    "  - Injures, insultes, propos discriminatoires ou menaces.",
    "  - Avis manifestement hors-sujet (parle d'un autre produit, d'une autre plateforme).",
    "  - Faux avis évident : commentaire générique copié-collé, incohérent avec la note (« excellent produit » avec 1★).",
    "  - Spam / lien commercial vers un tiers.",
    "",
    "GARDE dans tous les autres cas — un avis négatif honnête (« ne correspondait pas à mes attentes ») est un avis LÉGITIME, il RESTE. La liberté de critique est protégée.",
    consignes ? `\nConsignes personnalisées : ${consignes}` : "",
    "",
    'Réponds STRICTEMENT en JSON : {"decision":"GARDER"|"SUPPRIMER","motif":"phrase courte en français, à destination de l\'auteur si supprimé"}',
  ].join("\n");

  try {
    const rep = await chatIA({
      messages: [
        { role: "system", content: systeme },
        { role: "user", content: `Produit : « ${a.produitTitre} » (${a.kind}). Note : ${a.rating}/5. Commentaire :\n"""${a.comment.slice(0, 1000)}"""` },
      ],
      maxTokens: 200, temperature: 0.2, json: true, timeoutMs: 20_000,
    });
    return extraireJson(rep.texte);
  } catch (e) {
    console.warn("[reviews-moderation]", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function runReviewsModeration() {
  return recordRun("reviews_moderation", async () => {
    const cfg = await getAgentConfig("reviews_moderation");
    const lot = Math.max(1, Math.min(100, Number(cfg.batchSize) || 20));
    const consignes = String(cfg.instructions || "").trim();
    const agentId = await agentSystemUserId();

    const depuis = new Date(Date.now() - 24 * 3600_000);
    const [avisProduit, avisFormation] = await Promise.all([
      prisma.digitalProductReview.findMany({
        where: { createdAt: { gte: depuis } },
        select: {
          id: true, rating: true, comment: true, userId: true, productId: true, createdAt: true,
          product: { select: { title: true, instructeur: { select: { userId: true } } } },
        },
        take: lot, orderBy: { createdAt: "desc" },
      }),
      prisma.formationReview.findMany({
        where: { createdAt: { gte: depuis } },
        select: {
          id: true, rating: true, comment: true, userId: true, formationId: true, createdAt: true,
          formation: { select: { title: true, instructeur: { select: { userId: true } } } },
        },
        take: lot, orderBy: { createdAt: "desc" },
      }),
    ]);

    const iaOk = estOpenRouterConfigure();
    let decides = 0;
    let indetermines = 0;
    const DEBUT = Date.now();
    const BUDGET_MS = 220_000;

    const traiter = async (
      kind: "product" | "formation",
      r: { id: string; rating: number; comment: string; userId: string; produitTitre: string; vendeurUserId: string | undefined },
    ) => {
      if (Date.now() - DEBUT > BUDGET_MS) return;

      // Auto-avis : détection sans IA (règle déterministe, aucun coût, aucun doute).
      const autoAvis = r.userId === r.vendeurUserId;
      let verdict: Verdict | null = null;

      if (autoAvis) {
        verdict = { decision: "SUPPRIMER", motif: "Un vendeur ne peut pas noter son propre produit." };
      } else if (iaOk) {
        verdict = await analyserAvis({ rating: r.rating, comment: r.comment, kind, produitTitre: r.produitTitre }, consignes);
      }

      if (!verdict) { indetermines++; return; }
      if (verdict.decision === "GARDER") { decides++; return; } // journalisé comme décidé mais sans effet destructif

      const a = await proposeAction({
        agentKey: "reviews_moderation",
        type: "review_removed",
        risk: "low",
        title: `Avis supprimé — ${r.rating}★ sur « ${r.produitTitre.slice(0, 40)} »`,
        reasoning: verdict.motif,
        targetType: kind === "product" ? "digitalProductReview" : "formationReview",
        targetId: r.id,
        payload: { auto: true, kind, autoAvis, comment: r.comment.slice(0, 200) },
        dedupeKey: `reviews_moderation-${kind}-${r.id}`,
        execute: async () => {
          if (kind === "product") await prisma.digitalProductReview.delete({ where: { id: r.id } });
          else await prisma.formationReview.delete({ where: { id: r.id } });
          await createNotification({
            userId: r.userId, type: "system", title: "Votre avis a été retiré",
            message: `Motif : ${verdict!.motif} Vous pouvez publier un nouvel avis respectant les règles.`,
          }).catch(() => null);
          await createAuditLog({
            actorId: agentId, action: "review.removed",
            targetType: kind === "product" ? "digitalProductReview" : "formationReview",
            targetId: r.id, targetUserId: r.userId,
            details: { motif: verdict!.motif, autoAvis },
          }).catch(() => null);
          return { ok: true };
        },
      });
      if (a) decides++;
    };

    for (const r of avisProduit) {
      await traiter("product", {
        id: r.id, rating: r.rating, comment: r.comment, userId: r.userId,
        produitTitre: r.product.title,
        vendeurUserId: r.product.instructeur?.userId,
      });
    }
    for (const r of avisFormation) {
      await traiter("formation", {
        id: r.id, rating: r.rating, comment: r.comment, userId: r.userId,
        produitTitre: r.formation.title,
        vendeurUserId: r.formation.instructeur?.userId,
      });
    }

    const total = avisProduit.length + avisFormation.length;
    return {
      itemsProcessed: total,
      actionsCreated: decides,
      summary: `${total} avis examiné(s) · ${decides} décidé(s)` + (indetermines ? ` · ${indetermines} indéterminé(s)` : ""),
    };
  });
}
