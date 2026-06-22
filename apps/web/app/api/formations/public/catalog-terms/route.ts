import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/public/catalog-terms
 *
 * Renvoie un échantillon compact du catalogue RÉEL (titres + catégories) pour
 * « ancrer » l'assistant d'achat IA : l'IA ne devine plus dans le vide, elle
 * voit les produits réellement disponibles et propose des mots-clés qui
 * existent vraiment. Léger, mis en cache (ISR 5 min).
 */
export const revalidate = 300;

export async function GET() {
  try {
    const [formations, products, cats] = await Promise.all([
      prisma.formation
        .findMany({
          where: { status: "ACTIF", hiddenFromMarketplace: false },
          select: { title: true },
          orderBy: { studentsCount: "desc" },
          take: 60,
        })
        .catch(() => []),
      prisma.digitalProduct
        .findMany({
          where: { status: "ACTIF", hiddenFromMarketplace: false },
          select: { title: true },
          orderBy: { salesCount: "desc" },
          take: 60,
        })
        .catch(() => []),
      prisma.formationCategory
        .findMany({ select: { name: true }, take: 40 })
        .catch(() => []),
    ]);

    const titles = Array.from(
      new Set([...formations, ...products].map((x) => x.title).filter(Boolean)),
    ).slice(0, 100);
    const categories = Array.from(new Set(cats.map((c) => c.name).filter(Boolean)));

    return NextResponse.json({ titles, categories });
  } catch (err) {
    console.error("[catalog-terms]", err);
    return NextResponse.json({ titles: [], categories: [] });
  }
}
