import { prisma } from "@/lib/prisma";
import { recordRun, proposeAction, getAgentConfig } from "../runtime";
import { agentSystemUserId } from "../system-user";
import { resolveKycDocumentUrl } from "@/lib/kyc-documents";
import { appliquerDecisionKyc } from "@/lib/formations/kyc-decision";
import { chatVisionIA, estOpenRouterConfigure, type PartieMessageIA } from "@/lib/ai/openrouter";

/**
 * AGENT DE VÉRIFICATION KYC AUTONOME.
 *
 * Analyse chaque dossier EN_ATTENTE avec TROIS sources d'information :
 *  1. Les trois photos (recto, verso, selfie) — vision multimodale.
 *  2. L'identité DÉCLARÉE par la personne à la soumission (nom, prénom,
 *     date de naissance, numéro de pièce). Comparaison exigée avec ce qui est
 *     lisible sur la pièce.
 *  3. Le CONTEXTE du compte (pays profil, indicatif téléphonique, date
 *     d'inscription, e-mail vérifié, historique de ventes/retraits). Un
 *     compte neuf qui demande directement un niveau élevé n'est pas jugé
 *     comme un compte établi.
 *
 * Sûreté : une panne IA ne devient jamais une décision. Une incohérence
 * technique de notre côté (URL de stockage illisible) laisse le dossier
 * EN_ATTENTE.
 */

type Verdict = { decision: "APPROUVE" | "REFUSE"; motif: string; signaux: string[] };

function extraireJson(texte: string): Verdict | null {
  try {
    const m = texte.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as Partial<Verdict>;
    if (j.decision !== "APPROUVE" && j.decision !== "REFUSE") return null;
    if (!j.motif || typeof j.motif !== "string" || j.motif.trim().length < 10) return null;
    return { decision: j.decision, motif: j.motif.trim(), signaux: Array.isArray(j.signaux) ? j.signaux.map(String) : [] };
  } catch {
    return null;
  }
}

const LIBELLES_DOCUMENT: Record<string, string> = {
  CNI: "Carte Nationale d'Identité",
  CIP: "Certificat d'Identification Personnelle",
  PASSEPORT: "Passeport",
  PERMIS_CONDUIRE: "Permis de conduire",
  CARTE_CONSULAIRE: "Carte consulaire",
  RECEPISSE: "Récépissé d'identité",
  CARTE_ELECTEUR: "Carte d'électeur",
  CARTE_RESIDENT: "Carte de résident",
};

type ContexteCompte = {
  pays: string | null;
  ancienneteJours: number;
  emailVerifie: boolean;
  kycActuel: number;
  ventesReussies: number;
  retraitsFaits: number;
};

async function contexteCompte(userId: string): Promise<ContexteCompte> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      country: true, createdAt: true, emailVerified: true, kyc: true,
      instructeurProfile: {
        select: {
          digitalProducts: { select: { _count: { select: { purchases: true } } } },
          formations: { select: { _count: { select: { enrollments: true } } } },
          withdrawals: { where: { status: "TRAITE" }, select: { id: true } },
        },
      },
    },
  });
  const ventes =
    (u?.instructeurProfile?.digitalProducts ?? []).reduce((n, p) => n + (p._count?.purchases ?? 0), 0) +
    (u?.instructeurProfile?.formations ?? []).reduce((n, f) => n + (f._count?.enrollments ?? 0), 0);
  return {
    pays: u?.country ?? null,
    ancienneteJours: u ? Math.floor((Date.now() - u.createdAt.getTime()) / 86400_000) : 0,
    emailVerifie: !!u?.emailVerified,
    kycActuel: u?.kyc ?? 1,
    ventesReussies: ventes,
    retraitsFaits: u?.instructeurProfile?.withdrawals?.length ?? 0,
  };
}

async function analyserDossier(k: {
  documentType: string;
  requestedLevel: number;
  documentUrl: string;
  documentVersoUrl: string;
  selfieUrl: string;
  nomLegal: string | null;
  prenomLegal: string | null;
  dateNaissance: Date | null;
  numeroDocument: string | null;
  contexte: ContexteCompte;
}, consignes: string): Promise<Verdict | null> {
  const libelle = LIBELLES_DOCUMENT[k.documentType] ?? k.documentType;
  const dateFr = k.dateNaissance
    ? k.dateNaissance.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "non déclarée";

  const systeme = [
    "Tu es l'agent de vérification d'identité (KYC) de Novakou, une marketplace africaine de formations et produits numériques encaissant en Mobile Money.",
    "Ta décision est FINALE et autonome : personne ne la relit avant qu'elle s'applique. Sois rigoureux, pas paranoïaque.",
    "",
    "Trois photos te sont fournies dans l'ordre : (1) RECTO du document, (2) VERSO du document, (3) SELFIE de la personne.",
    `Type de document déclaré : ${libelle}. Niveau KYC demandé : ${k.requestedLevel}.`,
    "",
    "IDENTITÉ DÉCLARÉE par la personne (à comparer avec ce que tu LIS sur la pièce) :",
    `  Nom : ${k.nomLegal ?? "(non déclaré)"}`,
    `  Prénom : ${k.prenomLegal ?? "(non déclaré)"}`,
    `  Date de naissance : ${dateFr}`,
    `  Numéro de la pièce : ${k.numeroDocument ?? "(non déclaré)"}`,
    "",
    "CONTEXTE DU COMPTE (à titre indicatif — ne refuse PAS pour ces seuls signaux, ils ne servent qu'à graduer la vigilance) :",
    `  Pays du profil : ${k.contexte.pays ?? "(non renseigné)"}`,
    `  Ancienneté du compte : ${k.contexte.ancienneteJours} jour(s)`,
    `  E-mail vérifié : ${k.contexte.emailVerifie ? "oui" : "non"}`,
    `  Niveau KYC actuel : ${k.contexte.kycActuel}`,
    `  Ventes réussies : ${k.contexte.ventesReussies} · Retraits faits : ${k.contexte.retraitsFaits}`,
    "",
    "APPROUVE si TOUTES ces conditions sont réunies :",
    "  1. Le recto ET le verso sont NETS et LISIBLES d'un document d'identité officiel plausible — pas une capture d'écran, pas une photo d'écran, pas une image sans rapport.",
    "  2. Recto et verso sont cohérents entre eux (même type de document, même mise en page officielle).",
    "  3. Le selfie montre clairement le visage d'une personne réelle — pas un dessin, un logo, un objet, ou une photo si floue qu'aucun visage n'est distinguable.",
    "  4. Le NOM et le PRÉNOM lisibles sur la pièce correspondent (ordre, orthographe majeure) à ceux qui ont été DÉCLARÉS. Une divergence évidente (« Kouassi Jean-Claude » sur la pièce vs « Marie Diarra » déclaré) est un refus. Les diacritiques et petites variations d'orthographe sont TOLÉRÉS.",
    "  5. La date de naissance et le numéro de pièce lisibles correspondent aux déclarations, quand ils sont lisibles.",
    "",
    "REFUSE dans tous les autres cas, avec un motif PRÉCIS et ACTIONNABLE : nomme EXACTEMENT ce qui cloche (ex. « Le nom sur la pièce (KOUAME AKISSI) ne correspond pas au nom déclaré (DIALLO FATOU). Vérifiez votre saisie et resoumettez. »).",
    "",
    "Ne refuse JAMAIS pour un motif que la personne ne peut pas corriger (âge, origine, qualité d'appareil photo tant que la pièce reste lisible). Le doute raisonnable sur la LISIBILITÉ ou l'IDENTITÉ va au refus motivé — pas à l'approbation par défaut : une identité mal vérifiée peut ensuite débloquer un retrait d'argent réel.",
    consignes ? `\nConsignes personnalisées de l'équipe Novakou : ${consignes}` : "",
    "",
    'Réponds STRICTEMENT en JSON, rien d\'autre : {"decision":"APPROUVE"|"REFUSE","motif":"phrase claire en français, à destination de la personne","signaux":["mot-clé1"]}',
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
      maxTokens: 600,
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
        nomLegal: true, prenomLegal: true, dateNaissance: true, numeroDocument: true,
      },
      orderBy: { createdAt: "asc" },
      take: lot,
    });

    let decides = 0;
    let incomplets = 0;
    let indetermines = 0;
    const agentId = await agentSystemUserId();

    const DEBUT = Date.now();
    const BUDGET_MS = 220_000;

    for (const k of dossiers) {
      if (Date.now() - DEBUT > BUDGET_MS) break;

      // Dossier incomplet : refus immédiat, sans appel IA.
      const manquant: string[] = [];
      if (!k.documentUrl) manquant.push("recto");
      if (!k.documentVersoUrl) manquant.push("verso");
      if (!k.selfieUrl) manquant.push("selfie");
      // L'identité déclarée est optionnelle en base (colonnes nullables) pour
      // les anciennes soumissions, mais obligatoire pour les nouvelles depuis
      // 2026-09-23. Un dossier sans identité déclarée est refusé net.
      if (!k.nomLegal || !k.prenomLegal) manquant.push("nom/prénom déclarés");
      if (manquant.length > 0) {
        const a = await proposeAction({
          agentKey: "kyc_verification",
          type: "kyc_decision",
          risk: "low",
          title: `KYC refusé — pièces ou informations manquantes`,
          reasoning: `Éléments absents : ${manquant.join(", ")}.`,
          targetType: "kycRequest",
          targetId: k.id,
          payload: { auto: true, motif: "incomplet", manquant },
          dedupeKey: `kyc_verification-${k.id}`,
          execute: async () => {
            const d = await appliquerDecisionKyc({
              kycRequestId: k.id,
              action: "refuse",
              refuseReason:
                `Dossier incomplet — éléments manquants : ${manquant.join(", ")}. ` +
                "Soumettez une nouvelle demande complète (nom, prénom, date de naissance, numéro de pièce, recto, verso et selfie).",
              decidePar: agentId,
            });
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
      if (!recto || !verso || !selfie) { indetermines++; continue; }

      const ctx = await contexteCompte(k.userId);
      const verdict = await analyserDossier({
        documentType: k.documentType,
        requestedLevel: k.requestedLevel,
        documentUrl: recto,
        documentVersoUrl: verso,
        selfieUrl: selfie,
        nomLegal: k.nomLegal,
        prenomLegal: k.prenomLegal,
        dateNaissance: k.dateNaissance,
        numeroDocument: k.numeroDocument,
        contexte: ctx,
      }, consignes);
      if (!verdict) { indetermines++; continue; }

      const approuve = verdict.decision === "APPROUVE";
      const a = await proposeAction({
        agentKey: "kyc_verification",
        type: "kyc_decision",
        risk: "low",
        title: `KYC niveau ${k.requestedLevel} — ${approuve ? "approuvé" : "refusé"} par l'agent`,
        reasoning: verdict.motif,
        targetType: "kycRequest",
        targetId: k.id,
        payload: { auto: true, verdict, contexte: ctx },
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
        (incomplets ? ` (dont ${incomplets} refus pour incomplétude)` : "") +
        (indetermines ? ` · ${indetermines} laissé(s) en attente (panne technique)` : ""),
    };
  });
}
