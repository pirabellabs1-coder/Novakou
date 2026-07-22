import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api/verify-key";
import {
  apiError,
  apiSuccess,
  parsePagination,
} from "@/lib/api/v1-helpers";
import {
  DigitalProductStatus,
  DigitalProductType,
  FormationStatus,
} from "@prisma/client";
import { slugify } from "@/lib/formations/slugs";

/**
 * GET /api/v1/products
 *
 * Liste les produits du vendeur (formations + produits digitaux fusionnés).
 *
 * Query params:
 *   - page    (int, défaut 1)
 *   - limit   (int, défaut 20, max 100)
 *   - status  ("ACTIF" | "BROUILLON" | "ARCHIVE" | "REFUSE")
 *   - kind    ("formation" | "product") — filtrer par type
 *
 * Scope requis : read:products
 */
export async function GET(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "read:products" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url);
    const statusFilter = url.searchParams.get("status");
    const kindFilter = url.searchParams.get("kind");

    const wantsFormations = !kindFilter || kindFilter === "formation";
    const wantsProducts = !kindFilter || kindFilter === "product";

    const formationStatus = isValidEnum(FormationStatus, statusFilter);
    const productStatus = isValidEnum(DigitalProductStatus, statusFilter);

    // Si un statut est DEMANDÉ mais invalide pour un modèle (ex. REFUSE existe
    // pour les produits mais pas les formations), ce modèle ne doit renvoyer
    // RIEN — sinon `status: null` = aucun filtre = TOUT est renvoyé (bug).
    const hasStatus = !!statusFilter;
    const skipFormations = !wantsFormations || (hasStatus && !formationStatus);
    const skipProducts = !wantsProducts || (hasStatus && !productStatus);

    // Counts (always run for accurate pagination)
    const [formationsCount, productsCount] = await Promise.all([
      !skipFormations
        ? prisma.formation.count({
            where: {
              instructeurId: ctx.instructeurId,
              ...(formationStatus ? { status: formationStatus } : {}),
            },
          })
        : Promise.resolve(0),
      !skipProducts
        ? prisma.digitalProduct.count({
            where: {
              instructeurId: ctx.instructeurId,
              ...(productStatus ? { status: productStatus } : {}),
            },
          })
        : Promise.resolve(0),
    ]);

    const total = formationsCount + productsCount;

    // Fetch enough rows from each table to cover the requested page after merge.
    // Simpler than cursor-based: fetch (skip + limit) from each, merge, slice.
    const fetchSize = skip + limit;

    const [formations, products] = await Promise.all([
      wantsFormations
        ? prisma.formation.findMany({
            where: {
              instructeurId: ctx.instructeurId,
              ...(formationStatus ? { status: formationStatus } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: fetchSize,
            select: {
              id: true,
              slug: true,
              title: true,
              shortDesc: true,
              price: true,
              originalPrice: true,
              isFree: true,
              status: true,
              thumbnail: true,
              duration: true,
              studentsCount: true,
              rating: true,
              reviewsCount: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        : Promise.resolve([]),
      wantsProducts
        ? prisma.digitalProduct.findMany({
            where: {
              instructeurId: ctx.instructeurId,
              ...(productStatus ? { status: productStatus } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: fetchSize,
            select: {
              id: true,
              slug: true,
              title: true,
              productType: true,
              price: true,
              originalPrice: true,
              isFree: true,
              status: true,
              banner: true,
              salesCount: true,
              rating: true,
              reviewsCount: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // Normalize into a unified shape, then merge & paginate
    const merged = [
      ...formations.map((f) => ({
        id: f.id,
        slug: f.slug,
        kind: "formation" as const,
        title: f.title,
        shortDesc: f.shortDesc,
        price: f.price,
        originalPrice: f.originalPrice,
        isFree: f.isFree,
        status: f.status,
        thumbnail: f.thumbnail,
        durationMin: f.duration,
        studentsCount: f.studentsCount,
        rating: f.rating,
        reviewsCount: f.reviewsCount,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      ...products.map((p) => ({
        id: p.id,
        slug: p.slug,
        kind: "product" as const,
        productType: p.productType,
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice,
        isFree: p.isFree,
        status: p.status,
        thumbnail: p.banner,
        salesCount: p.salesCount,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const slice = merged.slice(skip, skip + limit);

    return apiSuccess(slice, { page, limit, total });
  } catch (err) {
    console.error("[v1/products GET]", err);
    return apiError("SERVER_ERROR", "Erreur serveur", 500);
  }
}

/**
 * POST /api/v1/products
 *
 * Crée un produit digital (e-book, PDF, template, audio) ou démarre un brouillon
 * de formation. Pour ajouter modules + leçons à une formation, utilisez les
 * endpoints internes via session — l'API publique se limite à un produit simple.
 *
 * Body (JSON):
 *   - kind:        "formation" | "product"  (requis)
 *   - title:       string                    (requis)
 *   - price:       number (FCFA)             (requis, 0 = gratuit)
 *   - description: string?                   (HTML autorisé)
 *   - categoryId:  string?                   (sinon catégorie "Divers")
 *   - thumbnail:   string?                   (URL banner/cover)
 *   - originalPrice: number?
 *   - productType: "EBOOK" | "PDF" | "TEMPLATE" | "AUDIO" | "VIDEO" | "LICENCE" | "AUTRE"
 *                  (requis si kind = "product")
 *   - fileUrl:     string?                   (URL Supabase signée pour produits)
 *   - publish:     boolean (défaut false → BROUILLON)
 *
 * Scope requis : write:products
 */
export async function POST(request: NextRequest) {
  const ctx = await verifyApiKey(request, { requiredScope: "write:products" });
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return apiError("INVALID_PARAMS", "Body JSON invalide", 400);
    }

    const {
      kind,
      title,
      description,
      price,
      originalPrice,
      categoryId,
      thumbnail,
      productType,
      fileUrl,
      files,
      publish,
    } = body as Record<string, unknown>;

    if (kind !== "formation" && kind !== "product") {
      return apiError(
        "INVALID_PARAMS",
        "kind doit être 'formation' ou 'product'",
        400,
      );
    }
    if (typeof title !== "string" || title.trim().length < 2) {
      return apiError("INVALID_PARAMS", "title requis (min 2 caractères)", 400);
    }
    if (typeof price !== "number" || price < 0) {
      return apiError("INVALID_PARAMS", "price requis (number ≥ 0)", 400);
    }

    // Resolve category — fallback to first available "Divers" or any active one
    let resolvedCategoryId: string;
    if (typeof categoryId === "string" && categoryId) {
      const exists = await prisma.formationCategory.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!exists) {
        return apiError("INVALID_PARAMS", "categoryId introuvable", 400);
      }
      resolvedCategoryId = exists.id;
    } else {
      const fallback =
        (await prisma.formationCategory.findFirst({
          where: { slug: "divers" },
          select: { id: true },
        })) ??
        (await prisma.formationCategory.findFirst({
          where: { isActive: true },
          select: { id: true },
        }));
      if (!fallback) {
        const created = await prisma.formationCategory.create({
          data: { name: "Divers", slug: "divers", isActive: true },
          select: { id: true },
        });
        resolvedCategoryId = created.id;
      } else {
        resolvedCategoryId = fallback.id;
      }
    }

    const slug = await uniqueSlug(title as string, kind);
    const shouldPublish = publish === true;

    // Rattache le produit à la boutique PRIMAIRE du vendeur (même ordre que le
    // dashboard : isPrimary puis ancienneté). SANS ça, shopId reste null et le
    // produit — bien que public — n'apparaît PAS dans la liste du vendeur, qui
    // est filtrée par la boutique active. Voir le même correctif sur les tunnels.
    const shopId =
      (
        await prisma.vendorShop.findFirst({
          where: { instructeurId: ctx.instructeurId },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          select: { id: true },
        })
      )?.id ?? null;

    if (kind === "formation") {
      const created = await prisma.formation.create({
        data: {
          slug,
          title: (title as string).trim(),
          description:
            typeof description === "string" ? description.trim() : null,
          categoryId: resolvedCategoryId,
          thumbnail: typeof thumbnail === "string" ? thumbnail : null,
          price: price as number,
          originalPrice:
            typeof originalPrice === "number" ? originalPrice : null,
          isFree: (price as number) === 0,
          status: shouldPublish ? "ACTIF" : "BROUILLON",
          instructeurId: ctx.instructeurId,
          shopId,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          price: true,
          createdAt: true,
        },
      });
      return apiSuccess({ ...created, kind: "formation" }, undefined, 201);
    }

    // kind === "product"
    const validProductTypes: DigitalProductType[] = [
      "EBOOK",
      "PDF",
      "TEMPLATE",
      "AUDIO",
      "VIDEO",
      "LICENCE",
      "AUTRE",
    ];
    const type =
      typeof productType === "string" &&
      validProductTypes.includes(productType as DigitalProductType)
        ? (productType as DigitalProductType)
        : "EBOOK";

    const safeFiles = Array.isArray(files)
      ? (files as unknown[])
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
          }))
      : [];

    const filesToCreate = safeFiles.length > 0
      ? safeFiles
      : (typeof fileUrl === "string" && fileUrl.trim()
          ? [{ name: fileUrl.split("/").pop() ?? "fichier", url: fileUrl.trim(), size: null, mimeType: null, order: 0 }]
          : []);

    const created = await prisma.digitalProduct.create({
      data: {
        slug,
        title: (title as string).trim(),
        description: typeof description === "string" ? description.trim() : null,
        productType: type,
        categoryId: resolvedCategoryId,
        banner: typeof thumbnail === "string" ? thumbnail : null,
        fileUrl: filesToCreate[0]?.url ?? null,
        price: price as number,
        originalPrice: typeof originalPrice === "number" ? originalPrice : null,
        isFree: (price as number) === 0,
        status: shouldPublish ? "ACTIF" : "BROUILLON",
        instructeurId: ctx.instructeurId,
        shopId,
        ...(filesToCreate.length > 0 ? { files: { create: filesToCreate } } : {}),
      },
      include: {
        files: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, url: true, size: true, mimeType: true, order: true },
        },
      },
    });
    return apiSuccess(
      {
        id: created.id,
        slug: created.slug,
        title: created.title,
        productType: created.productType,
        status: created.status,
        price: created.price,
        files: created.files,
        createdAt: created.createdAt,
        kind: "product",
      },
      undefined,
      201,
    );
  } catch (err) {
    console.error("[v1/products POST]", err);
    return apiError(
      "SERVER_ERROR",
      err instanceof Error ? err.message : "Erreur serveur",
      500,
    );
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────

// Slugification partagee : coupe sur une frontiere de mot (l ancienne
// version tronquait a 80 caracteres au caractere pres).

async function uniqueSlug(
  title: string,
  kind: "formation" | "product",
): Promise<string> {
  const base = slugify(title) || `produit-${Date.now()}`;
  let slug = base;
  let suffix = 1;

  while (true) {
    const taken =
      kind === "formation"
        ? await prisma.formation.findUnique({
            where: { slug },
            select: { id: true },
          })
        : await prisma.digitalProduct.findUnique({
            where: { slug },
            select: { id: true },
          });
    if (!taken) return slug;
    slug = `${base}-${suffix++}`;
  }
}

function isValidEnum<T extends Record<string, string>>(
  e: T,
  v: string | null,
): T[keyof T] | null {
  if (!v) return null;
  return Object.values(e).includes(v as T[keyof T]) ? (v as T[keyof T]) : null;
}
