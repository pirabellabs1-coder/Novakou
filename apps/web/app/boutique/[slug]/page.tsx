import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoutiqueView from "@/components/formations/BoutiqueView";

interface Props {
  params: Promise<{ slug: string }>;
}

async function resolve(slugParam: string) {
  const slug = slugParam.toLowerCase();
  try {
    const vendor = await prisma.instructeurProfile.findFirst({
      where: { shopSlug: slug },
      select: {
        id: true,
        shopSlug: true,
        bioFr: true,
        customDomain: true,
        customDomainVerified: true,
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

    return { vendor, formations, products };
  } catch (err) {
    console.error("[boutique/slug] lookup failed:", err);
    return null;
  }
}

/**
 * Public vendor shop accessed via novakou.com/boutique/<shopSlug>.
 * Alternative URL when the vendor has no custom domain yet.
 */
export default async function BoutiqueBySlugPage({ params }: Props) {
  const { slug } = await params;
  const data = await resolve(slug);
  if (!data) notFound();

  const { vendor, formations, products } = data;

  return (
    <BoutiqueView
      owner={{
        name: vendor.user?.name ?? "Créateur",
        email: vendor.user?.email ?? null,
        image: vendor.user?.image ?? null,
        bio: vendor.bioFr,
        kind: "vendor",
        domain: vendor.customDomain && vendor.customDomainVerified ? vendor.customDomain : null,
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
