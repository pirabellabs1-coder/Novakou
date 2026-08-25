import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FILTRE_PRIX_MARKETPLACE } from "@/lib/formations/seuils";

/**
 * GET /api/formations/public/recommendations
 *
 * Recommandations « Vous aimerez aussi » pour les fiches publiques.
 * v2.0 Phase 2 — sans infrastructure : on recommande les produits/formations
 * de la MÊME catégorie, les plus vendus, en excluant l'élément courant.
 * (Évolution prévue : recherche sémantique pgvector pour des recos plus fines.)
 *
 * Query :
 *   instructeurId : id du vendeur — PRIORITAIRE : recommande UNIQUEMENT ses
 *                   propres produits (anti-fuite du trafic pub vers d'autres
 *                   vendeurs). Sur une fiche produit/formation on passe toujours
 *                   celui du vendeur courant.
 *   categoryId : repli par catégorie si aucun instructeurId (contextes marketplace)
 *   excludeId  : id de l'élément courant à exclure
 *   limit      : nombre de recos (défaut 4, max 8)
 */
export const revalidate = 300;

type Reco = {
  id: string;
  kind: "formation" | "product";
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  thumbnail: string | null;
  rating: number;
  salesCount: number;
  seller: string;
  category: string | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instructeurId = searchParams.get("instructeurId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const excludeId = searchParams.get("excludeId") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "4"), 8);

    // Priorité au MÊME vendeur : on ne propose que ses produits (le trafic pub
    // d'un vendeur ne doit pas partir vers un concurrent). Repli catégorie
    // seulement si aucun vendeur n'est fourni.
    const baseWhere = {
      status: "ACTIF" as const,
      hiddenFromMarketplace: false,
      AND: [FILTRE_PRIX_MARKETPLACE],
      ...(instructeurId ? { instructeurId } : categoryId ? { categoryId } : {}),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    };

    const [formations, products] = await Promise.all([
      prisma.formation
        .findMany({
          where: baseWhere,
          orderBy: [{ studentsCount: "desc" }, { createdAt: "desc" }],
          take: limit + 2,
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            originalPrice: true,
            thumbnail: true,
            rating: true,
            studentsCount: true,
            category: { select: { name: true } },
            shop: { select: { name: true } },
          },
        })
        .catch(() => []),
      prisma.digitalProduct
        .findMany({
          where: baseWhere,
          orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
          take: limit + 2,
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            originalPrice: true,
            thumbnail: true,
            banner: true,
            rating: true,
            salesCount: true,
            category: { select: { name: true } },
            shop: { select: { name: true } },
          },
        })
        .catch(() => []),
    ]);

    const items: Reco[] = [
      ...formations.map((f) => ({
        id: f.id,
        kind: "formation" as const,
        slug: f.slug,
        title: f.title,
        price: f.price,
        originalPrice: f.originalPrice,
        thumbnail: f.thumbnail,
        rating: f.rating,
        salesCount: f.studentsCount,
        seller: f.shop?.name ?? "Boutique",
        category: f.category?.name ?? null,
      })),
      ...products.map((p) => ({
        id: p.id,
        kind: "product" as const,
        slug: p.slug,
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice,
        thumbnail: p.thumbnail ?? p.banner,
        rating: p.rating,
        salesCount: p.salesCount,
        seller: p.shop?.name ?? "Boutique",
        category: p.category?.name ?? null,
      })),
    ]
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, limit);

    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("[recommendations]", err);
    return NextResponse.json({ data: [] });
  }
}
