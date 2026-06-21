import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStorageFields } from "@/lib/storage-resolver";

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
      // Recherche élargie (v2 Phase 2) : titre, description ET nom du vendeur
      // → on trouve aussi en cherchant le nom d'un créateur.
      formationWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { customCategory: { contains: search, mode: "insensitive" } },
        { instructeur: { user: { name: { contains: search, mode: "insensitive" } } } },
      ];
      productWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { instructeur: { user: { name: { contains: search, mode: "insensitive" } } } },
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

    // Bundles : on applique les mêmes filtres search/maxPrice/minRating
    // que les formations/produits. Pas de `category` (les bundles n'en ont pas).
    const bundleWhere: Record<string, unknown> = { isActive: true };
    if (search) {
      bundleWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (maxPrice !== null) bundleWhere.priceXof = { lte: Math.round(maxPrice) };
    if (minRating > 0) bundleWhere.rating = { gte: minRating };

    let bundleOrderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "price-asc") bundleOrderBy = { priceXof: "asc" };
    if (sort === "price-desc") bundleOrderBy = { priceXof: "desc" };
    if (sort === "rating") bundleOrderBy = { rating: "desc" };

    const [formations, products, bundles, categories] = await Promise.all([
      kind === "products" || kind === "bundles" ? [] : prisma.formation.findMany({
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
      kind === "formations" || kind === "bundles" ? [] : prisma.digitalProduct.findMany({
        where: productWhere,
        take: 100,
        orderBy,
        select: {
          id: true, slug: true, title: true, price: true, originalPrice: true,
          thumbnail: true, banner: true, productType: true,
          rating: true, reviewsCount: true, salesCount: true,
          createdAt: true,
          instructeur: {
            select: {
              user: { select: { name: true, image: true } },
            },
          },
        },
      }),
      // Bureau session 4 (P1 Marcus) — bundles découvrables dans l'explorer.
      // Avant : invisibles hors boutique vendeur. Désormais : indexés et triés
      // au même titre que formations/produits.
      kind === "formations" || kind === "products" ? [] : prisma.productBundle.findMany({
        where: bundleWhere,
        take: 100,
        orderBy: bundleOrderBy,
        select: {
          id: true, slug: true, title: true, description: true,
          priceXof: true, originalPriceXof: true,
          thumbnail: true, banner: true,
          rating: true, reviewsCount: true,
          createdAt: true,
          _count: { select: { purchases: true } },
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

    // Résout les paths stockage (thumbnail, banner, image) en signed URLs
    // fraîches AVANT le mapping — sinon le frontend rend `<img src="path">`
    // → relatif à /explorer → 404.
    const [resolvedFormations, resolvedProducts, resolvedBundles] = await Promise.all([
      resolveStorageFields(formations),
      resolveStorageFields(products),
      resolveStorageFields(bundles),
    ]);

    const formationItems = resolvedFormations.map((f) => ({
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

    const productItems = resolvedProducts.map((p) => ({
      id: p.id,
      kind: "product" as const,
      slug: p.slug,
      title: p.title,
      price: p.price,
      originalPrice: p.originalPrice,
      // Marketplace cards prefer the square vignette; fall back to the wide
      // banner for older products that only have one image.
      thumbnail: p.thumbnail ?? p.banner,
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

    const bundleItems = resolvedBundles.map((b) => ({
      id: b.id,
      kind: "bundle" as const,
      slug: b.slug,
      title: b.title,
      // On expose `price` (alias de priceXof) pour rester homogène
      // avec formations/produits côté frontend.
      price: b.priceXof,
      originalPrice: b.originalPriceXof,
      thumbnail: b.thumbnail ?? b.banner,
      rating: b.rating,
      reviewsCount: b.reviewsCount,
      salesCount: b._count.purchases,
      category: null,
      shortDesc: b.description ? b.description.slice(0, 120) : null,
      type: "Pack",
      seller: b.instructeur.user.name ?? "—",
      sellerAvatar: b.instructeur.user.image,
      createdAt: b.createdAt,
    }));

    const totalFormations = formationItems.length;
    const totalProducts = productItems.length;
    const totalBundles = bundleItems.length;

    return NextResponse.json({
      data: {
        formations: formationItems,
        products: productItems,
        bundles: bundleItems,
        categories: categories.map((c) => c.customCategory).filter(Boolean),
        stats: {
          totalFormations,
          totalProducts,
          totalBundles,
          total: totalFormations + totalProducts + totalBundles,
        },
      },
    });
  } catch (err) {
    console.error("[public/explorer]", err);
    return NextResponse.json({
      data: {
        formations: [],
        products: [],
        bundles: [],
        categories: [],
        stats: { totalFormations: 0, totalProducts: 0, totalBundles: 0, total: 0 },
      },
    });
  }
}
