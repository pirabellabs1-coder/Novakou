import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") ?? "all"; // all | formations | products
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : null;
    const minRating = searchParams.get("minRating") ? parseFloat(searchParams.get("minRating")!) : 0;
    const sort = searchParams.get("sort") ?? "relevance"; // relevance | price-asc | price-desc | rating | recent

    // Exclure les produits que les vendeurs ont marqués comme cachés du marketplace
    const formationWhere: Record<string, unknown> = { status: "ACTIF", hiddenFromMarketplace: false };
    const productWhere: Record<string, unknown> = { status: "ACTIF", hiddenFromMarketplace: false };

    if (search) {
      formationWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
      productWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      formationWhere.customCategory = { equals: category, mode: "insensitive" };
    }

    if (maxPrice !== null) {
      formationWhere.price = { lte: maxPrice };
      productWhere.price = { lte: maxPrice };
    }

    if (minRating > 0) {
      formationWhere.rating = { gte: minRating };
      productWhere.rating = { gte: minRating };
    }

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    if (sort === "price-desc") orderBy = { price: "desc" };
    if (sort === "rating") orderBy = { rating: "desc" };
    if (sort === "recent") orderBy = { createdAt: "desc" };

    const [formations, products, categories] = await Promise.all([
      kind === "products" ? [] : prisma.formation.findMany({
        where: formationWhere,
        take: 100,
        orderBy,
        select: {
          id: true, slug: true, title: true, price: true, originalPrice: true, thumbnail: true,
          rating: true, reviewsCount: true, studentsCount: true, customCategory: true,
          shortDesc: true,
          createdAt: true,
          instructeur: {
            select: {
              user: { select: { name: true, image: true } },
            },
          },
        },
      }),
      kind === "formations" ? [] : prisma.digitalProduct.findMany({
        where: productWhere,
        take: 100,
        orderBy,
        select: {
          id: true, slug: true, title: true, price: true, originalPrice: true, banner: true, productType: true,
          rating: true, reviewsCount: true, salesCount: true,
          createdAt: true,
          instructeur: {
            select: {
              user: { select: { name: true, image: true } },
            },
          },
        },
      }),
      prisma.formation.findMany({
        where: { status: "ACTIF", customCategory: { not: null } },
        select: { customCategory: true },
        distinct: ["customCategory"],
        take: 20,
      }),
    ]);

    const formationItems = formations.map((f) => ({
      id: f.id,
      kind: "formation" as const,
      slug: f.slug,
      title: f.title,
      price: f.price,
      originalPrice: f.originalPrice,
      thumbnail: f.thumbnail,
      rating: f.rating,
      reviewsCount: f.reviewsCount,
      salesCount: f.studentsCount,
      category: f.customCategory,
      shortDesc: f.shortDesc,
      type: "Formation vidéo",
      seller: f.instructeur.user.name ?? "—",
      sellerAvatar: f.instructeur.user.image,
      createdAt: f.createdAt,
    }));

    const productItems = products.map((p) => ({
      id: p.id,
      kind: "product" as const,
      slug: p.slug,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      thumbnail: p.banner,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      salesCount: p.salesCount,
      category: null,
      shortDesc: null,
      type: p.productType,
      seller: p.instructeur.user.name ?? "—",
      sellerAvatar: p.instructeur.user.image,
      createdAt: p.createdAt,
    }));

    const totalFormations = formationItems.length;
    const totalProducts = productItems.length;

    return NextResponse.json({
      data: {
        formations: formationItems,
        products: productItems,
        categories: categories.map((c) => c.customCategory).filter(Boolean),
        stats: { totalFormations, totalProducts, total: totalFormations + totalProducts },
      },
    });
  } catch (err) {
    console.error("[public/explorer]", err);
    return NextResponse.json({
      data: { formations: [], products: [], categories: [], stats: { totalFormations: 0, totalProducts: 0, total: 0 } },
    });
  }
}
