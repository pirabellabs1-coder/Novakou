import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/apprenant/bundles
 * Liste les packs achetés par l'apprenant connecté + résumé du contenu
 * débloqué et indicateur de review existante.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const purchases = await prisma.productBundlePurchase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        paidAmount: true,
        createdAt: true,
        bundle: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnail: true,
            banner: true,
            priceXof: true,
            rating: true,
            reviewsCount: true,
            items: { select: { itemKind: true } },
            instructeur: { select: { user: { select: { name: true, image: true } } } },
            shop: { select: { slug: true, name: true } },
            reviews: {
              where: { userId },
              select: { id: true, rating: true, comment: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: purchases });
  } catch (err) {
    console.error("[apprenant/bundles GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
