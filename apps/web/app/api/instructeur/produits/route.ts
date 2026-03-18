// GET    /api/instructeur/produits — Liste des produits numériques de l'instructeur connecté
// POST   /api/instructeur/produits — Créer un nouveau produit numérique
// PUT    /api/instructeur/produits — Mettre à jour un produit (id requis dans le body)
// DELETE /api/instructeur/produits — Archiver un produit (id requis en query param)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { z } from "zod";

// ── Schémas Zod ────────────────────────────────────────────────────────────

const createProductSchema = z.object({
  titleFr: z.string().min(3).max(120),
  titleEn: z.string().min(3).max(120),
  descriptionFr: z.string().max(10000).optional().nullable(),
  descriptionEn: z.string().max(10000).optional().nullable(),
  descriptionFormat: z.enum(["text", "tiptap"]).default("text"),
  type: z.enum(["EBOOK", "PDF", "TEMPLATE", "LICENCE", "AUDIO", "VIDEO", "AUTRE"]),
  categoryId: z.string().min(1),
  price: z.number().min(0).max(10000),
  originalPrice: z.number().min(0).optional().nullable(),
  isFree: z.boolean().default(false),
  banner: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileStoragePath: z.string().optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  fileMimeType: z.string().optional().nullable(),
  previewEnabled: z.boolean().default(false),
  previewPages: z.number().int().min(1).max(50).default(5),
  watermarkEnabled: z.boolean().default(true),
  maxBuyers: z.number().int().min(1).optional().nullable(),
  tags: z.array(z.string()).default([]),
});

const updateProductSchema = z.object({
  id: z.string().min(1),
  titleFr: z.string().min(3).max(120).optional(),
  titleEn: z.string().min(3).max(120).optional(),
  descriptionFr: z.string().max(10000).optional().nullable(),
  descriptionEn: z.string().max(10000).optional().nullable(),
  descriptionFormat: z.enum(["text", "tiptap"]).optional(),
  type: z.enum(["EBOOK", "PDF", "TEMPLATE", "LICENCE", "AUDIO", "VIDEO", "AUTRE"]).optional(),
  categoryId: z.string().min(1).optional(),
  price: z.number().min(0).max(10000).optional(),
  originalPrice: z.number().min(0).optional().nullable(),
  isFree: z.boolean().optional(),
  banner: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  fileStoragePath: z.string().optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  fileMimeType: z.string().optional().nullable(),
  previewEnabled: z.boolean().optional(),
  previewPages: z.number().int().min(1).max(50).optional(),
  watermarkEnabled: z.boolean().optional(),
  maxBuyers: z.number().int().min(1).optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["BROUILLON", "EN_ATTENTE", "ACTIF", "PAUSE"]).optional(),
});

// ── Select standard pour les réponses de liste ──────────────────────────────

const productListSelect = {
  id: true,
  slug: true,
  titleFr: true,
  titleEn: true,
  productType: true,
  price: true,
  salesCount: true,
  viewsCount: true,
  rating: true,
  reviewsCount: true,
  maxBuyers: true,
  currentBuyers: true,
  status: true,
  createdAt: true,
} as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Génère un slug unique à partir d'un titre français */
async function generateUniqueSlug(titleFr: string): Promise<string> {
  const baseSlug = titleFr
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);

  let slug = baseSlug;
  let counter = 1;
  while (await prisma.digitalProduct.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

/** Résout l'instructeur pour l'utilisateur connecté ou retourne null */
async function resolveInstructeur(userId: string) {
  return prisma.instructeurProfile.findUnique({ where: { userId } });
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await resolveInstructeur(session.user.id);

    if (!instructeur) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.digitalProduct.findMany({
      where: { instructeurId: instructeur.id },
      select: productListSelect,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[GET /api/instructeur/produits]", error);
    return NextResponse.json([]);
  }
}

// ── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await resolveInstructeur(session.user.id);
    if (!instructeur) {
      return NextResponse.json({ error: "Compte instructeur introuvable" }, { status: 403 });
    }

    if (instructeur.status !== "APPROUVE") {
      return NextResponse.json({ error: "Compte instructeur non approuvé" }, { status: 403 });
    }

    const body = await req.json();
    const data = createProductSchema.parse(body);

    const slug = await generateUniqueSlug(data.titleFr);

    const product = await prisma.digitalProduct.create({
      data: {
        slug,
        titleFr: data.titleFr,
        titleEn: data.titleEn,
        descriptionFr: data.descriptionFr ?? null,
        descriptionEn: data.descriptionEn ?? null,
        descriptionFormat: data.descriptionFormat,
        productType: data.type,
        categoryId: data.categoryId,
        price: data.price,
        originalPrice: data.originalPrice ?? null,
        isFree: data.isFree,
        banner: data.banner ?? null,
        fileUrl: data.fileUrl ?? null,
        fileStoragePath: data.fileStoragePath ?? null,
        fileSize: data.fileSize ?? null,
        fileMimeType: data.fileMimeType ?? null,
        previewEnabled: data.previewEnabled,
        previewPages: data.previewPages,
        watermarkEnabled: data.watermarkEnabled,
        maxBuyers: data.maxBuyers ?? null,
        tags: data.tags,
        instructeurId: instructeur.id,
        status: "BROUILLON",
      },
      select: productListSelect,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[POST /api/instructeur/produits]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PUT ─────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await resolveInstructeur(session.user.id);
    if (!instructeur) {
      return NextResponse.json({ error: "Compte instructeur introuvable" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...fields } = updateProductSchema.parse(body);

    // Vérifier que le produit existe et appartient à cet instructeur
    const existing = await prisma.digitalProduct.findFirst({
      where: { id, instructeurId: instructeur.id },
    });

    if (!existing) {
      // Distinguer "non trouvé" de "non propriétaire" pour un meilleur feedback
      const anyExisting = await prisma.digitalProduct.findUnique({ where: { id } });
      if (anyExisting) {
        return NextResponse.json(
          { error: "Vous n'êtes pas autorisé à modifier ce produit" },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    // Construire le payload de mise à jour avec uniquement les champs fournis
    const updateData: Record<string, unknown> = {};
    if (fields.titleFr !== undefined) updateData.titleFr = fields.titleFr;
    if (fields.titleEn !== undefined) updateData.titleEn = fields.titleEn;
    if (fields.descriptionFr !== undefined) updateData.descriptionFr = fields.descriptionFr;
    if (fields.descriptionEn !== undefined) updateData.descriptionEn = fields.descriptionEn;
    if (fields.descriptionFormat !== undefined) updateData.descriptionFormat = fields.descriptionFormat;
    if (fields.type !== undefined) updateData.productType = fields.type;
    if (fields.categoryId !== undefined) updateData.categoryId = fields.categoryId;
    if (fields.price !== undefined) updateData.price = fields.price;
    if (fields.originalPrice !== undefined) updateData.originalPrice = fields.originalPrice;
    if (fields.isFree !== undefined) updateData.isFree = fields.isFree;
    if (fields.banner !== undefined) updateData.banner = fields.banner;
    if (fields.fileUrl !== undefined) updateData.fileUrl = fields.fileUrl;
    if (fields.fileStoragePath !== undefined) updateData.fileStoragePath = fields.fileStoragePath;
    if (fields.fileSize !== undefined) updateData.fileSize = fields.fileSize;
    if (fields.fileMimeType !== undefined) updateData.fileMimeType = fields.fileMimeType;
    if (fields.previewEnabled !== undefined) updateData.previewEnabled = fields.previewEnabled;
    if (fields.previewPages !== undefined) updateData.previewPages = fields.previewPages;
    if (fields.watermarkEnabled !== undefined) updateData.watermarkEnabled = fields.watermarkEnabled;
    if (fields.maxBuyers !== undefined) updateData.maxBuyers = fields.maxBuyers;
    if (fields.tags !== undefined) updateData.tags = fields.tags;
    if (fields.status !== undefined) updateData.status = fields.status;

    // Si le titre FR change, régénérer le slug
    if (fields.titleFr !== undefined && fields.titleFr !== existing.titleFr) {
      updateData.slug = await generateUniqueSlug(fields.titleFr);
    }

    const product = await prisma.digitalProduct.update({
      where: { id: existing.id },
      data: updateData,
      select: productListSelect,
    });

    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }
    console.error("[PUT /api/instructeur/produits]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const instructeur = await resolveInstructeur(session.user.id);
    if (!instructeur) {
      return NextResponse.json({ error: "Compte instructeur introuvable" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Paramètre id requis" }, { status: 400 });
    }

    // Vérifier que le produit existe et appartient à cet instructeur
    const existing = await prisma.digitalProduct.findFirst({
      where: { id, instructeurId: instructeur.id },
    });

    if (!existing) {
      const anyExisting = await prisma.digitalProduct.findUnique({ where: { id } });
      if (anyExisting) {
        return NextResponse.json(
          { error: "Vous n'êtes pas autorisé à archiver ce produit" },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    // Archivage soft-delete : passe le statut à ARCHIVE
    await prisma.digitalProduct.update({
      where: { id: existing.id },
      data: { status: "ARCHIVE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/instructeur/produits]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
