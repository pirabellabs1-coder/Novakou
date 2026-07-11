import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopStaticPage from "@/components/formations/ShopStaticPage";
import { loadShopStaticByDomain } from "@/lib/formations/shop-static-loader";
import { SHOP_STATIC_PAGES, isShopStaticSlug } from "@/lib/formations/shop-static";
import { shopFontHref } from "@/lib/formations/shop-fonts";

interface Props {
  params: Promise<{ host: string; page: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host, page } = await params;
  if (!isShopStaticSlug(page)) return { title: "Page introuvable" };
  const data = await loadShopStaticByDomain(host);
  if (!data) return { title: "Boutique introuvable" };
  return {
    title: `${SHOP_STATIC_PAGES[page].title} · ${data.info.shopName}`,
    description: `${SHOP_STATIC_PAGES[page].title} — ${data.info.shopName}.`,
  };
}

export default async function ShopStaticByDomainRoute({ params }: Props) {
  const { host, page } = await params;
  if (!isShopStaticSlug(page)) notFound();
  const data = await loadShopStaticByDomain(host);
  if (!data) notFound();
  const fontHref = shopFontHref(data.font);
  // Domaine perso : les liens boutique sont à la racine.
  return (
    <>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <ShopStaticPage
        slug={page}
        info={data.info}
        base=""
        themeColor={data.themeColor}
        logoUrl={data.logoUrl}
        font={data.font}
      />
    </>
  );
}
