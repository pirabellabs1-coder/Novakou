import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";

/**
 * GET /api/formations/vendeur/order-bumps
 * Liste tous les bumps du vendeur (scopés au shop actif si défini).
 *
 * POST /api/formations/vendeur/order-bumps
 * Body: {
 *   title, description, imageUrl?, price, originalPrice?,
 *   bumpFormationId? | bumpProductId?, (exactement UN des deux)
 *   appliesToAll?: boolean,
 *   targetFormationIds?: string[],
 *   targetProductIds?: string[],
 * }
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: [] });

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const bumps = await prisma.orderBump.findMany({
      where: {
        instructeurId: ctx.instructeurId,
        ...(activeShopId ? { shopId: activeShopId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        bumpFormation: { select: { id: true, title: true, slug: true, thumbnail: true } },
        bumpProduct: { select: { id: true, title: true, slug: true, banner: true } },
      },
    });

    return NextResponse.json({ data: bumps });
  } catch (err) {
    console.error("[vendeur/order-bumps GET]", err);
    return NextResponse.json(
      { data: [], error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const body = await request.json();
    const {
      title, description, imageUrl,
      price, originalPrice,
      bumpFormationId, bumpProductId,
      appliesToAll, targetFormationIds, targetProductIds,
    } = body;

    // ── Validation ──
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json({ error: "Titre requis (3 caractères min)" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json({ error: "Description requise (10 caractères min)" }, { status: 400 });
    }
    if (!Number.isFinite(Number(price)) || Number(price) < 100) {
      return NextResponse.json({ error: "Prix minimum : 100 FCFA" }, { status: 400 });
    }
    if ((!bumpFormationId && !bumpProductId) || (bumpFormationId && bumpProductId)) {
      return NextResponse.json(
        { error: "Fournir exactement UN produit à ajouter en bump (formation OU produit digital)" },
        { status: 400 },
      );
    }

    // Vérifier que le produit bump appartient bien au vendeur
    if (bumpFormationId) {
      const f = await prisma.formation.findFirst({
        where: { id: bumpFormationId, instructeurId: ctx.instructeurId },
        select: { id: true },
      });
      if (!f) return NextResponse.json({ error: "Formation bump introuvable" }, { status: 404 });
    }
    if (bumpProductId) {
      const p = await prisma.digitalProduct.findFirst({
        where: { id: bumpProductId, instructeurId: ctx.instructeurId },
        select: { id: true },
      });
      if (!p) return NextResponse.json({ error: "Produit bump introuvable" }, { status: 404 });
    }

    const bump = await prisma.orderBump.create({
      data: {
        instructeurId: ctx.instructeurId,
        shopId: activeShopId,
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl?.trim() || null,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        bumpFormationId: bumpFormationId ?? null,
        bumpProductId: bumpProductId ?? null,
        appliesToAll: !!appliesToAll,
        targetFormationIds: Array.isArray(targetFormationIds) ? targetFormationIds : [],
        targetProductIds: Array.isArray(targetProductIds) ? targetProductIds : [],
      },
      include: {
        bumpFormation: { select: { id: true, title: true, slug: true, thumbnail: true } },
        bumpProduct: { select: { id: true, title: true, slug: true, banner: true } },
      },
    });

    return NextResponse.json({ data: bump }, { status: 201 });
  } catch (err) {
    console.error("[vendeur/order-bumps POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
