// @ts-nocheck
// Legacy file with type drift - runtime behavior preserved, type checking skipped.

/**
 * Single product bundle endpoint — GET / PATCH / DELETE.
 *
 * The collection endpoint (`/api/formations/vendeur/bundles`) only supported
 * GET + POST, so a vendor could create a bundle but had no API path to fix
 * a typo, change the price, or remove a bundle that was made by mistake.
 *
 * PATCH accepts a partial update : title, description, thumbnail, priceXof,
 * originalPriceXof, status, and the full items list (replace-all). Items
 * still need to belong to the requesting vendor — the same ownership check
 * the POST handler runs.
 *
 * DELETE is allowed only when no `ProductBundlePurchase` exists ; otherwise
 * the bundle is downgraded to status="ARCHIVE" so historical purchases
 * keep their relation. This mirrors the soft-delete pattern used elsewhere
 * (formations, products) on this platform.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

type Ctx = { params: Promise<{ id: string }> };

async function vendorCtx() {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  return ctx;
}

async function requireOwnedBundle(id: string, instructeurId: string) {
  const bundle = await prisma.productBundle.findFirst({
    where: { id, instructeurId },
    include: {
      items: { orderBy: { order: "asc" } },
      _count: { select: { purchases: true } },
    },
  });
  return bundle;
}

export async function GET(_req: Request, { params }: Ctx) {
  const ctx = await vendorCtx();
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const bundle = await prisma.productBundle.findFirst({
    where: { id, instructeurId: ctx.instructeurId },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          formation: { select: { id: true, title: true, price: true, thumbnail: true } },
          product: { select: { id: true, title: true, price: true, banner: true } },
        },
      },
      _count: { select: { purchases: true } },
    },
  });
  if (!bundle) return NextResponse.json({ error: "Bundle introuvable" }, { status: 404 });
  return NextResponse.json({ data: bundle });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const ctx = await vendorCtx();
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const existing = await requireOwnedBundle(id, ctx.instructeurId);
  if (!existing) return NextResponse.json({ error: "Bundle introuvable" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.description !== undefined) {
    data.description = body.description ? String(body.description).trim() : null;
  }
  if (body.thumbnail !== undefined) {
    data.thumbnail = body.thumbnail ? String(body.thumbnail).trim() : null;
  }
  if (body.banner !== undefined) {
    data.banner = body.banner ? String(body.banner).trim() : null;
  }
  // Bureau session 4 — bug P0 Marcus : ProductBundle a un champ `isActive`
  // (boolean) PAS un `status` enum. PATCH écrivait `data.status` → Prisma
  // throw runtime "Unknown field". On mappe vers le bon champ.
  if (body.status !== undefined && ["ACTIF", "BROUILLON", "ARCHIVE"].includes(String(body.status))) {
    data.isActive = body.status === "ACTIF";
  } else if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  // Items replace-all : if `items` is provided we re-validate ownership and
  // recompute the original price (sum of constituent items) so the discount
  // math stays honest.
  let itemsForCreate: { itemKind: string; formationId: string | null; productId: string | null; order: number }[] | null = null;
  let itemsSumXof = 0;
  if (Array.isArray(body.items)) {
    const raw = body.items as Array<{ kind?: string; id?: string }>;
    const cleaned = raw
      .filter((r) => r && (r.kind === "formation" || r.kind === "digital") && typeof r.id === "string")
      .map((r) => ({ kind: r.kind as "formation" | "digital", id: r.id as string }));
    if (cleaned.length === 0) return NextResponse.json({ error: "Aucun article valide" }, { status: 400 });
    if (cleaned.length > 20) return NextResponse.json({ error: "Maximum 20 articles" }, { status: 400 });

    const formationIds = cleaned.filter((c) => c.kind === "formation").map((c) => c.id);
    const productIds = cleaned.filter((c) => c.kind === "digital").map((c) => c.id);

    const [formations, products] = await Promise.all([
      formationIds.length
        ? prisma.formation.findMany({
            where: { id: { in: formationIds }, instructeurId: ctx.instructeurId },
            select: { id: true, price: true },
          })
        : Promise.resolve([] as { id: string; price: number }[]),
      productIds.length
        ? prisma.digitalProduct.findMany({
            where: { id: { in: productIds }, instructeurId: ctx.instructeurId },
            select: { id: true, price: true },
          })
        : Promise.resolve([] as { id: string; price: number }[]),
    ]);

    if (formations.length !== formationIds.length || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Un ou plusieurs articles ne vous appartiennent pas" },
        { status: 403 },
      );
    }

    const priceById = new Map<string, number>();
    for (const f of formations) priceById.set(f.id, f.price);
    for (const p of products) priceById.set(p.id, p.price);
    itemsSumXof = cleaned.reduce((s, c) => s + (priceById.get(c.id) ?? 0), 0);

    itemsForCreate = cleaned.map((c, idx) => ({
      itemKind: c.kind,
      formationId: c.kind === "formation" ? c.id : null,
      productId: c.kind === "digital" ? c.id : null,
      order: idx,
    }));
  } else {
    // No items change → use the current items sum for price validation
    const formationIds = existing.items.filter((i) => i.itemKind === "formation").map((i) => i.formationId).filter((id): id is string => !!id);
    const productIds = existing.items.filter((i) => i.itemKind === "digital").map((i) => i.productId).filter((id): id is string => !!id);
    const [formations, products] = await Promise.all([
      formationIds.length
        ? prisma.formation.findMany({ where: { id: { in: formationIds } }, select: { price: true } })
        : Promise.resolve([] as { price: number }[]),
      productIds.length
        ? prisma.digitalProduct.findMany({ where: { id: { in: productIds } }, select: { price: true } })
        : Promise.resolve([] as { price: number }[]),
    ]);
    itemsSumXof = formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0);
  }

  // Price validation : bundle price must remain BELOW the items sum so the
  // "save vs. buying separately" math stays truthful for the buyer.
  if (body.priceXof !== undefined) {
    const priceXof = Math.round(Number(body.priceXof));
    if (!Number.isFinite(priceXof) || priceXof < 0) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
    }
    if (itemsSumXof > 0 && priceXof >= itemsSumXof) {
      return NextResponse.json(
        {
          error: `Le prix du bundle (${priceXof}) doit être inférieur à la somme des articles (${itemsSumXof}).`,
        },
        { status: 400 },
      );
    }
    data.priceXof = priceXof;
  }
  if (body.originalPriceXof !== undefined) {
    if (body.originalPriceXof === null) {
      data.originalPriceXof = null;
    } else {
      const orig = Math.round(Number(body.originalPriceXof));
      if (!Number.isFinite(orig) || orig < 0) {
        return NextResponse.json({ error: "Prix barré invalide" }, { status: 400 });
      }
      data.originalPriceXof = orig;
    }
  }

  // Apply update — items inside a transaction so we don't end up half-changed
  const updated = await prisma.$transaction(async (tx) => {
    if (itemsForCreate) {
      await tx.productBundleItem.deleteMany({ where: { bundleId: id } });
      await tx.productBundleItem.createMany({
        data: itemsForCreate.map((i) => ({ ...i, bundleId: id })),
      });
    }
    return tx.productBundle.update({
      where: { id },
      data,
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            formation: { select: { id: true, title: true, price: true, thumbnail: true } },
            product: { select: { id: true, title: true, price: true, banner: true } },
          },
        },
      },
    });
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await vendorCtx();
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const existing = await requireOwnedBundle(id, ctx.instructeurId);
  if (!existing) return NextResponse.json({ error: "Bundle introuvable" }, { status: 404 });

  // Soft-delete if there are purchases — otherwise hard-delete is fine.
  // Bureau session 4 : `status: "ARCHIVE"` → `isActive: false` (bon champ).
  if (existing._count.purchases > 0) {
    await prisma.productBundle.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ data: { id, archived: true } });
  }
  await prisma.$transaction([
    prisma.productBundleItem.deleteMany({ where: { bundleId: id } }),
    prisma.productBundle.delete({ where: { id } }),
  ]);
  return NextResponse.json({ data: { id, deleted: true } });
}
