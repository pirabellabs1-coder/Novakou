import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveShopLegalInfo, type ShopLegalInfo } from "@/lib/formations/shop-static";

const SHOP_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  themeColor: true,
  legalName: true,
  legalAddress: true,
  legalPhone: true,
  legalEmail: true,
  legalCountry: true,
  aboutText: true,
  updatedAt: true,
  instructeur: {
    select: {
      user: { select: { name: true, email: true, phone: true, country: true } },
    },
  },
} as const;

export interface ShopStaticResolved {
  shopId: string;
  slug: string;
  themeColor: string | null;
  logoUrl: string | null;
  info: ShopLegalInfo;
}

function toResolved(shop: {
  id: string; name: string; slug: string; description: string | null; logoUrl: string | null;
  themeColor: string | null; legalName: string | null; legalAddress: string | null;
  legalPhone: string | null; legalEmail: string | null; legalCountry: string | null;
  aboutText: string | null; updatedAt: Date;
  instructeur: { user: { name: string | null; email: string | null; phone: string | null; country: string | null } | null } | null;
}): ShopStaticResolved {
  const owner = shop.instructeur?.user ?? { name: null, email: null, phone: null, country: null };
  const info = resolveShopLegalInfo({
    name: shop.name,
    legalName: shop.legalName,
    legalAddress: shop.legalAddress,
    legalPhone: shop.legalPhone,
    legalEmail: shop.legalEmail,
    legalCountry: shop.legalCountry,
    aboutText: shop.aboutText,
    description: shop.description,
    updatedAt: shop.updatedAt,
    owner,
  });
  return { shopId: shop.id, slug: shop.slug, themeColor: shop.themeColor, logoUrl: shop.logoUrl, info };
}

/** Charge les infos statiques d'une boutique par slug. */
export async function loadShopStaticBySlug(slug: string): Promise<ShopStaticResolved | null> {
  try {
    const shop = await prisma.vendorShop.findUnique({ where: { slug: slug.toLowerCase() }, select: SHOP_SELECT });
    return shop ? toResolved(shop) : null;
  } catch (err) {
    console.error("[shop-static] slug lookup failed:", err);
    return null;
  }
}

/** Charge les infos statiques d'une boutique par domaine personnalisé. */
export async function loadShopStaticByDomain(host: string): Promise<ShopStaticResolved | null> {
  const normalized = decodeURIComponent(host).toLowerCase().replace(/^www\./, "");
  try {
    const shop = await prisma.vendorShop.findFirst({ where: { customDomain: normalized }, select: SHOP_SELECT });
    return shop ? toResolved(shop) : null;
  } catch (err) {
    console.error("[shop-static] domain lookup failed:", err);
    return null;
  }
}
