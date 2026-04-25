import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/public/funnel-item?kind=formation&id=XXX
 * Public endpoint used by funnel landing pages to hydrate ProductBlock.
 * Returns minimal public info for a formation or digital product.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id");

  if (!kind || !id) {
    return NextResponse.json({ error: "kind and id are required" }, { status: 400 });
  }
  if (kind !== "formation" && kind !== "product") {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }

  try {
    if (kind === "formation") {
      const f = await prisma.formation.findUnique({
        where: { id },
        select: {
          id: true,
          slug: true,
          title: true,
          shortDesc: true,
          thumbnail: true,
          price: true,
          isFree: true,
          rating: true,
          reviewsCount: true,
          studentsCount: true,
          status: true,
        },
      });
      if (!f || f.status !== "ACTIF") {
        return NextResponse.json({ data: null }, { status: 404 });
      }
      return NextResponse.json({
        data: {
          kind: "formation",
          id: f.id,
          slug: f.slug,
          title: f.title,
          description: f.shortDesc,
          image: f.thumbnail,
          price: f.price,
          isFree: f.isFree,
          rating: f.rating,
          reviewsCount: f.reviewsCount,
          count: f.studentsCount,
          countLabel: "élèves",
        },
      });
    }

    // kind === "product"
    const p = await prisma.digitalProduct.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        banner: true,
        price: true,
        isFree: true,
        rating: true,
        reviewsCount: true,
        salesCount: true,
        status: true,
      },
    });
    if (!p || p.status !== "ACTIF") {
      return NextResponse.json({ data: null }, { status: 404 });
    }
    return NextResponse.json({
      data: {
        kind: "product",
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        image: p.banner,
        price: p.price,
        isFree: p.isFree,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        count: p.salesCount,
        countLabel: "ventes",
      },
    });
  } catch (err) {
    console.error("[public/funnel-item GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
