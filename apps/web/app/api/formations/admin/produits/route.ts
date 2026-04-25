import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "all"; // all, EN_ATTENTE, ACTIF, BROUILLON, ARCHIVE
    const search = searchParams.get("search") ?? "";

    const fWhere: Record<string, unknown> = {};
    const pWhere: Record<string, unknown> = {};
    if (status !== "all") {
      fWhere.status = status;
      pWhere.status = status;
    }
    if (search) {
      fWhere.title = { contains: search, mode: "insensitive" };
      pWhere.title = { contains: search, mode: "insensitive" };
    }

    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: fWhere,
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, slug: true, price: true, thumbnail: true, status: true, createdAt: true,
          studentsCount: true, rating: true, customCategory: true,
          instructeur: { select: { user: { select: { name: true, email: true } } } },
          enrollments: { select: { paidAmount: true, refundedAt: true } },
        },
      }),
      prisma.digitalProduct.findMany({
        where: pWhere,
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, slug: true, price: true, banner: true, status: true, createdAt: true,
          salesCount: true, rating: true, productType: true,
          instructeur: { select: { user: { select: { name: true, email: true } } } },
          purchases: { select: { paidAmount: true } },
        },
      }),
    ]);

    const allItems = [
      ...formations.map((f) => ({
        id: f.id,
        kind: "formation" as const,
        title: f.title,
        slug: f.slug,
        price: f.price,
        thumbnail: f.thumbnail,
        status: f.status,
        createdAt: f.createdAt,
        category: f.customCategory ?? "Formation",
        sales: f.studentsCount,
        rating: f.rating,
        revenue: f.enrollments.reduce((s, e) => s + (e.refundedAt ? 0 : e.paidAmount), 0),
        seller: f.instructeur.user.name ?? f.instructeur.user.email,
        productType: "Formation vidéo",
      })),
      ...products.map((p) => ({
        id: p.id,
        kind: "product" as const,
        title: p.title,
        slug: p.slug,
        price: p.price,
        thumbnail: p.banner,
        status: p.status,
        createdAt: p.createdAt,
        category: p.productType,
        sales: p.salesCount,
        rating: p.rating,
        revenue: p.purchases.reduce((s, q) => s + q.paidAmount, 0),
        seller: p.instructeur.user.name ?? p.instructeur.user.email,
        productType: p.productType,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const summary = {
      total: allItems.length,
      pending: allItems.filter((i) => i.status === "EN_ATTENTE").length,
      active: allItems.filter((i) => i.status === "ACTIF").length,
      drafts: allItems.filter((i) => i.status === "BROUILLON").length,
      archived: allItems.filter((i) => i.status === "ARCHIVE").length,
    };

    return NextResponse.json({ data: allItems, summary });
  } catch (err) {
    console.error("[admin/produits]", err);
    return NextResponse.json({ data: [], summary: { total: 0, pending: 0, active: 0, drafts: 0, archived: 0 } });
  }
}
