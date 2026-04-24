import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/admin/ai-vendor/[id]
 *
 * Retourne un snapshot COMPLET d'un vendeur specifique (instructeurId).
 * Destine a nourrir Claude pour generer des conseils de coaching pertinents.
 *
 * Auth : ADMIN uniquement.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userRole = session?.user?.role?.toString().toLowerCase();
    if (userRole !== "admin" && !IS_DEV) {
      return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });
    }

    const { id } = await params;

    const inst = await prisma.instructeurProfile.findUnique({
      where: { id },
      select: {
        id: true,
        bioFr: true,
        expertise: true,
        yearsExp: true,
        totalEarned: true,
        status: true,
        shopSlug: true,
        supportAiEnabled: true,
        createdAt: true,
        user: {
          select: {
            id: true, name: true, email: true, role: true, kyc: true,
            status: true, createdAt: true, lastLoginAt: true,
          },
        },
        formations: {
          select: {
            id: true, title: true, status: true, price: true,
            studentsCount: true, rating: true, reviewsCount: true,
            viewsCount: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        digitalProducts: {
          select: {
            id: true, title: true, status: true, price: true,
            salesCount: true, rating: true, reviewsCount: true,
            viewsCount: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        withdrawals: {
          select: {
            id: true, amount: true, status: true, method: true,
            createdAt: true, processedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        shops: {
          select: {
            id: true, name: true, slug: true, isPrimary: true,
            customDomain: true, customDomainVerified: true,
          },
        },
      },
    });

    if (!inst) {
      return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });
    }

    // Aggregate sales + revenue
    const totalSales =
      inst.formations.reduce((sum, f) => sum + f.studentsCount, 0) +
      inst.digitalProducts.reduce((sum, p) => sum + p.salesCount, 0);

    const avgRating = (() => {
      const ratings: number[] = [];
      inst.formations.forEach((f) => { if (f.rating > 0) ratings.push(f.rating); });
      inst.digitalProducts.forEach((p) => { if (p.rating > 0) ratings.push(p.rating); });
      return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    })();

    const totalReviews =
      inst.formations.reduce((sum, f) => sum + f.reviewsCount, 0) +
      inst.digitalProducts.reduce((sum, p) => sum + p.reviewsCount, 0);

    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(inst.createdAt).getTime()) / 86400000,
    );
    const daysSinceLastLogin = inst.user.lastLoginAt
      ? Math.floor((Date.now() - new Date(inst.user.lastLoginAt).getTime()) / 86400000)
      : null;

    return NextResponse.json({
      data: {
        profile: {
          id: inst.id,
          name: inst.user.name,
          email: inst.user.email,
          bio: inst.bioFr,
          expertise: inst.expertise,
          yearsExp: inst.yearsExp,
          status: inst.status,
          kyc: inst.user.kyc,
          accountStatus: inst.user.status,
          shopSlug: inst.shopSlug,
          supportAiEnabled: inst.supportAiEnabled,
          daysSinceCreation,
          daysSinceLastLogin,
        },
        stats: {
          totalEarned: inst.totalEarned,
          totalSales,
          avgRating: Number(avgRating.toFixed(2)),
          totalReviews,
          formationsCount: inst.formations.length,
          formationsActive: inst.formations.filter((f) => f.status === "ACTIF").length,
          productsCount: inst.digitalProducts.length,
          productsActive: inst.digitalProducts.filter((p) => p.status === "ACTIF").length,
          shopsCount: inst.shops.length,
        },
        formations: inst.formations,
        products: inst.digitalProducts,
        withdrawals: inst.withdrawals,
        shops: inst.shops,
      },
    });
  } catch (err) {
    console.error("[admin/ai-vendor/[id] GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
