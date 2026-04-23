/**
 * Active shop resolution for the multi-shop vendor experience.
 *
 * Each vendor can own up to 5 shops. Once authenticated, an "active shop" is
 * stored in cookie `nk_active_shop`. All vendor dashboard reads/writes are
 * scoped to that shop's id.
 *
 * Resolution order:
 *   1. cookie nk_active_shop value, if it points to a shop owned by the user
 *   2. if user has exactly one shop -> auto-select it (transparent)
 *   3. otherwise -> null (caller redirects to /vendeur/choisir-boutique)
 */
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { ensurePrimaryShop } from "@/lib/formations/ensure-primary-shop";
import type { getServerSession } from "next-auth";

export const ACTIVE_SHOP_COOKIE = "nk_active_shop";

export interface ActiveShopContext {
  instructeurId: string;
  shop: {
    id: string;
    name: string;
    slug: string;
    isPrimary: boolean;
    customDomain: string | null;
    customDomainVerified: boolean;
    themeColor: string | null;
    logoUrl: string | null;
  };
  shopCount: number;
  needsChooser: boolean;
}

/**
 * Resolve the active shop for the current request.
 * Returns null when the user must pick a shop (i.e. has 2+ shops and no valid cookie).
 */
export async function resolveActiveShop(
  session: Awaited<ReturnType<typeof getServerSession>>,
  opts: { devFallback?: string } = {},
): Promise<ActiveShopContext | null> {
  const ctx = await resolveVendorContext(session, opts);
  if (!ctx) return null;

  // ✨ Garantit qu'au moins une boutique primaire existe (auto-create si absent)
  await ensurePrimaryShop({
    instructeurId: ctx.instructeurId,
    userId: ctx.userId,
  });

  const allShops = await prisma.vendorShop.findMany({
    where: { instructeurId: ctx.instructeurId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isPrimary: true,
      customDomain: true,
      customDomainVerified: true,
      themeColor: true,
      logoUrl: true,
    },
  });

  const shopCount = allShops.length;
  if (shopCount === 0) return null;

  // 1) Cookie hint
  let chosen: (typeof allShops)[number] | null = null;
  try {
    const cookieStore = await cookies();
    const c = cookieStore.get(ACTIVE_SHOP_COOKIE)?.value;
    if (c) chosen = allShops.find((s) => s.id === c) ?? null;
  } catch {
    /* not in a request context */
  }

  // 2) Single-shop auto-select
  if (!chosen && shopCount === 1) chosen = allShops[0];

  if (!chosen) {
    return {
      instructeurId: ctx.instructeurId,
      shop: allShops[0],
      shopCount,
      needsChooser: true,
    };
  }

  return {
    instructeurId: ctx.instructeurId,
    shop: chosen,
    shopCount,
    needsChooser: false,
  };
}

/** Lightweight: just resolve the active shop id (returns null if chooser is needed). */
export async function getActiveShopId(
  session: Awaited<ReturnType<typeof getServerSession>>,
  opts: { devFallback?: string } = {},
): Promise<string | null> {
  const ctx = await resolveActiveShop(session, opts);
  if (!ctx || ctx.needsChooser) return null;
  return ctx.shop.id;
}
