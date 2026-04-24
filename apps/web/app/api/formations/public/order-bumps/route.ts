import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/public/order-bumps?formationIds=xxx,yyy&productIds=aaa,bbb
 *
 * Retourne les Order Bumps applicables au checkout. Public (pas d'auth) —
 * l'acheteur doit les voir avant paiement.
 *
 * Logique : pour chaque produit dans le panier, on trouve un bump qui
 *   - est isActive = true
 *   - appliesToAll = true  OU  le produit est dans targetFormationIds / targetProductIds
 *   - n'est pas lui-même déjà dans le panier (sinon doublon absurde)
 *
 * On retourne au maximum 1 bump par vendeur (pour pas saturer le checkout).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formationIds = (searchParams.get("formationIds") ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const productIds = (searchParams.get("productIds") ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean);

    if (formationIds.length === 0 && productIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // On récupère les instructeurs des produits dans le panier
    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { id: { in: formationIds } },
        select: { id: true, instructeurId: true },
      }),
      prisma.digitalProduct.findMany({
        where: { id: { in: productIds } },
        select: { id: true, instructeurId: true },
      }),
    ]);

    const instructeurIds = Array.from(
      new Set([
        ...formations.map((f) => f.instructeurId),
        ...products.map((p) => p.instructeurId),
      ]),
    );

    if (instructeurIds.length === 0) return NextResponse.json({ data: [] });

    // Bumps actifs de tous les vendeurs concernés
    const bumps = await prisma.orderBump.findMany({
      where: {
        instructeurId: { in: instructeurIds },
        isActive: true,
        // Le bump ne doit pas viser un produit déjà dans le panier
        NOT: [
          { bumpFormationId: { in: formationIds.length > 0 ? formationIds : [""] } },
          { bumpProductId: { in: productIds.length > 0 ? productIds : [""] } },
        ],
      },
      include: {
        bumpFormation: { select: { id: true, title: true, slug: true, thumbnail: true } },
        bumpProduct: { select: { id: true, title: true, slug: true, banner: true, productType: true } },
      },
    });

    // Filtrer : le bump doit cibler au moins un produit du panier (ou appliesToAll)
    const applicable = bumps.filter((b) => {
      if (b.appliesToAll) return true;
      const hitsFormation = formationIds.some((id) => b.targetFormationIds.includes(id));
      const hitsProduct = productIds.some((id) => b.targetProductIds.includes(id));
      return hitsFormation || hitsProduct;
    });

    // Un seul bump par vendeur (le plus récent, pour commencer)
    const perInstructeur = new Map<string, typeof applicable[0]>();
    for (const b of applicable) {
      const existing = perInstructeur.get(b.instructeurId);
      if (!existing || b.createdAt > existing.createdAt) {
        perInstructeur.set(b.instructeurId, b);
      }
    }

    const result = Array.from(perInstructeur.values()).map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      imageUrl: b.imageUrl,
      price: b.price,
      originalPrice: b.originalPrice,
      bumpFormation: b.bumpFormation,
      bumpProduct: b.bumpProduct,
    }));

    // Increment viewsCount fire-and-forget
    if (result.length > 0) {
      prisma.orderBump
        .updateMany({
          where: { id: { in: result.map((b) => b.id) } },
          data: { viewsCount: { increment: 1 } },
        })
        .catch(() => null);
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[public/order-bumps GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : "Erreur" });
  }
}
