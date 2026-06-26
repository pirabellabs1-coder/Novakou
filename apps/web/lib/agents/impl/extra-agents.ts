import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";

/** 4 agents supplémentaires (mode règles, sûrs côté serveur). */

// ── 💰 Finance & anti-fraude ─────────────────────────────────────────────────
export async function runFinance() {
  return recordRun("finance", async () => {
    const cfg = await getAgentConfig("finance");
    const bigPayout = Number(cfg.highWithdrawalFcfa);
    const pending = await prisma.instructorWithdrawal.findMany({
      where: { status: "EN_ATTENTE" },
      select: { id: true, amount: true, method: true, createdAt: true },
      take: 200,
    });
    let actions = 0;
    for (const w of pending) {
      if (w.amount < bigPayout) continue;
      const a = await proposeAction({
        agentKey: "finance",
        type: "alert",
        risk: "sensitive",
        title: `Retrait élevé à vérifier : ${new Intl.NumberFormat("fr-FR").format(Math.round(w.amount))} FCFA`,
        reasoning: `Demande de retrait supérieure à ${new Intl.NumberFormat("fr-FR").format(bigPayout)} FCFA (méthode : ${w.method}). Vérifiez l'historique et le KYC du vendeur avant d'approuver.`,
        targetType: "withdrawal",
        targetId: w.id,
        payload: { amount: w.amount, method: w.method },
      });
      if (a) actions++;
    }
    const total = pending.reduce((s, w) => s + w.amount, 0);
    return {
      itemsProcessed: pending.length,
      actionsCreated: actions,
      summary: `${pending.length} retraits en attente (${new Intl.NumberFormat("fr-FR").format(Math.round(total))} FCFA) · ${actions} à vérifier`,
    };
  });
}

// ── ⭐ Avis & réputation ──────────────────────────────────────────────────────
export async function runReviews() {
  return recordRun("reviews", async () => {
    const cfg = await getAgentConfig("reviews");
    const maxRating = Number(cfg.lowRatingMax);
    const since = new Date(Date.now() - Number(cfg.lookbackHours) * 60 * 60 * 1000);
    const [fReviews, pReviews] = await Promise.all([
      prisma.formationReview.findMany({
        where: { createdAt: { gte: since }, rating: { lte: maxRating } },
        select: { id: true, rating: true, comment: true, formationId: true },
        take: 100,
      }),
      prisma.digitalProductReview.findMany({
        where: { createdAt: { gte: since }, rating: { lte: maxRating } },
        select: { id: true, rating: true, comment: true, productId: true },
        take: 100,
      }),
    ]);
    let actions = 0;
    const flag = async (kind: "formation" | "product", id: string, rating: number, comment: string, targetId: string) => {
      const a = await proposeAction({
        agentKey: "reviews",
        type: "alert",
        risk: "low",
        title: `Avis négatif (${rating}/5) à traiter`,
        reasoning: `Un acheteur a laissé ${rating}/5 : « ${(comment || "").slice(0, 140)} ». Répondre publiquement protège votre réputation.`,
        targetType: `${kind}_review`,
        targetId,
        payload: { kind, rating, refId: id },
        execute: async () => ({ flagged: true }),
      });
      if (a) actions++;
    };
    for (const r of fReviews) await flag("formation", r.id, r.rating, r.comment, r.id);
    for (const r of pReviews) await flag("product", r.id, r.rating, r.comment, r.id);
    return {
      itemsProcessed: fReviews.length + pReviews.length,
      actionsCreated: actions,
      summary: `${fReviews.length + pReviews.length} avis négatifs récents · ${actions} signalés`,
    };
  });
}

// ── 🎓 Onboarding vendeur ─────────────────────────────────────────────────────
export async function runOnboarding() {
  return recordRun("onboarding", async () => {
    const cfg = await getAgentConfig("onboarding");
    const staleDays = Number(cfg.draftStaleDays);
    const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
    // Brouillons jamais publiés depuis > N j = vendeurs bloqués dans l'onboarding.
    const [draftFormations, draftProducts] = await Promise.all([
      prisma.formation.count({ where: { status: "BROUILLON", createdAt: { lt: cutoff } } }),
      prisma.digitalProduct.count({ where: { status: "BROUILLON", createdAt: { lt: cutoff } } }),
    ]);
    const stuck = draftFormations + draftProducts;
    let actions = 0;
    if (stuck >= 1) {
      const a = await proposeAction({
        agentKey: "onboarding",
        type: "retention",
        risk: "sensitive",
        title: `${stuck} produit(s) en brouillon depuis > ${staleDays} j — accompagner les vendeurs`,
        reasoning:
          "Des vendeurs ont commencé un produit mais ne l'ont pas publié. Un e-mail d'accompagnement (aide, modèle, relance) peut débloquer ces ventes.",
        payload: { draftFormations, draftProducts },
        dedupeKey: `onboarding-${new Date().toISOString().slice(0, 10)}`,
      });
      if (a) actions++;
    }
    return { itemsProcessed: stuck, actionsCreated: actions, summary: `${stuck} brouillons bloqués · ${actions} suggestion(s)` };
  });
}

// ── ✍️ Contenu & SEO ──────────────────────────────────────────────────────────
export async function runContent() {
  return recordRun("content", async () => {
    const cfg = await getAgentConfig("content");
    const weakDesc = Number(cfg.minDescLen);
    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { status: { not: "BROUILLON" } },
        select: { id: true, title: true, description: true, thumbnail: true },
        take: 300,
      }),
      prisma.digitalProduct.findMany({
        where: { status: { not: "BROUILLON" } },
        select: { id: true, title: true, description: true, thumbnail: true },
        take: 300,
      }),
    ]);
    let actions = 0;
    const check = async (kind: "formation" | "product", it: { id: string; title: string; description: string | null; thumbnail: string | null }) => {
      const problems: string[] = [];
      if (!it.description || it.description.replace(/<[^>]+>/g, "").trim().length < weakDesc) problems.push("description trop courte");
      if (!it.thumbnail) problems.push("vignette manquante");
      if (problems.length === 0) return;
      const a = await proposeAction({
        agentKey: "content",
        type: "content",
        risk: "low",
        title: `Fiche à améliorer : « ${it.title.slice(0, 50)} »`,
        reasoning: `Points faibles : ${problems.join(", ")}. Une fiche complète vend mieux et remonte dans la recherche.`,
        targetType: kind,
        targetId: it.id,
        payload: { kind, problems },
        execute: async () => ({ noted: true }),
      });
      if (a) actions++;
    };
    for (const f of formations) await check("formation", f);
    for (const p of products) await check("product", p);
    return {
      itemsProcessed: formations.length + products.length,
      actionsCreated: actions,
      summary: `${formations.length + products.length} fiches analysées · ${actions} à améliorer`,
    };
  });
}
