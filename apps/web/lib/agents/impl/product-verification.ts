import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { appliquerDecisionProduit, type KindProduit } from "@/lib/formations/produit-decision";
import { chatVisionIA, estOpenRouterConfigure, type PartieMessageIA } from "@/lib/ai/openrouter";
import { playbookPour } from "../playbooks";

/**
 * AGENT DE VALIDATION DES FICHES — autonome.
 *
 * Deux règles ABSOLUES posées par le fondateur :
 *  - Le PRIX seul n'est jamais un motif de refus. Un vendeur peut fixer le
 *    prix qu'il veut, y compris au-dessus de 500 000 FCFA.
 *  - Le fait d'être un NOUVEAU vendeur n'est jamais un motif de refus.
 *
 * Le contexte vendeur (KYC, ancienneté, produits déjà publiés, ventes) est
 * fourni au modèle pour graduer la vigilance, PAS pour justifier un refus.
 * Seuls la fraude, l'illégal et la tromperie manifeste bloquent.
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

type ContexteVendeur = {
  ancienneteJours: number;
  emailVerifie: boolean;
  kycNiveau: number;
  produitsPublies: number;
  ventesReussies: number;
  refusAnterieurs: number;
};

async function contexteVendeur(instructeurId: string): Promise<ContexteVendeur> {
  const inst = await prisma.instructeurProfile.findUnique({
    where: { id: instructeurId },
    select: {
      user: { select: { createdAt: true, emailVerified: true, kyc: true } },
      digitalProducts: {
        select: {
          status: true, refuseReason: true,
          _count: { select: { purchases: true } },
        },
      },
      formations: {
        select: {
          status: true, refuseReason: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
  });
  if (!inst) {
    return { ancienneteJours: 0, emailVerifie: false, kycNiveau: 1, produitsPublies: 0, ventesReussies: 0, refusAnterieurs: 0 };
  }
  const items = [...inst.digitalProducts, ...inst.formations];
  const publies = items.filter((x) => x.status === "ACTIF").length;
  const refuses = items.filter((x) => x.refuseReason && x.refuseReason.length > 0).length;
  const ventes = items.reduce(
    (n, x) => n + ("_count" in x ? ((x._count as { purchases?: number; enrollments?: number }).purchases ?? (x._count as { enrollments?: number }).enrollments ?? 0) : 0),
    0,
  );
  return {
    ancienneteJours: Math.floor((Date.now() - inst.user.createdAt.getTime()) / 86400_000),
    emailVerifie: !!inst.user.emailVerified,
    kycNiveau: inst.user.kyc ?? 1,
    produitsPublies: publies,
    ventesReussies: ventes,
    refusAnterieurs: refuses,
  };
}

async function analyserFiche(f: {
  kind: KindProduit;
  titre: string;
  description: string;
  prix: number;
  images: string[];
  lienDePaiement: boolean;
  contexte: ContexteVendeur;
}, consignes: string): Promise<Verdict | null> {
  const systeme = [
    playbookPour("product_verification"),
    "",
    "── CONTEXTE PRÉCIS DE CETTE FICHE ──",
    "Tu es l'agent de validation des fiches de Novakou, une marketplace africaine de formations et produits numériques.",
    "Ta décision est FINALE et autonome. Sois rigoureux sur la fraude et l'illégal, tolérant sur le style.",
    "",
    "── DEUX RÈGLES ABSOLUES ──",
    "1. Le PRIX seul n'est JAMAIS un motif de refus. Un vendeur peut publier à 500 000 FCFA ou plus, c'est son droit.",
    "2. Être un NOUVEAU vendeur (compte récent, peu de ventes) n'est JAMAIS un motif de refus. On accueille les nouveaux comme les anciens.",
    "",
    `Type de fiche : ${f.kind === "formation" ? "formation vidéo" : f.lienDePaiement ? "lien de paiement (titre + prix, sans image ni description détaillée attendue)" : "produit numérique (ebook, template, audio…)"}.`,
    `Prix : ${Math.round(f.prix)} FCFA.`,
    "",
    "CONTEXTE VENDEUR (à titre indicatif) :",
    `  Ancienneté : ${f.contexte.ancienneteJours} jour(s) · E-mail vérifié : ${f.contexte.emailVerifie ? "oui" : "non"}`,
    `  KYC : niveau ${f.contexte.kycNiveau} · Produits publiés : ${f.contexte.produitsPublies} · Ventes réussies : ${f.contexte.ventesReussies}`,
    `  Refus antérieurs (motif renseigné) : ${f.contexte.refusAnterieurs}`,
    "",
    "REFUSE si tu observes l'un de ces signaux :",
    "  - Promesse de gains mensongère ou trompeuse (« devenez riche », rendements garantis, pyramide/MLM déguisé).",
    "  - Contenu manifestement illégal, dangereux, ou sexuel.",
    "  - Titre et description SANS RAPPORT avec ce que montrent les images (tromperie sur le produit vendu).",
    "  - Image(s) manifestement volée(s) sans rapport avec un produit réel (ex. capture d'écran de résultats bancaires irréalistes présentée comme preuve de gains).",
    "  - Contenu VIDE : titre-bidon (« aa », « test »), description absente, image générique sans lien.",
    "",
    "PUBLIE dans tous les autres cas — y compris une fiche perfectible mais honnête, un style commercial normal, un prix élevé, un vendeur nouveau, un lien de paiement minimaliste (c'est son format normal). Le doute raisonnable va à la publication.",
    consignes ? `\nConsignes personnalisées de l'équipe Novakou : ${consignes}` : "",
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
        select: { id: true, title: true, description: true, shortDesc: true, price: true, thumbnail: true, instructeurId: true },
        orderBy: { createdAt: "asc" },
        take: lot,
      }),
      prisma.digitalProduct.findMany({
        where: { status: "EN_ATTENTE" },
        select: { id: true, title: true, description: true, price: true, thumbnail: true, banner: true, isPaymentLink: true, instructeurId: true },
        orderBy: { createdAt: "asc" },
        take: lot,
      }),
    ]);

    const agentId = await agentSystemUserId();
    let decides = 0;
    let indetermines = 0;
    let coupees = 0;

    const DEBUT = Date.now();
    const BUDGET_MS = 220_000;

    const traiter = async (kind: KindProduit, item: {
      id: string; instructeurId: string;
      titre: string; description: string; prix: number; images: string[]; lienDePaiement: boolean;
    }) => {
      if (Date.now() - DEBUT > BUDGET_MS) { coupees++; return; }

      const ctx = await contexteVendeur(item.instructeurId);
      let verdict = await analyserFiche({ kind, ...item, contexte: ctx }, consignes);

      // Fallback déterministe si l'IA échoue : on ne peut PAS laisser une fiche
      // bloquer indéfiniment en EN_ATTENTE. Après N échecs IA consécutifs sur
      // le MÊME item, on décide selon des règles simples et le principe
      // fondateur « le doute raisonnable va à la publication ».
      if (!verdict) {
        const echecsAnterieurs = await prisma.agentAction.count({
          where: {
            agentKey: "product_verification",
            targetType: kind, targetId: item.id,
            status: "failed",
          },
        });
        // Après 2 échecs IA consécutifs, on tranche déterministement.
        if (echecsAnterieurs >= 2) {
          const ficheVide =
            item.titre.trim().length < 3 ||
            (!item.lienDePaiement && item.images.length === 0 && item.description.trim().length < 20);
          if (ficheVide) {
            verdict = {
              decision: "REFUSE",
              motif: "Fiche incomplète — le titre, la description ou l'image sont manquants ou insuffisants pour permettre à un acheteur de comprendre ce qu'il obtient. Complétez la fiche puis resoumettez.",
              signaux: ["fallback_deterministe", "fiche_incomplete"],
            };
          } else {
            verdict = {
              decision: "PUBLIE",
              motif: "Fiche jugée publiable — le contenu paraît honnête et complet. Le doute raisonnable va à la publication.",
              signaux: ["fallback_deterministe", "doute_raisonnable"],
            };
          }
          console.warn(`[product-verification] ${kind}:${item.id} — décidé par fallback déterministe après ${echecsAnterieurs} échec(s) IA.`);
        } else {
          // Journalise l'échec IA comme AgentAction "failed" pour que le
          // compteur monte au prochain passage et déclenche le fallback.
          await prisma.agentAction.create({
            data: {
              agentKey: "product_verification",
              type: "product_decision",
              risk: "low",
              title: `${kind === "formation" ? "Formation" : "Produit"} « ${item.titre.slice(0, 50)} » — IA indéterminée (tentative ${echecsAnterieurs + 1})`,
              reasoning: "L'appel IA n'a pas produit de verdict exploitable (timeout, JSON invalide, ou refus modèle). Nouvelle tentative au prochain passage ; décision déterministe après 2 échecs.",
              targetType: kind, targetId: item.id,
              status: "failed",
              payload: { auto: true, retry: echecsAnterieurs + 1 } as object,
            },
          }).catch(() => null);
          indetermines++;
          return;
        }
      }

      const publie = verdict.decision === "PUBLIE";
      const a = await proposeAction({
        agentKey: "product_verification",
        type: "product_decision",
        risk: "low",
        title: `${kind === "formation" ? "Formation" : "Produit"} « ${item.titre.slice(0, 50)} » — ${publie ? "publié" : "refusé"} par l'agent`,
        reasoning: verdict.motif,
        targetType: kind,
        targetId: item.id,
        payload: { auto: true, verdict, contexte: ctx },
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
        id: f.id, instructeurId: f.instructeurId,
        titre: f.title, description: f.description || f.shortDesc || "",
        prix: f.price, images: f.thumbnail ? [f.thumbnail] : [],
        lienDePaiement: false,
      });
    }
    for (const p of produits) {
      await traiter("product", {
        id: p.id, instructeurId: p.instructeurId,
        titre: p.title, description: p.description || "",
        prix: p.price, images: [p.thumbnail, p.banner].filter((u): u is string => !!u),
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
