import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { chatIA, estOpenRouterConfigure } from "@/lib/ai/openrouter";
import { playbookPour } from "../playbooks";

/**
 * Agent SUPPORT ACHETEUR.
 *
 * Détecte les messages entrants non lus depuis N heures. Rédige et POSTE
 * DIRECTEMENT une réponse dans la conversation, signée « L'équipe Novakou ».
 * Les cas sensibles (remboursement, litige, plainte financière) reçoivent un
 * message court d'accusé de réception qui prévient qu'un humain va prendre
 * le relais, plutôt qu'une réponse potentiellement à côté.
 */

type Verdict = { type: "REPONSE" | "ESCALADE"; texte: string };

function extraireJson(t: string): Verdict | null {
  try {
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as Partial<Verdict>;
    if (j.type !== "REPONSE" && j.type !== "ESCALADE") return null;
    if (!j.texte || typeof j.texte !== "string" || j.texte.trim().length < 20) return null;
    return { type: j.type, texte: j.texte.trim() };
  } catch { return null; }
}

export async function runBuyerSupport() {
  return recordRun("buyer_support", async () => {
    if (!estOpenRouterConfigure()) {
      return { itemsProcessed: 0, actionsCreated: 0, summary: "IA non configurée — aucun message traité." };
    }
    const cfg = await getAgentConfig("buyer_support");
    const heures = Math.max(1, Number(cfg.unrepliedHours) || 2);
    const lot = Math.max(1, Math.min(100, Number(cfg.batchSize) || 10));
    const consignes = String(cfg.instructions || "").trim();
    const agentId = await agentSystemUserId();

    const seuil = new Date(Date.now() - heures * 3600_000);

    // Messages non lus (destinataire n'a pas ouvert), texte, plus vieux que le seuil.
    const nonLus = await prisma.message.findMany({
      where: {
        read: false, createdAt: { lt: seuil }, deletedAt: null, type: "TEXT",
        senderId: { not: agentId }, // ignore les messages que l'agent lui-même a posté
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, content: true, conversationId: true, senderId: true, createdAt: true,
        sender: { select: { name: true } },
        conversation: {
          select: {
            id: true,
            users: { select: { userId: true } },
          },
        },
      },
    });

    // Un message par conversation (le plus récent non lu).
    const parConv = new Map<string, (typeof nonLus)[number]>();
    for (const m of nonLus) if (!parConv.has(m.conversationId)) parConv.set(m.conversationId, m);
    const cibles = [...parConv.values()].slice(0, lot);

    let repondus = 0;
    let escalades = 0;
    let indetermines = 0;
    const DEBUT = Date.now();
    const BUDGET_MS = 220_000;

    for (const m of cibles) {
      if (Date.now() - DEBUT > BUDGET_MS) break;

      const systeme = [
        playbookPour("buyer_support"),
        "",
        "── MESSAGE À TRAITER MAINTENANT ──",
        "Tu es l'agent de support client de Novakou, marketplace africaine de formations et produits numériques.",
        "Décision autonome : ta réponse est postée SANS relecture humaine.",
        "",
        "Ton et style : chaleureux, professionnel, vouvoiement, 3 à 5 phrases, signe « L'équipe Novakou ».",
        "",
        "Deux modes possibles :",
        "  1. TYPE = REPONSE — si tu peux répondre concrètement à partir de ce que Novakou fait : téléchargement d'un achat, moyens de paiement, délais, comment ouvrir un litige, où trouver son reçu. N'invente jamais un montant, un délai précis ni un remboursement.",
        "  2. TYPE = ESCALADE — pour tout ce qui touche : remboursement demandé, problème d'argent débité sans reçu, plainte contre un vendeur, litige actif, sujet légal, ou dès que tu doutes. Le texte est alors un accusé de réception court prévenant qu'un membre de l'équipe va reprendre le fil.",
        consignes ? `\nConsignes personnalisées : ${consignes}` : "",
        "",
        'Réponds STRICTEMENT en JSON : {"type":"REPONSE"|"ESCALADE","texte":"la réponse à poster dans le fil, telle qu\'elle sera vue"}',
      ].join("\n");

      let verdict: Verdict | null = null;
      try {
        const rep = await chatIA({
          messages: [
            { role: "system", content: systeme },
            { role: "user", content: `Message reçu de ${m.sender?.name ?? "un client"} il y a plus de ${heures} h :\n\n"""${(m.content || "").slice(0, 1500)}"""` },
          ],
          maxTokens: 400, temperature: 0.4, json: true, timeoutMs: 25_000,
        });
        verdict = extraireJson(rep.texte);
      } catch (e) {
        console.warn("[buyer-support]", e instanceof Error ? e.message : e);
      }
      if (!verdict) { indetermines++; continue; }

      const a = await proposeAction({
        agentKey: "buyer_support",
        type: "support_reply",
        risk: "low",
        title: `${verdict.type === "REPONSE" ? "Réponse" : "Escalade"} — « ${(m.content || "").slice(0, 40)}… »`,
        reasoning: verdict.texte,
        targetType: "message",
        targetId: m.id,
        payload: { auto: true, verdictType: verdict.type, conversationId: m.conversationId },
        dedupeKey: `buyer_support-${m.id}`,
        execute: async () => {
          await prisma.message.create({
            data: {
              conversationId: m.conversationId,
              senderId: agentId,
              content: verdict!.texte,
              type: "TEXT",
            },
          });
          // Marque le message d'origine comme lu — l'agent lui répond, c'est
          // que quelqu'un s'en est occupé.
          await prisma.message.update({ where: { id: m.id }, data: { read: true } }).catch(() => null);
          return { ok: true };
        },
      });
      if (a) {
        if (verdict.type === "REPONSE") repondus++;
        else escalades++;
      }
    }

    return {
      itemsProcessed: cibles.length,
      actionsCreated: repondus + escalades,
      summary: `${cibles.length} message(s) analysé(s) · ${repondus} réponse(s) · ${escalades} escalade(s)` + (indetermines ? ` · ${indetermines} indéterminé(s)` : ""),
    };
  });
}
