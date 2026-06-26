import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction } from "../runtime";

/**
 * 4 agents en mode RÈGLES (sans IA). Sûrs et autonomes côté serveur.
 * L'IA (Groq/Gemini/OpenAI ou Puter côté admin) viendra enrichir les
 * réponses/analyses dans une 2e itération.
 */

// ── Modération ──────────────────────────────────────────────────────────────
const BANNED = [
  "arnaque", "scam", "porn", "porno", "sexe", "escort", "drogue", "cocaine", "cannabis",
  "arme", "faux billet", "carte bancaire vol", "piratage compte", "crack ", "hack compte",
  "viagra", "casino illegal", "blanchiment", "contrefacon", "contrefaçon",
];

export async function runModeration() {
  return recordRun("moderation", async () => {
    const since = new Date(Date.now() - 26 * 60 * 60 * 1000);
    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, title: true, description: true },
        take: 200,
      }),
      prisma.digitalProduct.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, title: true, description: true },
        take: 200,
      }),
    ]);
    let actions = 0;
    const scan = async (kind: "formation" | "product", items: { id: string; title: string; description: string | null }[]) => {
      for (const it of items) {
        const hay = `${it.title} ${it.description ?? ""}`.toLowerCase();
        const hit = BANNED.find((w) => hay.includes(w));
        if (!hit) continue;
        const a = await proposeAction({
          agentKey: "moderation",
          type: "moderate",
          risk: "sensitive",
          title: `Contenu à vérifier : « ${it.title.slice(0, 60)} »`,
          reasoning: `Terme suspect détecté : « ${hit.trim()} ». À examiner (masquer si confirmé).`,
          targetType: kind,
          targetId: it.id,
          payload: { kind, term: hit.trim() },
        });
        if (a) actions++;
      }
    };
    await scan("formation", formations);
    await scan("product", products);
    return {
      itemsProcessed: formations.length + products.length,
      actionsCreated: actions,
      summary: `${formations.length + products.length} contenus scannés · ${actions} à vérifier`,
    };
  });
}

// ── KYC ──────────────────────────────────────────────────────────────────────
export async function runKyc() {
  return recordRun("kyc", async () => {
    const pending = await prisma.kycRequest.findMany({
      where: { status: "EN_ATTENTE" },
      select: { id: true, requestedLevel: true, documentType: true, documentUrl: true, userId: true, createdAt: true },
      take: 100,
      orderBy: { createdAt: "asc" },
    });
    let actions = 0;
    for (const k of pending) {
      const complete = !!k.documentUrl && !!k.documentType;
      const ageDays = Math.floor((Date.now() - new Date(k.createdAt).getTime()) / 86400000);
      const reco = complete
        ? `Dossier complet (pièce « ${k.documentType} » fournie). Niveau ${k.requestedLevel} demandé. Recommandation : examiner pour approbation.`
        : `Dossier INCOMPLET (pièce manquante). Recommandation : demander la pièce avant décision.`;
      const a = await proposeAction({
        agentKey: "kyc",
        type: "kyc_decision",
        risk: "sensitive", // la décision KYC reste toujours validée par l'admin
        title: `KYC niveau ${k.requestedLevel} — ${complete ? "complet" : "incomplet"}${ageDays > 2 ? ` (en attente ${ageDays} j)` : ""}`,
        reasoning: reco,
        targetType: "kycRequest",
        targetId: k.id,
        payload: { complete, requestedLevel: k.requestedLevel, ageDays },
      });
      if (a) actions++;
    }
    return { itemsProcessed: pending.length, actionsCreated: actions, summary: `${pending.length} dossiers KYC en attente · ${actions} recommandations` };
  });
}

// ── Rétention ─────────────────────────────────────────────────────────────────
export async function runRetention() {
  return recordRun("retention", async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const inactive = await prisma.user.count({
      where: { formationsRole: "apprenant", lastLoginAt: { lt: cutoff } },
    });
    let actions = 0;
    if (inactive >= 3) {
      const a = await proposeAction({
        agentKey: "retention",
        type: "retention",
        risk: "sensitive",
        title: `${inactive} acheteurs inactifs (> 30 j) — campagne de réactivation ?`,
        reasoning:
          "Ces acheteurs ne se sont pas reconnectés depuis plus de 30 jours. Une campagne de réactivation (nouveauté, code promo) peut les faire revenir.",
        payload: { inactive, suggestion: "campagne_reactivation" },
        dedupeKey: `retention-${new Date().toISOString().slice(0, 10)}`,
      });
      if (a) actions++;
    }
    return { itemsProcessed: inactive, actionsCreated: actions, summary: `${inactive} inactifs détectés · ${actions} suggestion(s)` };
  });
}

// ── Support ───────────────────────────────────────────────────────────────────
export async function runSupport() {
  return recordRun("support", async () => {
    // Messages non lus depuis > 2 h (le destinataire n'a pas encore répondu).
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const waiting = await prisma.message.count({
      where: { read: false, createdAt: { lt: cutoff } },
    });
    let actions = 0;
    if (waiting >= 1) {
      const a = await proposeAction({
        agentKey: "support",
        type: "alert",
        risk: "low",
        title: `${waiting} message(s) en attente de réponse (> 2 h)`,
        reasoning: "Des acheteurs attendent une réponse depuis plus de 2 heures. Répondez vite pour ne pas perdre de ventes.",
        payload: { waiting },
        dedupeKey: `support-${new Date().toISOString().slice(0, 13)}`,
        execute: async () => ({ noted: true }),
      });
      if (a) actions++;
    }
    return { itemsProcessed: waiting, actionsCreated: actions, summary: `${waiting} message(s) en attente · ${actions} alerte(s)` };
  });
}
