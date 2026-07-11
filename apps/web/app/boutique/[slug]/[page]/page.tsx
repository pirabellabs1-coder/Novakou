import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopStaticPage from "@/components/formations/ShopStaticPage";
import { loadShopStaticBySlug } from "@/lib/formations/shop-static-loader";
import { SHOP_STATIC_PAGES, isShopStaticSlug } from "@/lib/formations/shop-static";

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string; page: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page } = await params;
  if (!isShopStaticSlug(page)) return { title: "Page introuvable" };
  const data = await loadShopStaticBySlug(slug);
  if (!data) return { title: "Boutique introuvable" };
  return {
    title: `${SHOP_STATIC_PAGES[page].title} · ${data.info.shopName}`,
    description: `${SHOP_STATIC_PAGES[page].title} — ${data.info.shopName}.`,
  };
}

export default async function ShopStaticRoute({ params }: Props) {
  const { slug, page } = await params;
  if (!isShopStaticSlug(page)) notFound();
  const data = await loadShopStaticBySlug(slug);
  if (!data) notFound();
  return (
    <ShopStaticPage
      slug={page}
      info={data.info}
      base={`/boutique/${data.slug}`}
      themeColor={data.themeColor}
      logoUrl={data.logoUrl}
    />
  );
}
