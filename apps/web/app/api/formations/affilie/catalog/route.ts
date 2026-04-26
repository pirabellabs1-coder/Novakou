import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Catalog visible to affiliates: every public-facing item they can promote.
 * Returns both Formations AND DigitalProducts (ebooks, guides, packs…) with
 * the same shape, plus a `kind` discriminator so the UI can route the link
 * to the correct public page.
 */

type CatalogItem = {
  id: string;
  kind: "formation" | "produit";
  title: string;
  slug: string;
  thumbnail: string | null;
  customCategory: string | null;
  level: string | null;
  price: number;
  rating: number | null;
  studentsCount: number;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("q") ?? "";
    const kindFilter = searchParams.get("kind"); // "formation" | "produit" | null

    const wantFormations = !kindFilter || kindFilter === "formation";
    const wantProducts = !kindFilter || kindFilter === "produit";

    const [formations, products] = await Promise.all([
      wantFormations
        ? prisma.formation.findMany({
            where: {
              status: "ACTIF",
              ...(search
                ? {
                    OR: [
                      { title: { contains: search, mode: "insensitive" } },
                      { customCategory: { contains: search, mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              customCategory: true,
              level: true,
              price: true,
              rating: true,
              studentsCount: true,
            },
            orderBy: { studentsCount: "desc" },
            take: 50,
          })
        : Promise.resolve([]),
      wantProducts
        ? prisma.digitalProduct.findMany({
            where: {
              status: "ACTIF",
              hiddenFromMarketplace: false,
              ...(search
                ? {
                    OR: [
                      { title: { contains: search, mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            select: {
              id: true,
              title: true,
              slug: true,
              banner: true,
              price: true,
              rating: true,
              salesCount: true,
            },
            orderBy: { salesCount: "desc" },
            take: 50,
          })
        : Promise.resolve([]),
    ]);

    const items: CatalogItem[] = [
      ...formations.map((f): CatalogItem => ({
        id: f.id,
        kind: "formation",
        title: f.title,
        slug: f.slug,
        thumbnail: f.thumbnail,
        customCategory: f.customCategory,
        level: f.level,
        price: f.price,
        rating: f.rating,
        studentsCount: f.studentsCount ?? 0,
      })),
      ...products.map((p): CatalogItem => ({
        id: p.id,
        kind: "produit",
        title: p.title,
        slug: p.slug,
        thumbnail: p.banner,
        customCategory: null,
        level: null,
        price: p.price,
        rating: p.rating,
        studentsCount: p.salesCount ?? 0,
      })),
    ];

    // Sort by popularity (studentsCount/salesCount desc)
    items.sort((a, b) => b.studentsCount - a.studentsCount);

    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("[affilie/catalog]", err);
    return NextResponse.json({ data: [] });
  }
}
