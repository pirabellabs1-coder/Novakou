import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
            user: { select: { id: true, name: true, image: true } },
            bioFr: true,
            expertise: true,
            yearsExp: true,
          },
        },
        category: { select: { id: true, slug: true, name: true } },
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

    return NextResponse.json({
      data: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description,
        descriptionFormat: product.descriptionFormat,
        productType: product.productType,
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
        category: product.category,
        instructeur: {
          id: product.instructeur.id,
          userId: product.instructeur.user.id,
          name: product.instructeur.user.name,
          image: product.instructeur.user.image,
          bio: product.instructeur.bioFr,
          expertise: product.instructeur.expertise,
          yearsExp: product.instructeur.yearsExp,
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
        createdAt: product.createdAt,
      },
    });
  } catch (err) {
    console.error("[public/produit/[slug]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
