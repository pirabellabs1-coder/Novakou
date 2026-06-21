import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/apprenant/recommandations
 *
 * Recommandations PERSONNALISÉES pour l'apprenant (v2 Phase 2 — découverte) :
 * formations des catégories qu'il a déjà achetées/suivies, en excluant celles
 * qu'il possède déjà. Repli sur les mieux notées si pas encore d'historique.
 * Robuste : ne 500 jamais, renvoie { data: [] } en cas d'erreur.
 */
export async function GET() {
  if (IS_DEV) return NextResponse.json({ data: [] });
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ data: [] });

    // 1. Formations déjà suivies + leurs catégories
    const enrollments = await prisma.enrollment
      .findMany({
        where: { userId },
        select: { formationId: true, formation: { select: { categoryId: true } } },
      })
      .catch(() => []);
    const ownedFormationIds = enrollments.map((e) => e.formationId);
    const categoryIds = new Set<string>();
    enrollments.forEach((e) => e.formation?.categoryId && categoryIds.add(e.formation.categoryId));

    // 2. Catégories des produits achetés
    const purchases = await prisma.digitalProductPurchase
      .findMany({
        where: { userId },
        select: { product: { select: { categoryId: true } } },
      })
      .catch(() => []);
    purchases.forEach((p) => p.product?.categoryId && categoryIds.add(p.product.categoryId));

    const hasHistory = categoryIds.size > 0;

    // 3. Recommande des formations ACTIF dans ces catégories (ou top notées)
    const recos = await prisma.formation
      .findMany({
        where: {
          status: "ACTIF",
          hiddenFromMarketplace: false,
          id: { notIn: ownedFormationIds.length ? ownedFormationIds : ["_none_"] },
          ...(hasHistory ? { categoryId: { in: Array.from(categoryIds) } } : {}),
        },
        orderBy: [{ rating: "desc" }, { studentsCount: "desc" }],
        take: 4,
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnail: true,
          rating: true,
          price: true,
          category: { select: { name: true } },
          instructeur: { select: { user: { select: { name: true } } } },
        },
      })
      .catch(() => []);

    const data = recos.map((f) => ({
      id: f.id,
      slug: f.slug,
      title: f.title,
      thumbnail: f.thumbnail ?? undefined,
      category: f.category?.name ?? undefined,
      rating: f.rating,
      price: f.price,
      instructorName: f.instructeur?.user?.name ?? undefined,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[apprenant/recommandations]", err);
    return NextResponse.json({ data: [] });
  }
}
