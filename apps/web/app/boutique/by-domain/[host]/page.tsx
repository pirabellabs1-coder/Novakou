import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoutiqueView from "@/components/formations/BoutiqueView";

interface Props {
  params: Promise<{ host: string }>;
}

async function resolve(hostParam: string) {
  const normalized = decodeURIComponent(hostParam).toLowerCase().replace(/^www\./, "");
  try {
    const vendor = await prisma.instructeurProfile.findFirst({
      where: { customDomain: normalized, customDomainVerified: true },
      select: {
        id: true,
        shopSlug: true,
        bioFr: true,
        user: { select: { name: true, email: true, image: true } },
      },
    });
    if (!vendor) return null;

    const [formations, products] = await Promise.all([
      prisma.formation.findMany({
        where: { instructeurId: vendor.id, status: "ACTIF" },
        select: {
          id: true,
          slug: true,
          title: true,
          thumbnail: true,
          price: true,
          isFree: true,
          rating: true,
          studentsCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.digitalProduct.findMany({
        where: { instructeurId: vendor.id, status: "ACTIF" },
        select: {
          id: true,
          slug: true,
          title: true,
          banner: true,
          price: true,
          isFree: true,
          rating: true,
          salesCount: true,
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
    ]);

    return { vendor, formations, products, normalized };
  } catch (err) {
    console.error("[boutique/by-domain] lookup failed:", err);
    return null;
  }
}

/**
 * Entry point when a request hits Novakou via a vendor's custom domain.
 * Middleware rewrites the request to /boutique/by-domain/<host>.
 */
export default async function BoutiqueByDomainPage({ params }: Props) {
  const { host } = await params;
  const data = await resolve(host);
  if (!data) notFound();

  const { vendor, formations, products, normalized } = data;

  return (
    <BoutiqueView
      owner={{
        name: vendor.user?.name ?? "Créateur",
        email: vendor.user?.email ?? null,
        image: vendor.user?.image ?? null,
        bio: vendor.bioFr,
        kind: "vendor",
        domain: normalized,
      }}
      formations={formations.map((f) => ({
        kind: "formation" as const,
        id: f.id,
        slug: f.slug,
        title: f.title,
        image: f.thumbnail,
        price: f.price,
        isFree: f.isFree,
        rating: f.rating,
        count: f.studentsCount,
      }))}
      products={products.map((p) => ({
        kind: "product" as const,
        id: p.id,
        slug: p.slug,
        title: p.title,
        image: p.banner,
        price: p.price,
        isFree: p.isFree,
        rating: p.rating,
        count: p.salesCount,
      }))}
    />
  );
}
