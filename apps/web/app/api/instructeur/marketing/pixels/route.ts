// GET /api/instructeur/marketing/pixels — Liste des pixels configurés
// POST /api/instructeur/marketing/pixels — Ajout d'un pixel

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";

const PIXEL_REGEXES: Record<string, RegExp> = {
  FACEBOOK: /^\d{15,16}$/,
  GOOGLE: /^(AW-|UA-|G-|GT-)[A-Z0-9-]+$/,
  TIKTOK: /^[A-Z0-9]{20,}$/,
};

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouvé" }, { status: 403 });
    }

    const pixels = await prisma.marketingPixel.findMany({
      where: { instructeurId: instructeur.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pixels });
  } catch (error) {
    console.error("[GET /api/instructeur/marketing/pixels]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────

const createPixelSchema = z.object({
  type: z.enum(["FACEBOOK", "GOOGLE", "TIKTOK"]),
  pixelId: z.string().min(1),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createPixelSchema.parse(body);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouvé" }, { status: 403 });
    }

    // Validate pixel ID format
    const regex = PIXEL_REGEXES[data.type];
    if (regex && !regex.test(data.pixelId)) {
      return NextResponse.json(
        { error: `Format de pixel ${data.type} invalide` },
        { status: 400 }
      );
    }

    // Check if pixel type already exists for this instructor
    const existing = await prisma.marketingPixel.findUnique({
      where: {
        instructeurId_type: {
          instructeurId: instructeur.id,
          type: data.type,
        },
      },
    });

    if (existing) {
      const pixel = await prisma.marketingPixel.update({
        where: { id: existing.id },
        data: { pixelId: data.pixelId, isActive: data.isActive },
      });
      return NextResponse.json({ pixel });
    }

    const pixel = await prisma.marketingPixel.create({
      data: {
        instructeurId: instructeur.id,
        type: data.type,
        pixelId: data.pixelId,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ pixel }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[POST /api/instructeur/marketing/pixels]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
