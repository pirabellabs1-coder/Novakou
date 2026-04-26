import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import { apiError, apiSuccess } from "@/lib/api/v1-helpers";
import { DigitalProductType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/products/:id
 *
 * Détail d'un produit (formation OU produit digital). L'ID peut être un cuid
 * Formation, un cuid DigitalProduct, ou un slug.
 *
 * Scope requis : read:products
 */
export async function GET(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:products" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const product = await findOwnedProduct(id, ctx.instructeurId);
    if (!product) return apiError("NOT_FOUND", "Produit introuvable", 404);
    return apiSuccess(product);
  } catch (err) {
    console.error("[v1/products/:id GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}

/**
 * PATCH /api/v1/products/:id
 *
 * Met à jour les champs modifiables d'un produit. Champs autorisés :
 *   - title, description, price, originalPrice, status, thumbnail
 *   - productType, fileUrl  (produits digitaux uniquement)
 *
 * Scope requis : write:products
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "write:products" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError("INVALID_PARAMS", "Body JSON invalide", 400);
    }

    // Locate the product (formation or digital)
    const found = await locateOwned(id, ctx.instructeurId);
    if (!found) return apiError("NOT_FOUND", "Produit introuvable", 404);

    const { title, description, price, originalPrice, status, thumbnail } =
      body as Record<string, unknown>;

    if (found.kind === "formation") {
      const updated = await prisma.formation.update({
        where: { id: found.id },
        data: {
          title: typeof title === "string" ? title.trim() : undefined,
          description:
            description !== undefined
              ? typeof description === "string"
                ? description.trim()
                : null
              : undefined,
          price: typeof price === "number" ? price : undefined,
          originalPrice:
            originalPrice !== undefined
              ? typeof originalPrice === "number"
                ? originalPrice
                : null
              : undefined,
          isFree: typeof price === "number" ? price === 0 : undefined,
          status: isFormationStatus(status) ? status : undefined,
          thumbnail:
            thumbnail !== undefined
              ? typeof thumbnail === "string"
                ? thumbnail
                : null
              : undefined,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          price: true,
          updatedAt: true,
        },
      });
      return apiSuccess({ ...updated, kind: "formation" });
    }

    // Digital product
    const { productType, fileUrl, files } = body as Record<string, unknown>;
    const validProductTypes: DigitalProductType[] = [
      "EBOOK",
      "PDF",
      "TEMPLATE",
      "AUDIO",
      "VIDEO",
      "LICENCE",
      "AUTRE",
    ];

    // Optional files array — replace all on PATCH if provided.
    let filesUpdate:
      | {
          deleteMany: object;
          create: Array<{ name: string; url: string; size: number | null; mimeType: string | null; order: number }>;
        }
      | undefined;
    if (Array.isArray(files)) {
      const safe = (files as unknown[])
        .filter((f): f is { name?: string; url: string; size?: number; mimeType?: string } =>
          !!f && typeof f === "object" && typeof (f as { url?: unknown }).url === "string" && !!(f as { url?: string }).url,
        )
        .slice(0, 50)
        .map((f, idx) => ({
          name: typeof f.name === "string" && f.name.trim() ? f.name.trim() : `fichier-${idx + 1}`,
          url: f.url.trim(),
          size: typeof f.size === "number" ? f.size : null,
          mimeType: typeof f.mimeType === "string" ? f.mimeType : null,
          order: idx,
        }));
      filesUpdate = { deleteMany: {}, create: safe };
    }

    // Keep the legacy `fileUrl` scalar in sync with the first item of the new
    // `files` array. Buyer-side delivery still reads `fileUrl` for backward compat.
    const fileUrlSync =
      filesUpdate
        ? (filesUpdate.create[0]?.url ?? null)
        : fileUrl !== undefined
          ? typeof fileUrl === "string"
            ? fileUrl
            : null
          : undefined;

    const updated = await prisma.digitalProduct.update({
      where: { id: found.id },
      data: {
        title: typeof title === "string" ? title.trim() : undefined,
        description:
          description !== undefined
            ? typeof description === "string"
              ? description.trim()
              : null
            : undefined,
        price: typeof price === "number" ? price : undefined,
        originalPrice:
          originalPrice !== undefined
            ? typeof originalPrice === "number"
              ? originalPrice
              : null
            : undefined,
        isFree: typeof price === "number" ? price === 0 : undefined,
        status: isDigitalStatus(status) ? status : undefined,
        banner:
          thumbnail !== undefined
            ? typeof thumbnail === "string"
              ? thumbnail
              : null
            : undefined,
        productType:
          typeof productType === "string" &&
          validProductTypes.includes(productType as DigitalProductType)
            ? (productType as DigitalProductType)
            : undefined,
        fileUrl: fileUrlSync,
        ...(filesUpdate ? { files: filesUpdate } : {}),
      },
      include: {
        files: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, url: true, size: true, mimeType: true, order: true },
        },
      },
    });
    return apiSuccess({
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      productType: updated.productType,
      status: updated.status,
      price: updated.price,
      updatedAt: updated.updatedAt,
      files: updated.files,
      kind: "product",
    });
  } catch (err) {
    console.error("[v1/products/:id PATCH]", err);
    return apiError(
      "SERVER_ERROR",
      err instanceof Error ? err.message : "Erreur serveur",
      500,
    );
  }
}

/**
 * DELETE /api/v1/products/:id
 *
 * Supprime définitivement un produit (formation OU produit digital).
 *
 * Scope requis : write:products
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const ctx = await verifyApiKey(request, { requiredScope: "write:products" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const { id } = await params;
    const found = await locateOwned(id, ctx.instructeurId);
    if (!found) return apiError("NOT_FOUND", "Produit introuvable", 404);

    if (found.kind === "formation") {
      await prisma.formation.delete({ where: { id: found.id } });
    } else {
      await prisma.digitalProduct.delete({ where: { id: found.id } });
    }

    return apiSuccess({ id: found.id, deleted: true });
  } catch (err) {
    console.error("[v1/products/:id DELETE]", err);
    return apiError(
      "SERVER_ERROR",
      err instanceof Error ? err.message : "Erreur serveur",
      500,
    );
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────

async function findOwnedProduct(
  idOrSlug: string,
  instructeurId: string,
) {
  const formation = await prisma.formation.findFirst({
    where: {
      instructeurId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      sections: {
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              order: true,
              isFree: true,
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
  if (formation) {
    return {
      id: formation.id,
      slug: formation.slug,
      kind: "formation" as const,
      title: formation.title,
      shortDesc: formation.shortDesc,
      description: formation.description,
      price: formation.price,
      originalPrice: formation.originalPrice,
      isFree: formation.isFree,
      status: formation.status,
      thumbnail: formation.thumbnail,
      durationMin: formation.duration,
      category: formation.category,
      modules: formation.sections.length,
      lessons: formation.sections.reduce((s, m) => s + m.lessons.length, 0),
      curriculum: formation.sections,
      studentsCount: formation.studentsCount,
      rating: formation.rating,
      reviewsCount: formation.reviewsCount,
      createdAt: formation.createdAt,
      updatedAt: formation.updatedAt,
    };
  }

  const product = await prisma.digitalProduct.findFirst({
    where: {
      instructeurId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      files: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, url: true, size: true, mimeType: true, order: true },
      },
    },
  });
  if (product) {
    return {
      id: product.id,
      slug: product.slug,
      kind: "product" as const,
      productType: product.productType,
      title: product.title,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      isFree: product.isFree,
      status: product.status,
      thumbnail: product.banner,
      fileUrl: product.fileUrl,
      files: product.files,
      category: product.category,
      salesCount: product.salesCount,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      tags: product.tags,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
  return null;
}

async function locateOwned(idOrSlug: string, instructeurId: string) {
  const f = await prisma.formation.findFirst({
    where: { instructeurId, OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true },
  });
  if (f) return { kind: "formation" as const, id: f.id };
  const p = await prisma.digitalProduct.findFirst({
    where: { instructeurId, OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true },
  });
  if (p) return { kind: "product" as const, id: p.id };
  return null;
}

function isFormationStatus(
  v: unknown,
): v is "BROUILLON" | "EN_ATTENTE" | "ACTIF" | "ARCHIVE" {
  return (
    v === "BROUILLON" ||
    v === "EN_ATTENTE" ||
    v === "ACTIF" ||
    v === "ARCHIVE"
  );
}

function isDigitalStatus(
  v: unknown,
): v is "BROUILLON" | "EN_ATTENTE" | "ACTIF" | "ARCHIVE" | "REFUSE" {
  return (
    v === "BROUILLON" ||
    v === "EN_ATTENTE" ||
    v === "ACTIF" ||
    v === "ARCHIVE" ||
    v === "REFUSE"
  );
}
