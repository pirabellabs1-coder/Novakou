import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStorageFields } from "@/lib/storage-resolver";
import { cldUrl } from "@/lib/cloudinary-url";

// Vignette carrée marketplace : 600px suffisent largement pour une carte
// (~300px affichés, ×2 pour le retina). Cloudinary redimensionne + compresse.
// Vignette de carte : on borne la LARGEUR (c_limit) sans imposer de carré.
// Avant : width+height+crop:"fill" rognait toute image non carrée en 600×600
// → une bannière large perdait ses bords. Maintenant l'image garde son ratio
// d'origine et <AdaptiveImage/> l'affiche EN ENTIER (object-contain + fond flouté).
const CARD = { width: 700, crop: "limit" as const };

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

    // Découpe la recherche en MOTS (tokens). Avant on cherchait la phrase
    // entière en `contains` → une recherche multi-mots (ex. l'assistant IA qui
    // renvoie « vendre whatsapp marketing ») ne matchait aucun titre et
    // n'affichait rien. Maintenant chaque mot est cherché séparément (OR) :
    // un produit dont le titre/description/catégorie/vendeur contient AU MOINS
    // un des mots remonte. On garde aussi la phrase entière (match exact mieux
    // classé). Mots < 2 caractères ignorés, max 6 mots.
    const terms = search
      ? Array.from(
          new Set(
            [search.trim(), ...search.trim().split(/\s+/)]
              .map((t) => t.trim())
              .filter((t) => t.length >= 2),
          ),
        ).slice(0, 7)
      : [];

    if (terms.length) {
      // Recherche élargie (v2 Phase 2) : titre, description, catégorie ET vendeur.
      formationWhere.OR = terms.flatMap((t) => [
        { title: { contains: t, mode: "insensitive" } },
        { description: { contains: t, mode: "insensitive" } },
        { customCategory: { contains: t, mode: "insensitive" } },
        { instructeur: { user: { name: { contains: t, mode: "insensitive" } } } },
      ]);
      productWhere.OR = terms.flatMap((t) => [
        { title: { contains: t, mode: "insensitive" } },
        { description: { contains: t, mode: "insensitive" } },
        { instructeur: { user: { name: { contains: t, mode: "insensitive" } } } },
      ]);
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
    if (terms.length) {
      bundleWhere.OR = terms.flatMap((t) => [
        { title: { contains: t, mode: "insensitive" } },
        { description: { contains: t, mode: "insensitive" } },
      ]);
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
              user: { select: { name: true, image: true, kyc: true } },
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
              user: { select: { name: true, image: true, kyc: true } },
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
      thumbnail: cldUrl(f.thumbnail, CARD),
      rating: f.rating,
      reviewsCount: f.reviewsCount,
      salesCount: f.studentsCount,
      category: f.customCategory,
      shortDesc: f.shortDesc,
      type: "Formation vidéo",
      seller: f.instructeur.user.name ?? "—",
      sellerAvatar: f.instructeur.user.image,
      verified: (f.instructeur.user.kyc ?? 1) >= 3,
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
      thumbnail: cldUrl(p.thumbnail ?? p.banner, CARD),
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      salesCount: p.salesCount,
      category: null,
      shortDesc: null,
      type: p.productType,
      seller: p.instructeur.user.name ?? "—",
      sellerAvatar: p.instructeur.user.image,
      verified: (p.instructeur.user.kyc ?? 1) >= 3,
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
      thumbnail: cldUrl(b.thumbnail ?? b.banner, CARD),
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
