import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStorageFields } from "@/lib/storage-resolver";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/formations/public/produit/[slug]
 * Returns full product details for the public page.
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const product = await prisma.digitalProduct.findUnique({
      where: { slug },
      include: {
        instructeur: {
          select: {
            id: true,
            user: { select: { id: true, name: true, image: true, kyc: true } },
            bioFr: true,
            expertise: true,
            yearsExp: true,
            marketingPixels: {
              where: { isActive: true },
              select: { type: true, pixelId: true },
            },
          },
        },
        category: { select: { id: true, slug: true, name: true } },
        // Boutique du produit → footer boutique + identité sur la page produit.
        shop: { select: { slug: true, name: true, legalName: true, font: true, themeColor: true } },
        files: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, mimeType: true },
        },
        reviews: {
          where: { rating: { gte: 1 } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!product || product.status !== "ACTIF") {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    // Increment view count in background
    prisma.digitalProduct
      .update({
        where: { id: product.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => null);

    // Whether the buyer can use the preview tab: opt-in by vendor, and at
    // least one file (legacy fileUrl included) is a PDF that pdf-lib can read.
    const hasPdfFile =
      product.files.some((f) => (f.mimeType ?? "").toLowerCase() === "application/pdf") ||
      (typeof product.fileUrl === "string" && product.fileUrl.toLowerCase().endsWith(".pdf"));
    const previewAvailable = product.previewEnabled === true && hasPdfFile;

    const payload = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      descriptionFormat: product.descriptionFormat,
      productType: product.productType,
      thumbnail: product.thumbnail,
      banner: product.banner,
      price: product.price,
      originalPrice: product.originalPrice,
      currency: "XOF",
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      salesCount: product.salesCount,
      viewsCount: product.viewsCount,
      tags: product.tags,
      maxBuyers: product.maxBuyers,
      currentBuyers: product.currentBuyers,
      salesEndAt: product.salesEndAt ? product.salesEndAt.toISOString() : null,
      previewEnabled: product.previewEnabled,
      previewPages: product.previewPages,
      watermarkEnabled: product.watermarkEnabled,
      previewAvailable,
      category: product.category,
      instructeur: {
        id: product.instructeur.id,
        userId: product.instructeur.user.id,
        name: product.instructeur.user.name,
        image: product.instructeur.user.image,
        verified: (product.instructeur.user.kyc ?? 1) >= 3,
        bio: product.instructeur.bioFr,
        expertise: product.instructeur.expertise,
        yearsExp: product.instructeur.yearsExp,
        marketingPixels: product.instructeur.marketingPixels,
      },
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          name: r.user.name,
          image: r.user.image,
        },
      })),
      shop: product.shop
        ? {
            slug: product.shop.slug,
            name: product.shop.name,
            legalName: product.shop.legalName,
            font: product.shop.font,
            themeColor: product.shop.themeColor,
          }
        : null,
      createdAt: product.createdAt,
    };

    // Résout thumbnail, banner, instructeur.image, reviews[].user.image en signed URLs.
    return NextResponse.json({ data: await resolveStorageFields(payload) });
  } catch (err) {
    console.error("[public/produit/[slug]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
