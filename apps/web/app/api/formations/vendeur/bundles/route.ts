/**
 * Vendor product bundles — pack several formations/products at a reduced price.
 *
 * GET   → list my bundles
 * POST  { title, description?, priceXof, items: [{ kind, id }], thumbnail? }
 *       → create a new bundle (slug auto-generated)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const activeShopId = await getActiveShopId(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });

  const bundles = await prisma.productBundle.findMany({
    where: {
      instructeurId: ctx.instructeurId,
      ...(activeShopId ? { shopId: activeShopId } : {}),
    },
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
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: bundles });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const activeShopId = await getActiveShopId(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const thumbnail = body.thumbnail ? String(body.thumbnail).trim() : null;
  const priceXof = Number(body.priceXof);
  const rawItems = Array.isArray(body.items) ? (body.items as unknown[]) : [];

  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  if (!Number.isFinite(priceXof) || priceXof < 500) {
    return NextResponse.json({ error: "Prix invalide (minimum 500 FCFA)" }, { status: 400 });
  }
  if (rawItems.length < 2 || rawItems.length > 20) {
    return NextResponse.json({ error: "2 à 20 articles requis" }, { status: 400 });
  }

  // Validate + resolve items (must belong to this instructor)
  const items: { kind: "formation" | "digital"; id: string; price: number }[] = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as { kind?: string; id?: string };
    if (r.kind !== "formation" && r.kind !== "digital") continue;
    if (!r.id) continue;
    items.push({ kind: r.kind as "formation" | "digital", id: r.id, price: 0 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Aucun article valide" }, { status: 400 });
  }

  const [formations, products] = await Promise.all([
    prisma.formation.findMany({
      where: {
        id: { in: items.filter((i) => i.kind === "formation").map((i) => i.id) },
        instructeurId: ctx.instructeurId,
      },
      select: { id: true, price: true },
    }),
    prisma.digitalProduct.findMany({
      where: {
        id: { in: items.filter((i) => i.kind === "digital").map((i) => i.id) },
        instructeurId: ctx.instructeurId,
      },
      select: { id: true, price: true },
    }),
  ]);
  const fById = new Map(formations.map((f) => [f.id, f.price]));
  const pById = new Map(products.map((p) => [p.id, p.price]));
  let originalPrice = 0;
  const resolved: { kind: "formation" | "digital"; id: string; price: number }[] = [];
  for (const i of items) {
    const price = i.kind === "formation" ? fById.get(i.id) : pById.get(i.id);
    if (price === undefined) continue; // item not owned by this instructor
    resolved.push({ ...i, price });
    originalPrice += price;
  }
  if (resolved.length < 2) {
    return NextResponse.json(
      { error: "Au moins 2 articles vous appartenant doivent être inclus." },
      { status: 400 },
    );
  }
  if (priceXof >= originalPrice) {
    return NextResponse.json(
      { error: `Le prix du bundle (${priceXof}) doit être inférieur à la somme des articles (${originalPrice}).` },
      { status: 400 },
    );
  }

  // Slug unique
  const baseSlug = slugify(title) || "bundle";
  let slug = baseSlug;
  for (let i = 1; i < 20; i++) {
    const exists = await prisma.productBundle.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i}`;
  }

  const bundle = await prisma.productBundle.create({
    data: {
      instructeurId: ctx.instructeurId,
      shopId: activeShopId,
      slug,
      title,
      description,
      thumbnail,
      priceXof,
      originalPriceXof: originalPrice,
      items: {
        create: resolved.map((r, idx) => ({
          itemKind: r.kind,
          formationId: r.kind === "formation" ? r.id : null,
          productId: r.kind === "digital" ? r.id : null,
          order: idx,
        })),
      },
    },
    include: {
      items: {
        include: {
          formation: { select: { id: true, title: true, price: true, thumbnail: true } },
          product: { select: { id: true, title: true, price: true, banner: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: bundle }, { status: 201 });
}
