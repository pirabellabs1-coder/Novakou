import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { createNotification } from "@/lib/notifications/service";
import { chatIAOuNull, estOpenRouterConfigure } from "@/lib/ai/openrouter";

/**
 * Agent COACH VENDEUR.
 *
 * Détecte les vendeurs qui décrochent :
 *  - Brouillon créé mais jamais publié depuis N jours.
 *  - Produit publié depuis N jours SANS aucune vente.
 * Leur envoie AUTONOMEMENT un message personnalisé pour les aider à
 * débloquer leur situation. Aucun impact financier ; message uniquement.
 */

export async function runVendorCoach() {
  return recordRun("vendor_coach", async () => {
    const cfg = await getAgentConfig("vendor_coach");
    const brouillonJours = Math.max(1, Number(cfg.brouillonJours) || 5);
    const sansVenteJours = Math.max(7, Number(cfg.sansVenteJours) || 30);
    const lot = Math.max(1, Math.min(100, Number(cfg.batchSize) || 30));
    const consignes = String(cfg.instructions || "").trim();

    // ── 1. Brouillons anciens ─────────────────────────────────────────────
    const seuilBrouillon = new Date(Date.now() - brouillonJours * 86400_000);
    const brouillons = await prisma.digitalProduct.findMany({
      where: { status: "BROUILLON", createdAt: { lt: seuilBrouillon } },
      select: {
        id: true, title: true, instructeurId: true,
        instructeur: { select: { user: { select: { id: true, name: true } } } },
      },
      take: lot,
    });

    // ── 2. Publiés mais sans vente ────────────────────────────────────────
    const seuilSansVente = new Date(Date.now() - sansVenteJours * 86400_000);
    const publiesSansVente = await prisma.digitalProduct.findMany({
      where: { status: "ACTIF", createdAt: { lt: seuilSansVente }, purchases: { none: {} } },
      select: {
        id: true, title: true, description: true, instructeurId: true,
        instructeur: { select: { user: { select: { id: true, name: true } } } },
      },
      take: lot,
    });

    let messagesEnvoyes = 0;
    const DEBUT = Date.now();
    const BUDGET_MS = 220_000;
    const iaOk = estOpenRouterConfigure();

    for (const p of brouillons) {
      if (Date.now() - DEBUT > BUDGET_MS) break;
      const userId = p.instructeur?.user?.id;
      const name = p.instructeur?.user?.name ?? "vendeur";
      if (!userId) continue;

      const messagePardefaut = `Bonjour ${name}, votre brouillon « ${p.title || "sans titre"} » attend depuis quelques jours. Un titre plus explicite, une image nette et une description qui répond à « à qui ça s'adresse et ce que ça résout » suffisent souvent à débloquer la publication. Bon courage ! — L'équipe Novakou`;
      let corps = messagePardefaut;

      if (iaOk) {
        const draft = await chatIAOuNull({
          messages: [
            { role: "system", content: `Tu es l'équipe support de Novakou. Rédige un message court (3-4 phrases, ton chaleureux, vouvoiement, signé « L'équipe Novakou ») pour aider un vendeur à publier son brouillon. Ne promets aucune promotion, aucune remise. ${consignes}` },
            { role: "user", content: `Nom : ${name}. Titre du brouillon : « ${p.title || "(sans titre)"} ». Il n'a jamais publié.` },
          ],
          maxTokens: 250, temperature: 0.6, timeoutMs: 20_000,
        });
        if (draft?.texte?.trim()) corps = draft.texte.trim();
      }

      const a = await proposeAction({
        agentKey: "vendor_coach",
        type: "vendor_nudge",
        risk: "low",
        title: `Coach vendeur — brouillon dormant « ${(p.title || "sans titre").slice(0, 40)} »`,
        reasoning: corps,
        targetType: "digitalProduct",
        targetId: p.id,
        payload: { userId, kind: "brouillon" },
        dedupeKey: `vendor_coach-brouillon-${p.id}`,
        execute: async () => {
          await createNotification({
            userId, type: "system", title: "Un petit coup de pouce pour publier",
            message: corps, link: "/vendeur/produits",
          }).catch(() => null);
          return { ok: true };
        },
      });
      if (a) messagesEnvoyes++;
    }

    for (const p of publiesSansVente) {
      if (Date.now() - DEBUT > BUDGET_MS) break;
      const userId = p.instructeur?.user?.id;
      const name = p.instructeur?.user?.name ?? "vendeur";
      if (!userId) continue;

      const messagePardefaut = `Bonjour ${name}, votre produit « ${p.title || "sans titre"} » est en ligne depuis plusieurs semaines sans encore trouver preneur. Trois pistes qui marchent souvent : partager le lien de la fiche sur WhatsApp/TikTok, préciser dans la description le résultat concret que l'acheteur obtient, et vérifier que la vignette lit bien sur mobile. — L'équipe Novakou`;
      let corps = messagePardefaut;

      if (iaOk) {
        const draft = await chatIAOuNull({
          messages: [
            { role: "system", content: `Tu es l'équipe support de Novakou. Rédige un message court (3-5 phrases, ton chaleureux, vouvoiement, signé « L'équipe Novakou ») avec 2 à 3 PISTES CONCRÈTES pour aider un vendeur dont un produit ne s'est pas vendu. Ne promets aucune promotion, aucune remise. ${consignes}` },
            { role: "user", content: `Nom : ${name}. Titre : « ${p.title || "(sans titre)"} ». Description : « ${(p.description ?? "").slice(0, 300)} ». En ligne depuis longtemps, 0 vente.` },
          ],
          maxTokens: 300, temperature: 0.6, timeoutMs: 20_000,
        });
        if (draft?.texte?.trim()) corps = draft.texte.trim();
      }

      const a = await proposeAction({
        agentKey: "vendor_coach",
        type: "vendor_nudge",
        risk: "low",
        title: `Coach vendeur — publié sans vente « ${(p.title || "sans titre").slice(0, 40)} »`,
        reasoning: corps,
        targetType: "digitalProduct",
        targetId: p.id,
        payload: { userId, kind: "sans_vente" },
        dedupeKey: `vendor_coach-sansvente-${p.id}`,
        execute: async () => {
          await createNotification({
            userId, type: "system", title: "Quelques pistes pour votre produit",
            message: corps, link: "/vendeur/produits",
          }).catch(() => null);
          return { ok: true };
        },
      });
      if (a) messagesEnvoyes++;
    }

    const total = brouillons.length + publiesSansVente.length;
    return {
      itemsProcessed: total,
      actionsCreated: messagesEnvoyes,
      summary: `${total} vendeur(s) analysé(s) · ${messagesEnvoyes} message(s) envoyé(s)`,
    };
  });
}
