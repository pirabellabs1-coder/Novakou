import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { resolveActiveShop, ACTIVE_SHOP_COOKIE } from "@/lib/formations/active-shop";
import { ensureDistinctShopColors } from "@/lib/formations/shop-colors";

/** GET — return the active shop + the full list to populate the switcher. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const ctx = await resolveActiveShop(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Aucune boutique" }, { status: 404 });

  // Répare les couleurs AVANT de lire la liste : c'est cette route que le
  // dashboard et le sélecteur appellent (pas /shops), donc c'est ici que la
  // recoloration rétro-active doit tourner pour être visible. Idempotent.
  await ensureDistinctShopColors(ctx.instructeurId);

  const allShops = await prisma.vendorShop.findMany({
    where: { instructeurId: ctx.instructeurId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isPrimary: true,
      themeColor: true,
      logoUrl: true,
      customDomain: true,
      customDomainVerified: true,
    },
  });

  return NextResponse.json({
    data: {
      activeShop: ctx.shop,
      shops: allShops,
      shopCount: ctx.shopCount,
      needsChooser: ctx.needsChooser,
      max: 5,
    },
  });
}

/** POST — set the active shop. body { shopId }. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const ctx = await resolveVendorContext(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  let body: { shopId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const shopId = (body.shopId ?? "").trim();
  if (!shopId) return NextResponse.json({ error: "shopId requis" }, { status: 400 });

  const cookieStore = await cookies();

  // Portée « TOUTES LES BOUTIQUES » (vue cumulée) : on pose une valeur sentinelle
  // « all » dans le cookie. getActiveShopId la traduit en null (aucun filtre),
  // donc TOUTES les pages vendeur qui lisent le cookie deviennent cumulées, sans
  // les modifier une par une. Pas de boutique à valider ici.
  if (shopId === "all") {
    cookieStore.set(ACTIVE_SHOP_COOKIE, "all", {
      path: "/", sameSite: "lax", httpOnly: false, maxAge: 60 * 60 * 24 * 30,
    });
    return NextResponse.json({ data: { activeShopId: "all" } });
  }

  const shop = await prisma.vendorShop.findFirst({
    where: { id: shopId, instructeurId: ctx.instructeurId },
    select: { id: true, name: true, slug: true },
  });
  if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

  cookieStore.set(ACTIVE_SHOP_COOKIE, shop.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: false, // accessible côté client si besoin
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });

  return NextResponse.json({ data: { activeShopId: shop.id, name: shop.name, slug: shop.slug } });
}
