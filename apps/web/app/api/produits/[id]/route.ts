// GET /api/produits/[id] — Détail d'un produit numérique
// PUT /api/produits/[id] — Mise à jour (par l'instructeur)
// DELETE /api/produits/[id] — Archivage (par l'instructeur)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";

const updateProductSchema = z.object({
  titleFr: z.string().min(3).optional(),
  titleEn: z.string().min(3).optional(),
  descriptionFr: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  descriptionFormat: z.enum(["text", "tiptap"]).optional(),
  productType: z.enum(["EBOOK", "PDF", "TEMPLATE", "LICENCE", "AUDIO", "VIDEO", "AUTRE"]).optional(),
  categoryId: z.string().optional(),
  price: z.number().min(0).optional(),
  originalPrice: z.number().min(0).optional().nullable(),
  isFree: z.boolean().optional(),
  banner: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileStoragePath: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  fileMimeType: z.string().optional().nullable(),
  previewEnabled: z.boolean().optional(),
  previewPages: z.number().min(1).max(50).optional(),
  watermarkEnabled: z.boolean().optional(),
  maxBuyers: z.number().int().min(1).optional().nullable(),
  tags: z.array(z.string()).optional(),
}).strict();

function getProductDetailInclude() {
  const now = new Date();
  return {
    instructeur: {
      select: {
        id: true,
        bioFr: true,
        bioEn: true,
        user: { select: { name: true, avatar: true, image: true } },
      },
    },
    category: { select: { id: true, nameFr: true, nameEn: true, slug: true } },
    reviews: {
      take: 10,
      orderBy: { createdAt: "desc" as const },
      select: {
        id: true,
        rating: true,
        comment: true,
        response: true,
        respondedAt: true,
        createdAt: true,
        user: { select: { name: true, avatar: true, image: true } },
      },
    },
    flashPromotions: {
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      take: 1,
      select: {
        id: true,
        discountPct: true,
        startsAt: true,
        endsAt: true,
        maxUsage: true,
        usageCount: true,
      },
    },
  } as const;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.digitalProduct.findFirst({
      where: {
        OR: [{ slug: id }, { id }],
        status: "ACTIF",
      },
      include: getProductDetailInclude(),
    });

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    prisma.digitalProduct.update({
      where: { id: product.id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[GET /api/produits/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.digitalProduct.findFirst({
      where: { OR: [{ slug: id }, { id }], instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateProductSchema.parse(body);

    // Build update payload from only provided fields
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    const product = await prisma.digitalProduct.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.issues }, { status: 400 });
    }
    console.error("[PUT /api/produits/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.digitalProduct.findFirst({
      where: { OR: [{ slug: id }, { id }], instructeurId: instructeur.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    await prisma.digitalProduct.update({
      where: { id: existing.id },
      data: { status: "ARCHIVE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/produits/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
