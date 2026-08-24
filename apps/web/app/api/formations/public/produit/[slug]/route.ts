import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
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
        // Anonymat : on n'expose que l'id (pixels/reco/inquiry cote client) et
        // les pixels marketing. JAMAIS le nom/avatar/bio perso du vendeur.
        instructeur: {
          select: {
            id: true,
            marketingPixels: {
              where: { isActive: true },
              select: { type: true, pixelId: true },
            },
          },
        },
        category: { select: { id: true, slug: true, name: true } },
        // Boutique du produit → footer boutique + identité sur la page produit.
        shop: { select: { slug: true, name: true, legalName: true, font: true, themeColor: true, logoUrl: true, legalEmail: true, legalPhone: true } },
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

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    // Le public ne voit que les fiches ACTIF. Exception : un ADMIN authentifié
    // peut consulter une fiche non publiée (En attente / brouillon) pour la
    // contrôler AVANT validation depuis le tableau de bord admin. Sans cette
    // exception, le bouton « Voir » de l'admin renvoyait un 404.
    if (product.status !== "ACTIF") {
      const session = await getServerSession(authOptions);
      const role = (session?.user as { role?: string } | undefined)?.role;
      const isAdmin = role === "admin" || role === "ADMIN";
      if (!isAdmin) {
        return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
      }
    }

    // Compteur de vues : uniquement pour le public sur une fiche publiée. Un
    // aperçu admin ne doit pas gonfler les statistiques du vendeur.
    if (product.status === "ACTIF") {
      prisma.digitalProduct
        .update({
          where: { id: product.id },
          data: { viewsCount: { increment: 1 } },
        })
        .catch(() => null);
    }

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
            logoUrl: product.shop.logoUrl,
            // Alimentent le bloc « Contactez-nous ». Une seule saisie fait foi :
            // celle des informations legales de la boutique. Les anciens champs
            // contactEmail/whatsapp faisaient saisir deux fois les memes
            // coordonnees — ils ne sont plus lus.
            contactEmail: product.shop.legalEmail,
            whatsapp: product.shop.legalPhone,
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
