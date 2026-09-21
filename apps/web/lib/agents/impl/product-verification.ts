import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { appliquerDecisionProduit, type KindProduit } from "@/lib/formations/produit-decision";
import { chatVisionIA, estOpenRouterConfigure, type PartieMessageIA } from "@/lib/ai/openrouter";

/**
 * AGENT DE VALIDATION DES FICHES — autonome, décision fondateur 2026-09-21.
 *
 * Complète `publication-gate.ts`, qui reste le premier filtre (refus net,
 * déterministe, sans IA, sur les règles de complétude/prix/promesses). Ce
 * qui PASSE ce filtre mais porte un SIGNAL (prix élevé, vendeur non vérifié,
 * e-mail non confirmé) partait auparavant en file d'attente admin. Cet agent
 * DÉCIDE à la place : publie ou refuse avec un motif envoyé au vendeur.
 * L'admin garde `/admin/produits` pour un cas litigieux, mais rien n'exige
 * plus son intervention.
 */

type Verdict = { decision: "PUBLIE" | "REFUSE"; motif: string; signaux: string[] };

function extraireJson(texte: string): Verdict | null {
  try {
    const m = texte.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as Partial<Verdict>;
    if (j.decision !== "PUBLIE" && j.decision !== "REFUSE") return null;
    if (!j.motif || typeof j.motif !== "string" || j.motif.trim().length < 10) return null;
    return { decision: j.decision, motif: j.motif.trim(), signaux: Array.isArray(j.signaux) ? j.signaux.map(String) : [] };
  } catch {
    return null;
  }
}

async function analyserFiche(f: {
  kind: KindProduit;
  titre: string;
  description: string;
  prix: number;
  images: string[];
  lienDePaiement: boolean;
}): Promise<Verdict | null> {
  const systeme = [
    "Tu es l'agent de validation des fiches de Novakou, une marketplace africaine de formations et produits numériques.",
    "Ta décision est FINALE et autonome : personne ne la relit avant qu'elle s'applique. Sois rigoureux sur la fraude et l'illégal, tolérant sur le style.",
    "",
    `Type de fiche : ${f.kind === "formation" ? "formation vidéo" : f.lienDePaiement ? "lien de paiement (titre + prix, sans image ni description détaillée attendue)" : "produit numérique (ebook, template, audio…)"}.`,
    `Prix : ${Math.round(f.prix)} FCFA.`,
    "",
    "REFUSE si tu observes l'un de ces signaux :",
    "  - Promesse de gains mensongère ou trompeuse (« devenez riche », rendements garantis, pyramide/MLM déguisé).",
    "  - Contenu manifestement illégal, dangereux, ou sexuel.",
    "  - Titre et description SANS RAPPORT avec ce que montrent les images (tromperie sur le produit vendu).",
    "  - Image(s) clairement volée(s)/génériques sans rapport avec un produit réel (ex. capture d'écran de résultats bancaires irréalistes comme preuve de gains).",
    "  - Prix manifestement incohérent avec un contenu numérique inexistant ou vide (arnaque probable).",
    "",
    "PUBLIE dans tous les autres cas — y compris une fiche perfectible mais honnête, un style commercial normal, ou un lien de paiement minimaliste (c'est son format normal, ne le pénalise pas pour son absence d'image).",
    "Le DOUTE RAISONNABLE va à la publication : ce filtre n'est pas là pour juger la qualité marketing, seulement pour écarter la fraude et l'illégal manifestes — la modération humaine reste possible après coup sur signalement.",
    "",
    'Réponds STRICTEMENT en JSON, rien d\'autre : {"decision":"PUBLIE"|"REFUSE","motif":"phrase claire en français, à destination du vendeur","signaux":["mot-clé1"]}',
  ].join("\n");

  const contenu: PartieMessageIA[] = [
    { type: "text", text: `Titre : ${f.titre}\n\nDescription :\n${f.description || "(aucune)"}` },
    ...f.images.map((url): PartieMessageIA => ({ type: "image_url", image_url: { url } })),
  ];

  try {
    const rep = await chatVisionIA({
      messages: [
        { role: "system", content: systeme },
        { role: "user", content: contenu },
      ],
      maxTokens: 500,
      temperature: 0.2,
      timeoutMs: 45_000,
    });
    return extraireJson(rep.texte);
  } catch (e) {
    console.warn("[product-verification] appel vision échoué :", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function runProductVerification() {
  return recordRun("product_verification", async () => {
    if (!estOpenRouterConfigure()) {
      return { itemsProcessed: 0, actionsCreated: 0, summary: "IA non configurée — aucune fiche traitée." };
    }

    const cfg = await getAgentConfig("product_verification");
    const lot = Math.max(1, Math.min(100, Number(cfg.batchSize) || 15));
    const consignes = String(cfg.instructions || "").trim();

    const [formations, produits] = await Promise.all([
      prisma.formation.findMany({
        where: { status: "EN_ATTENTE" },
        select: { id: true, title: true, description: true, shortDesc: true, price: true, thumbnail: true },
        orderBy: { createdAt: "asc" },
        take: lot,
      }),
      prisma.digitalProduct.findMany({
        where: { status: "EN_ATTENTE" },
        select: { id: true, title: true, description: true, price: true, thumbnail: true, banner: true, isPaymentLink: true },
        orderBy: { createdAt: "asc" },
        take: lot,
      }),
    ]);

    const agentId = await agentSystemUserId();
    let decides = 0;
    let indetermines = 0;
    let coupees = 0;

    // Même garde-fou que l'agent KYC : on s'arrête avant le timeout de la
    // fonction (280 s) et on laisse le reste au passage suivant (15 min).
    const DEBUT = Date.now();
    const BUDGET_MS = 220_000;

    const traiter = async (kind: KindProduit, item: {
      id: string; titre: string; description: string; prix: number; images: string[]; lienDePaiement: boolean;
    }) => {
      if (Date.now() - DEBUT > BUDGET_MS) { coupees++; return; }
      // Aucune image à montrer : décision sur texte seul plutôt que de
      // laisser un tableau vide faire échouer l'appel — un lien de paiement
      // n'a légitimement pas d'image.
      const verdict = await analyserFiche({ kind, ...item });
      if (!verdict) { indetermines++; return; }

      const publie = verdict.decision === "PUBLIE";
      const a = await proposeAction({
        agentKey: "product_verification",
        type: "product_decision",
        risk: "low",
        title: `${kind === "formation" ? "Formation" : "Produit"} « ${item.titre.slice(0, 50)} » — ${publie ? "publié" : "refusé"} par l'agent`,
        reasoning: `${verdict.motif}${consignes ? `\n\nConsignes appliquées : ${consignes}` : ""}`,
        targetType: kind,
        targetId: item.id,
        payload: { auto: true, verdict },
        dedupeKey: `product_verification-${kind}-${item.id}`,
        execute: async () => {
          const d = await appliquerDecisionProduit({
            kind,
            id: item.id,
            action: publie ? "approve" : "reject",
            reason: publie ? null : verdict.motif,
            actorId: agentId,
          });
          if (!d.ok) throw new Error(d.erreur);
          return d;
        },
      });
      if (a) decides++;
    };

    for (const f of formations) {
      await traiter("formation", {
        id: f.id,
        titre: f.title,
        description: f.description || f.shortDesc || "",
        prix: f.price,
        images: f.thumbnail ? [f.thumbnail] : [],
        lienDePaiement: false,
      });
    }
    for (const p of produits) {
      await traiter("product", {
        id: p.id,
        titre: p.title,
        description: p.description || "",
        prix: p.price,
        images: [p.thumbnail, p.banner].filter((u): u is string => !!u),
        lienDePaiement: p.isPaymentLink,
      });
    }

    const total = formations.length + produits.length;
    return {
      itemsProcessed: total,
      actionsCreated: decides,
      summary:
        `${total} fiche(s) examinée(s) (${formations.length} formation(s), ${produits.length} produit(s)) · ${decides} décidée(s)` +
        (indetermines ? ` · ${indetermines} laissée(s) en attente (panne technique)` : "") +
        (coupees ? ` · ${coupees} reportée(s) au passage suivant (budget de temps)` : ""),
    };
  });
}
