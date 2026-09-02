import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { sendKycSubmittedEmail } from "@/lib/email/kyc";
import { rateLimit } from "@/lib/api-rate-limit";
import { normalizeKycDocumentReference, resolveKycDocumentUrl } from "@/lib/kyc-documents";

/**
 * GET /api/formations/kyc
 * Returns current KYC status + pending request (if any) for the authenticated user.
 *
 * POST /api/formations/kyc
 * Body: { documentType: string, documentUrl: string }
 * Creates a new KYC request at level 2 (pièce d'identité) in EN_ATTENTE status.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        kyc: true,
        kycRequests: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            requestedLevel: true,
            currentLevel: true,
            documentType: true,
            documentUrl: true,
            status: true,
            reviewedBy: true,
            reviewedAt: true,
            refuseReason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "User introuvable" }, { status: 404 });

    const history = await Promise.all(
      user.kycRequests.map(async (request) => ({
        ...request,
        documentUrl: await resolveKycDocumentUrl(request.documentUrl),
      })),
    );
    const pending = history.find((r) => r.status === "EN_ATTENTE");

    return NextResponse.json({
      data: {
        currentLevel: user.kyc ?? 0,
        pending,
        history,
      },
    });
  } catch (err) {
    console.error("[formations/kyc GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Rate limit: 5 KYC submissions per hour
    const rl = await rateLimit(`kyc:${session.user.id}`, 5, 3600_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de soumissions KYC. Réessayez plus tard." }, { status: 429 });
    }

    const body = await request.json();
    const { documentType, documentUrl, documentVersoUrl, selfieUrl, requestedLevel } = body as {
      documentType?: string;
      documentUrl?: string;
      documentVersoUrl?: string;
      selfieUrl?: string;
      requestedLevel?: number;
    };

    const LEVEL_DOCS: Record<number, string[]> = {
      // Identité — liste étendue pour l'Afrique francophone (Bénin, Sénégal, Côte d'Ivoire, etc.)
      2: [
        "CNI",
        "CIP",                    // Certificat d'Identification Personnelle — Bénin
        "PASSEPORT",
        "PERMIS_CONDUIRE",
        "CARTE_CONSULAIRE",       // Pour résidents à l'étranger
        "RECEPISSE",              // Document provisoire d'identité
        "CARTE_ELECTEUR",
        "CARTE_RESIDENT",
      ],
      // Certification pro
      4: ["DIPLOME", "CERTIFICAT_PRO", "ATTESTATION_EMPLOYEUR", "PORTFOLIO_PRO"],
    };
    const level = requestedLevel ?? 2;
    if (!LEVEL_DOCS[level]) {
      return NextResponse.json({ error: "Niveau KYC demandé invalide (2 ou 4)" }, { status: 400 });
    }
    if (!documentType || !LEVEL_DOCS[level].includes(documentType)) {
      return NextResponse.json(
        { error: `Type de document invalide pour niveau ${level}. Attendu : ${LEVEL_DOCS[level].join(", ")}` },
        { status: 400 },
      );
    }
    // ── LES TROIS PIÈCES SONT OBLIGATOIRES ────────────────────────────────
    //
    // Le recto seul ne prouve rien : les dates de validité et le numéro
    // figurent souvent au dos, et sans photo du visage une pièce trouvée ou
    // empruntée suffit à passer. On refuse donc TOUT dossier incomplet, ici
    // et pas seulement dans le formulaire — un appel direct à l'API doit se
    // heurter à la même exigence.
    const manquant: string[] = [];
    if (!documentUrl || typeof documentUrl !== "string" || !documentUrl.trim()) {
      manquant.push("le recto de votre pièce");
    }
    if (!documentVersoUrl || typeof documentVersoUrl !== "string" || !documentVersoUrl.trim()) {
      manquant.push("le verso de votre pièce");
    }
    if (!selfieUrl || typeof selfieUrl !== "string" || !selfieUrl.trim()) {
      manquant.push("votre photo de visage");
    }
    if (manquant.length > 0) {
      return NextResponse.json(
        {
          error: `Dossier incomplet — il manque ${manquant.join(", ")}. Les trois sont obligatoires.`,
          code: "KYC_INCOMPLET",
          manquant,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, kyc: true, email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "User introuvable" }, { status: 404 });

    // Idempotency: refuse if an EN_ATTENTE request exists
    const existing = await prisma.kycRequest.findFirst({
      where: { userId: user.id, status: "EN_ATTENTE" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Une demande est déjà en cours", requestId: existing.id },
        { status: 409 },
      );
    }

    // Only allow level 4 if level 2 is already validated
    if (level === 4 && (user.kyc ?? 0) < 2) {
      return NextResponse.json(
        { error: "Vous devez d'abord valider votre niveau 2 (pièce d'identité) avant de demander la certification pro (niveau 4)." },
        { status: 400 },
      );
    }

    // Les trois références sont garanties non vides par le contrôle plus haut.
    const req = await prisma.kycRequest.create({
      data: {
        userId: user.id,
        currentLevel: user.kyc ?? 0,
        requestedLevel: level,
        documentType,
        documentUrl: normalizeKycDocumentReference(documentUrl!),
        documentVersoUrl: normalizeKycDocumentReference(documentVersoUrl!),
        selfieUrl: normalizeKycDocumentReference(selfieUrl!),
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "ORDER" as const,
        title: "Nouvelle demande KYC",
        message: `Un utilisateur a soumis ses documents de vérification (${documentType}).`,
        link: "/admin/kyc",
      })),
    }).catch(() => null);

    // Email de confirmation à l'utilisateur
    if (user.email) {
      const docLabel = documentType === "CNI" ? "Carte Nationale d'Identité" : documentType === "PASSEPORT" ? "Passeport" : "Permis de conduire";
      await sendKycSubmittedEmail({
        userEmail: user.email,
        userName: user.name ?? user.email.split("@")[0],
        documentType: docLabel,
      }).catch((e) => console.warn("[kyc submit email]", e));
    }

    return NextResponse.json({ data: { id: req.id, status: req.status } });
  } catch (err) {
    console.error("[formations/kyc POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
