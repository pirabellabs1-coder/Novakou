import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentLLM, isLlmConfigured } from "../llm";

/** Découpe une liste de mots saisie par l'admin (virgules ou retours ligne). */
function splitTerms(raw: unknown): string[] {
  return String(raw ?? "")
    .split(/[,\n;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2);
}

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
    const cfg = await getAgentConfig("moderation");
    const banned = [...BANNED, ...splitTerms(cfg.bannedExtra)];
    const since = new Date(Date.now() - Number(cfg.scanWindowHours) * 60 * 60 * 1000);
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
        const hit = banned.find((w) => hay.includes(w));
        if (!hit) continue;
        const a = await proposeAction({
          agentKey: "moderation",
          type: "moderate",
          risk: "sensitive",
          destructive: true, // un masquage est destructif → alerte admin, jamais auto
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
    const cfg = await getAgentConfig("kyc");
    const agingDays = Number(cfg.agingAlertDays);
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
        title: `KYC niveau ${k.requestedLevel} — ${complete ? "complet" : "incomplet"}${ageDays > agingDays ? ` (en attente ${ageDays} j)` : ""}`,
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
    const cfg = await getAgentConfig("retention");
    const inactiveDays = Number(cfg.inactiveDays);
    const minInactive = Number(cfg.minInactive);
    const cutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
    const inactive = await prisma.user.count({
      where: { formationsRole: "apprenant", lastLoginAt: { lt: cutoff } },
    });
    let actions = 0;
    if (inactive >= minInactive) {
      const a = await proposeAction({
        agentKey: "retention",
        type: "retention",
        risk: "sensitive",
        title: `${inactive} acheteurs inactifs (> ${inactiveDays} j) — campagne de réactivation ?`,
        reasoning:
          `Ces acheteurs ne se sont pas reconnectés depuis plus de ${inactiveDays} jours. Une campagne de réactivation (nouveauté, code promo) peut les faire revenir.`,
        payload: { inactive, suggestion: "campagne_reactivation" },
        dedupeKey: `retention-${new Date().toISOString().slice(0, 10)}`,
      });
      if (a) actions++;
    }
    return { itemsProcessed: inactive, actionsCreated: actions, summary: `${inactive} inactifs détectés · ${actions} suggestion(s)` };
  });
}

// ── Support ───────────────────────────────────────────────────────────────────
const SUPPORT_DRAFT_MAX = 5; // nb max de brouillons IA par exécution (coût/temps)

export async function runSupport() {
  return recordRun("support", async () => {
    const cfg = await getAgentConfig("support");
    const hrs = Number(cfg.unrepliedHours);
    const persona = String(cfg.instructions || "").trim();
    // Messages non lus depuis > N h (le destinataire n'a pas encore répondu).
    const cutoff = new Date(Date.now() - hrs * 60 * 60 * 1000);
    const waiting = await prisma.message.count({
      where: { read: false, createdAt: { lt: cutoff }, deletedAt: null },
    });

    // ── Mode RÈGLES (pas d'IA) : simple alerte agrégée ────────────────────────
    if (!isLlmConfigured()) {
      let actions = 0;
      if (waiting >= 1) {
        const a = await proposeAction({
          agentKey: "support",
          type: "alert",
          risk: "low",
          title: `${waiting} message(s) en attente de réponse (> ${hrs} h)`,
          reasoning: `Des acheteurs attendent une réponse depuis plus de ${hrs} heures. Répondez vite pour ne pas perdre de ventes.`,
          payload: { waiting },
          dedupeKey: `support-${new Date().toISOString().slice(0, 13)}`,
          execute: async () => ({ noted: true }),
        });
        if (a) actions++;
      }
      return { itemsProcessed: waiting, actionsCreated: actions, summary: `${waiting} message(s) en attente · ${actions} alerte(s)` };
    }

    // ── Mode IA : rédige un brouillon de réponse par conversation ─────────────
    const unread = await prisma.message.findMany({
      where: { read: false, createdAt: { lt: cutoff }, deletedAt: null, type: "TEXT" },
      orderBy: { createdAt: "desc" },
      select: { id: true, content: true, conversationId: true, createdAt: true, sender: { select: { name: true } } },
      take: 100,
    });
    // Dernier message non lu par conversation (le plus récent)
    const latestByConv = new Map<string, (typeof unread)[number]>();
    for (const m of unread) if (!latestByConv.has(m.conversationId)) latestByConv.set(m.conversationId, m);
    const targets = [...latestByConv.values()].slice(0, SUPPORT_DRAFT_MAX);

    let actions = 0;
    let tokens = 0;
    const system = [
      "Tu es l'agent de support client de Novakou, une marketplace de formations et produits numériques en Afrique francophone.",
      "Rédige une réponse PRÊTE À ENVOYER, en français, polie, chaleureuse et concise (3 à 6 phrases). Vouvoiement.",
      "N'invente jamais d'information (remboursement, délai, prix) : si tu n'es pas sûr, propose de vérifier et de revenir vers le client.",
      "Termine par une formule de politesse signée « L'équipe Novakou ».",
      persona ? `Consignes de la maison : ${persona}` : "",
    ].filter(Boolean).join("\n");

    for (const m of targets) {
      const draft = await agentLLM(
        [
          { role: "system", content: system },
          { role: "user", content: `Message d'un client (${m.sender?.name || "client"}) resté sans réponse depuis plus de ${hrs} h :\n\n"""${(m.content || "").slice(0, 1500)}"""\n\nRédige la réponse.` },
        ],
        { maxTokens: 400, temperature: 0.5 },
      );
      if (!draft) continue;
      tokens += draft.tokensUsed;
      const a = await proposeAction({
        agentKey: "support",
        type: "support_reply",
        risk: "sensitive", // une réponse envoyée au nom de la plateforme = validée par l'admin
        title: `Brouillon de réponse — « ${(m.content || "").slice(0, 50)}… »`,
        reasoning: draft.text,
        targetType: "conversation",
        targetId: m.conversationId,
        payload: { conversationId: m.conversationId, messageId: m.id, draft: draft.text, original: (m.content || "").slice(0, 1500) },
      });
      if (a) actions++;
    }

    return {
      itemsProcessed: targets.length,
      actionsCreated: actions,
      tokensUsed: tokens,
      summary: `${waiting} message(s) en attente · ${actions} brouillon(s) IA rédigé(s)`,
    };
  });
}
