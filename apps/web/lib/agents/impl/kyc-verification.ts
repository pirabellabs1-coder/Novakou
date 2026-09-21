import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { resolveKycDocumentUrl } from "@/lib/kyc-documents";
import { appliquerDecisionKyc } from "@/lib/formations/kyc-decision";
import { chatVisionIA, estOpenRouterConfigure, type PartieMessageIA } from "@/lib/ai/openrouter";

/**
 * AGENT DE VÉRIFICATION KYC — autonome, décision fondateur 2026-09-21.
 *
 * Remplace la revue manuelle admin : ce module DÉCIDE (approuve ou refuse
 * avec un motif envoyé à la personne), il ne se contente pas de recommander.
 * L'admin garde un accès (`/admin/kyc`) pour un cas litigieux, mais rien
 * n'exige plus son intervention.
 *
 * ── CE QUE L'AGENT PEUT RAISONNABLEMENT JUGER, ET CE QU'IL NE PEUT PAS ─────
 * Un modèle de vision généraliste peut évaluer : la pièce est-elle lisible,
 * plausible (mise en page d'un document officiel, pas une image quelconque),
 * complète (recto ET verso cohérents entre eux), et le selfie montre-t-il
 * réellement un visage humain net — pas un dessin, un écran, une photo de
 * photo. Il NE fait PAS de reconnaissance faciale biométrique certifiée : on
 * ne prétend pas « cette personne EST ce document » avec une certitude
 * cryptographique, seulement l'absence de signal d'incohérence évidente
 * (âge/sexe manifestement incompatibles, visage absent, document flou au
 * point d'être illisible). C'est le même niveau d'exigence qu'un contrôle
 * humain rapide — pas plus, pas moins.
 *
 * ── SÛRETÉ : UNE ERREUR TECHNIQUE NE DEVIENT JAMAIS UNE DÉCISION ───────────
 * Si l'IA échoue à répondre ou renvoie un format inexploitable, le dossier
 * reste EN_ATTENTE pour le prochain passage. On ne refuse ni n'approuve
 * jamais par défaut sur une panne — un doute technique de notre côté ne doit
 * pas ressembler à un jugement sur la personne.
 */

type Verdict = {
  decision: "APPROUVE" | "REFUSE";
  motif: string;
  signaux: string[];
};

function extraireJson(texte: string): Verdict | null {
  try {
    const m = texte.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as Partial<Verdict>;
    if (j.decision !== "APPROUVE" && j.decision !== "REFUSE") return null;
    // < 10 caractères : `appliquerDecisionKyc` refuserait ce motif comme
    // refus de publication. On le rejette ici plutôt que de laisser le
    // dossier repartir en « failed » pour une raison qu'on peut prévenir.
    if (!j.motif || typeof j.motif !== "string" || j.motif.trim().length < 10) return null;
    return { decision: j.decision, motif: j.motif.trim(), signaux: Array.isArray(j.signaux) ? j.signaux.map(String) : [] };
  } catch {
    return null;
  }
}

const LIBELLES_DOCUMENT: Record<string, string> = {
  CNI: "Carte Nationale d'Identité",
  PASSEPORT: "Passeport",
  PERMIS: "Permis de conduire",
  CARTE_CONSULAIRE: "Carte consulaire",
  CARTE_ELECTEUR: "Carte d'électeur",
  CARTE_RESIDENT: "Carte de résident",
};

async function analyserDossier(k: {
  documentType: string;
  requestedLevel: number;
  documentUrl: string;
  documentVersoUrl: string;
  selfieUrl: string;
}): Promise<Verdict | null> {
  const libelle = LIBELLES_DOCUMENT[k.documentType] ?? k.documentType;

  const systeme = [
    "Tu es l'agent de vérification d'identité (KYC) de Novakou, une marketplace africaine de formations et produits numériques encaissant en Mobile Money.",
    "Ta décision est FINALE et autonome : personne ne la relit avant qu'elle s'applique. Sois rigoureux, pas paranoïaque.",
    "",
    "Trois photos te sont fournies dans l'ordre : (1) RECTO du document, (2) VERSO du document, (3) SELFIE de la personne.",
    `Type de document déclaré : ${libelle}. Niveau KYC demandé : ${k.requestedLevel}.`,
    "",
    "APPROUVE si, et seulement si, les trois conditions suivantes sont réunies :",
    "  1. Le recto ET le verso sont des photos NETTES et LISIBLES d'un document d'identité officiel plausible — pas une capture d'écran, pas une photo d'un écran, pas une image sans rapport (facture, paysage, texte quelconque).",
    "  2. Recto et verso sont cohérents entre eux (même type de document, même mise en page officielle).",
    "  3. Le selfie montre clairement le visage d'une personne réelle — pas un dessin, un logo, une image vide, un objet, ou une photo si floue qu'aucun visage n'est distinguable.",
    "",
    "REFUSE dans tous les autres cas, avec un motif PRÉCIS et ACTIONNABLE (que la personne peut corriger en resoumettant) : nomme EXACTEMENT ce qui cloche (ex. « Le verso de la pièce est flou et le numéro de document n'est pas lisible », « Le selfie ne montre pas de visage humain reconnaissable »).",
    "",
    "Ne refuse JAMAIS pour un motif que la personne ne peut pas corriger (âge, origine apparente, qualité de l'appareil photo si l'image reste lisible). Le doute raisonnable sur la LISIBILITÉ ou la LÉGITIMITÉ va au refus motivé — pas à l'approbation par défaut : une identité mal vérifiée peut ensuite débloquer un retrait d'argent réel.",
    "",
    'Réponds STRICTEMENT en JSON, rien d\'autre : {"decision":"APPROUVE"|"REFUSE","motif":"phrase claire en français, à destination de la personne","signaux":["mot-clé1","mot-clé2"]}',
  ].join("\n");

  const contenu: PartieMessageIA[] = [
    { type: "text", text: "Voici les trois photos à analyser, dans l'ordre recto / verso / selfie." },
    { type: "image_url", image_url: { url: k.documentUrl } },
    { type: "image_url", image_url: { url: k.documentVersoUrl } },
    { type: "image_url", image_url: { url: k.selfieUrl } },
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
    console.warn("[kyc-verification] appel vision échoué :", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function runKycVerification() {
  return recordRun("kyc_verification", async () => {
    if (!estOpenRouterConfigure()) {
      return { itemsProcessed: 0, actionsCreated: 0, summary: "IA non configurée — aucun dossier traité." };
    }

    const cfg = await getAgentConfig("kyc_verification");
    const lot = Math.max(1, Math.min(100, Number(cfg.batchSize) || 15));
    const consignes = String(cfg.instructions || "").trim();

    const dossiers = await prisma.kycRequest.findMany({
      where: { status: "EN_ATTENTE" },
      select: {
        id: true, requestedLevel: true, documentType: true,
        documentUrl: true, documentVersoUrl: true, selfieUrl: true,
        userId: true, createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: lot,
    });

    let decides = 0;
    let incomplets = 0;
    let indetermines = 0;
    const agentId = await agentSystemUserId();

    // Budget de temps : chaque appel vision peut prendre jusqu'à 45 s. Au-delà
    // de ce seuil on s'arrête net et on laisse le reste au passage suivant
    // (cron toutes les 15 min) plutôt que de risquer le timeout de la fonction
    // (`maxDuration` 280 s) — un dossier resterait alors EN_ATTENTE sans même
    // avoir été journalisé comme tenté.
    const DEBUT = Date.now();
    const BUDGET_MS = 220_000;

    for (const k of dossiers) {
      if (Date.now() - DEBUT > BUDGET_MS) break;

      // Dossier incomplet : refus immédiat, sans appel IA — recto, verso et
      // selfie sont OBLIGATOIRES pour toute demande (règle produit KYC).
      if (!k.documentUrl || !k.documentVersoUrl || !k.selfieUrl) {
        const a = await proposeAction({
          agentKey: "kyc_verification",
          type: "kyc_decision",
          risk: "low",
          title: `KYC refusé — pièces manquantes`,
          reasoning: "Recto, verso et selfie sont tous obligatoires. Dossier incomplet.",
          targetType: "kycRequest",
          targetId: k.id,
          payload: { auto: true, motif: "incomplet" },
          dedupeKey: `kyc_verification-${k.id}`,
          execute: async () => {
            const d = await appliquerDecisionKyc({
              kycRequestId: k.id,
              action: "refuse",
              refuseReason:
                "Dossier incomplet : la pièce d'identité (recto ET verso) ainsi qu'un selfie sont tous obligatoires. Soumettez une nouvelle demande avec les trois photos.",
              decidePar: agentId,
            });
            // `proposeAction` ne marque « auto_executed » que sur une vraie
            // réussite : lever ici évite qu'un dossier déjà traité entre-temps
            // (course avec l'admin) reste faussement marqué exécuté.
            if (!d.ok) throw new Error(d.erreur);
            return d;
          },
        });
        if (a) { decides++; incomplets++; }
        continue;
      }

      const [recto, verso, selfie] = await Promise.all([
        resolveKycDocumentUrl(k.documentUrl),
        resolveKycDocumentUrl(k.documentVersoUrl),
        resolveKycDocumentUrl(k.selfieUrl),
      ]);
      if (!recto || !verso || !selfie) {
        // URL de stockage illisible (objet supprimé, bucket injoignable) : ce
        // n'est PAS la faute de la personne — on laisse EN_ATTENTE plutôt que
        // de la pénaliser pour un problème de notre côté.
        indetermines++;
        continue;
      }

      const verdict = await analyserDossier({
        documentType: k.documentType,
        requestedLevel: k.requestedLevel,
        documentUrl: recto,
        documentVersoUrl: verso,
        selfieUrl: selfie,
      });
      if (!verdict) { indetermines++; continue; }

      const approuve = verdict.decision === "APPROUVE";
      const a = await proposeAction({
        agentKey: "kyc_verification",
        type: "kyc_decision",
        risk: "low",
        title: `KYC niveau ${k.requestedLevel} — ${approuve ? "approuvé" : "refusé"} par l'agent`,
        reasoning: `${verdict.motif}${consignes ? `\n\nConsignes appliquées : ${consignes}` : ""}`,
        targetType: "kycRequest",
        targetId: k.id,
        payload: { auto: true, verdict },
        dedupeKey: `kyc_verification-${k.id}`,
        execute: async () => {
          const d = await appliquerDecisionKyc({
            kycRequestId: k.id,
            action: approuve ? "approve" : "refuse",
            refuseReason: approuve ? undefined : verdict.motif,
            decidePar: agentId,
          });
          if (!d.ok) throw new Error(d.erreur);
          return d;
        },
      });
      if (a) decides++;
    }

    return {
      itemsProcessed: dossiers.length,
      actionsCreated: decides,
      summary:
        `${dossiers.length} dossier(s) examiné(s) · ${decides} décidé(s)` +
        (incomplets ? ` (dont ${incomplets} refusé(s) pour pièces manquantes)` : "") +
        (indetermines ? ` · ${indetermines} laissé(s) en attente (panne technique)` : ""),
    };
  });
}
