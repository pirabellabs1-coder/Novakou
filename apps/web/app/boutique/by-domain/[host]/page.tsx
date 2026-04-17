import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoutiqueView from "@/components/formations/BoutiqueView";

interface Props {
  params: Promise<{ host: string }>;
}

async function resolve(hostParam: string) {
  const normalized = decodeURIComponent(hostParam).toLowerCase().replace(/^www\./, "");
  try {
    const shop = await prisma.vendorShop.findFirst({
      where: { customDomain: normalized },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        themeColor: true,
        instructeur: {
          select: {
            id: true,
            bioFr: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
      },
    });
    if (!shop) return null;

    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { instructeurId: shop.instructeur.id, status: "ACTIF" },
        select: {
          id: true, slug: true, title: true, thumbnail: true,
          price: true, isFree: true, rating: true, studentsCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.digitalProduct.findMany({
        where: { instructeurId: shop.instructeur.id, status: "ACTIF" },
        select: {
          id: true, slug: true, title: true, banner: true,
          price: true, isFree: true, rating: true, salesCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
    ]);

    return { shop, formations, products, normalized };
  } catch (err) {
    console.error("[boutique/by-domain] lookup failed:", err);
    return null;
  }
}

export default async function BoutiqueByDomainPage({ params }: Props) {
  const { host } = await params;
  const data = await resolve(host);
  if (!data) notFound();

  const { shop, formations, products, normalized } = data;
  return (
    <BoutiqueView
      owner={{
        name: shop.name || shop.instructeur.user?.name || "Créateur",
        email: shop.instructeur.user?.email ?? null,
        image: shop.logoUrl ?? shop.instructeur.user?.image ?? null,
        bio: shop.description ?? shop.instructeur.bioFr,
        kind: "vendor",
        domain: normalized,
        themeColor: shop.themeColor ?? null,
      }}
      formations={formations.map((f) => ({
        kind: "formation" as const,
        id: f.id, slug: f.slug, title: f.title, image: f.thumbnail,
        price: f.price, isFree: f.isFree, rating: f.rating, count: f.studentsCount,
      }))}
      products={products.map((p) => ({
        kind: "product" as const,
        id: p.id, slug: p.slug, title: p.title, image: p.banner,
        price: p.price, isFree: p.isFree, rating: p.rating, count: p.salesCount,
      }))}
    />
  );
}
