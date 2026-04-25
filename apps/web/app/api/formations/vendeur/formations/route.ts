import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: null });
    const userId = ctx.userId;

    // Multi-shop : ne montrer que les produits de la boutique active
    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const profile = await prisma.instructeurProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        totalEarned: true,
        formations: {
          where: activeShopId ? { shopId: activeShopId } : undefined,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            thumbnail: true,
            customCategory: true,
            status: true,
            price: true,
            rating: true,
            reviewsCount: true,
            studentsCount: true,
            publishedAt: true,
            createdAt: true,
            enrollments: {
              select: { paidAmount: true, refundedAt: true },
            },
          },
        },
        digitalProducts: {
          where: activeShopId ? { shopId: activeShopId } : undefined,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            banner: true,
            productType: true,
            status: true,
            price: true,
            rating: true,
            reviewsCount: true,
            salesCount: true,
            createdAt: true,
            purchases: {
              select: { paidAmount: true },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ data: { formations: [], digitalProducts: [], totals: { revenue: 0, sales: 0, products: 0 } } });
    }

    const formations = profile.formations.map((f) => {
      const active = f.enrollments.filter((e) => e.refundedAt === null);
      return {
        id: f.id,
        title: f.title,
        thumbnail: f.thumbnail,
        customCategory: f.customCategory,
        status: f.status,
        price: f.price,
        rating: f.rating,
        reviewsCount: f.reviewsCount,
        studentsCount: f.studentsCount,
        publishedAt: f.publishedAt,
        createdAt: f.createdAt,
        productKind: "formation",
        revenue: active.reduce((s, e) => s + e.paidAmount, 0),
        sales: active.length,
      };
    });

    const digitalProducts = profile.digitalProducts.map((p) => ({
      id: p.id,
      title: p.title,
      thumbnail: p.banner,
      customCategory: null,
      status: p.status,
      price: p.price,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      studentsCount: p.salesCount,
      publishedAt: null,
      createdAt: p.createdAt,
      productKind: p.productType,
      revenue: p.purchases.reduce((s, pu) => s + pu.paidAmount, 0),
      sales: p.purchases.length,
    }));

    const allItems = [...formations, ...digitalProducts];
    const totalRevenue = allItems.reduce((s, x) => s + x.revenue, 0);
    const totalSales = allItems.reduce((s, x) => s + x.sales, 0);

    return NextResponse.json({
      data: {
        formations,
        digitalProducts,
        totals: {
          revenue: Math.round(totalRevenue),
          sales: totalSales,
          products: allItems.length,
          activeFormations: formations.filter((f) => f.status === "ACTIF").length,
        },
      },
    });
  } catch (err) {
    console.error("[vendeur/formations]", err);
    return NextResponse.json({ data: null });
  }
}
