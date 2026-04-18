/**
 * GET /api/formations/upsell?kind=formation|product&id=xxx
 *
 * Returns 3-6 recommendations to surface at checkout.
 * Ranking (descending weight):
 *   1. Same category as the item (to boost affinity)
 *   2. Same vendor/instructor (cross-sell within catalog)
 *   3. Popular (high salesCount / studentsCount)
 *
 * Excludes : the item itself + anything the current user has already
 * bought/enrolled in.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = (searchParams.get("kind") || "").toLowerCase();
  const id = searchParams.get("id") || "";
  if (!id || (kind !== "formation" && kind !== "product")) {
    return NextResponse.json({ error: "kind + id requis" }, { status: 400 });
  }

  // Resolve seed item + its category + instructor
  let categoryId: string | null = null;
  let instructeurId: string | null = null;
  if (kind === "formation") {
    const f = await prisma.formation.findUnique({
      where: { id },
      select: { categoryId: true, instructeurId: true },
    });
    if (!f) return NextResponse.json({ data: [] });
    categoryId = f.categoryId;
    instructeurId = f.instructeurId;
  } else {
    const p = await prisma.digitalProduct.findUnique({
      where: { id },
      select: { categoryId: true, instructeurId: true },
    });
    if (!p) return NextResponse.json({ data: [] });
    categoryId = p.categoryId;
    instructeurId = p.instructeurId;
  }

  // Exclusion set: current user's already-owned items
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const owned = { formations: new Set<string>(), products: new Set<string>() };
  if (userId) {
    const [enrolls, purchases] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId, refundedAt: null },
        select: { formationId: true },
      }),
      prisma.digitalProductPurchase.findMany({
        where: { userId },
        select: { productId: true },
      }),
    ]);
    for (const e of enrolls) owned.formations.add(e.formationId);
    for (const p of purchases) owned.products.add(p.productId);
  }

  // Always exclude the seed item
  if (kind === "formation") owned.formations.add(id);
  else owned.products.add(id);

  // Pull candidates — same instructor (weight 3) + same category (weight 2) + top sellers (weight 1)
  const [byInstructorF, byInstructorP, byCategoryF, byCategoryP] = await Promise.all([
    instructeurId
      ? prisma.formation.findMany({
          where: { instructeurId, status: "ACTIF", hiddenFromMarketplace: false, id: { notIn: [...owned.formations] } },
          orderBy: { studentsCount: "desc" },
          take: 6,
          select: { id: true, slug: true, title: true, price: true, thumbnail: true, studentsCount: true, rating: true },
        })
      : Promise.resolve([]),
    instructeurId
      ? prisma.digitalProduct.findMany({
          where: { instructeurId, status: "ACTIF", hiddenFromMarketplace: false, id: { notIn: [...owned.products] } },
          orderBy: { salesCount: "desc" },
          take: 6,
          select: { id: true, slug: true, title: true, price: true, banner: true, salesCount: true, rating: true },
        })
      : Promise.resolve([]),
    categoryId
      ? prisma.formation.findMany({
          where: {
            categoryId,
            status: "ACTIF",
            hiddenFromMarketplace: false,
            id: { notIn: [...owned.formations] },
            ...(instructeurId ? { instructeurId: { not: instructeurId } } : {}),
          },
          orderBy: { studentsCount: "desc" },
          take: 4,
          select: { id: true, slug: true, title: true, price: true, thumbnail: true, studentsCount: true, rating: true },
        })
      : Promise.resolve([]),
    categoryId
      ? prisma.digitalProduct.findMany({
          where: {
            categoryId,
            status: "ACTIF",
            hiddenFromMarketplace: false,
            id: { notIn: [...owned.products] },
            ...(instructeurId ? { instructeurId: { not: instructeurId } } : {}),
          },
          orderBy: { salesCount: "desc" },
          take: 4,
          select: { id: true, slug: true, title: true, price: true, banner: true, salesCount: true, rating: true },
        })
      : Promise.resolve([]),
  ]);

  // Merge + dedup (by id) while preserving priority
  const seen = new Set<string>();
  const out: Array<{
    kind: "formation" | "product";
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string | null;
    rating: number;
    count: number;
    href: string;
    weight: number;
  }> = [];

  function push(
    k: "formation" | "product",
    item: { id: string; slug: string; title: string; price: number; thumbnail?: string | null; banner?: string | null; studentsCount?: number; salesCount?: number; rating: number },
    weight: number,
  ) {
    const key = `${k}:${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      kind: k,
      id: item.id,
      slug: item.slug,
      title: item.title,
      price: item.price,
      image: (k === "formation" ? item.thumbnail : item.banner) ?? null,
      rating: item.rating ?? 0,
      count: (k === "formation" ? item.studentsCount : item.salesCount) ?? 0,
      href: k === "formation" ? `/formation/${item.slug}` : `/produit/${item.slug}`,
      weight,
    });
  }

  for (const f of byInstructorF) push("formation", f, 3);
  for (const p of byInstructorP) push("product", p, 3);
  for (const f of byCategoryF) push("formation", f, 2);
  for (const p of byCategoryP) push("product", p, 2);

  out.sort((a, b) => b.weight - a.weight || b.count - a.count);

  return NextResponse.json({ data: out.slice(0, 6) });
}
