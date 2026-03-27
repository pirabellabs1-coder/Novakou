import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ServiceDetailClient from "./ServiceDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const service = await prisma.service.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        status: "ACTIF",
      },
      select: {
        title: true,
        descriptionText: true,
        images: true,
        tags: true,
        basePrice: true,
        rating: true,
        ratingCount: true,
        orderCount: true,
        seoMetaTitle: true,
        seoMetaDescription: true,
        category: { select: { name: true } },
        user: { select: { name: true } },
        agency: { select: { agencyName: true } },
      },
    });

    if (!service) {
      return { title: "Service introuvable | FreelanceHigh" };
    }

    const title = service.seoMetaTitle || service.title;
    const description =
      service.seoMetaDescription ||
      (service.descriptionText ? service.descriptionText.slice(0, 160) : `${service.title} par ${service.agency?.agencyName || service.user?.name || "un freelance"} sur FreelanceHigh`);
    const images = (service.images as string[]) || [];
    const ogImage = images[0] || "https://freelancehigh.com/og-default.png";
    const vendorName = service.agency?.agencyName || service.user?.name || "FreelanceHigh";

    return {
      title: `${title} | FreelanceHigh`,
      description,
      keywords: service.tags || [],
      openGraph: {
        title: `${title} | FreelanceHigh`,
        description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
        type: "website",
        siteName: "FreelanceHigh",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | FreelanceHigh`,
        description,
        images: [ogImage],
      },
      other: {
        // JSON-LD will be rendered in the page component
        "service:price": String(service.basePrice),
        "service:rating": String(service.rating),
        "service:vendor": vendorName,
      },
    };
  } catch {
    return { title: "FreelanceHigh — Services" };
  }
}

// JSON-LD structured data component
async function ServiceJsonLd({ slug }: { slug: string }) {
  try {
    const service = await prisma.service.findFirst({
      where: { OR: [{ slug }, { id: slug }], status: "ACTIF" },
      select: {
        title: true,
        descriptionText: true,
        basePrice: true,
        rating: true,
        ratingCount: true,
        images: true,
        slug: true,
        seoMetaTitle: true,
        seoMetaDescription: true,
      },
    });

    if (!service) return null;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.seoMetaTitle || service.title,
      description: service.seoMetaDescription || service.descriptionText?.slice(0, 300) || "",
      url: `https://freelancehigh.com/services/${service.slug}`,
      image: (service.images as string[])?.[0] || undefined,
      provider: {
        "@type": "Organization",
        name: "FreelanceHigh",
        url: "https://freelancehigh.com",
      },
      offers: {
        "@type": "Offer",
        price: service.basePrice,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
      ...(service.ratingCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: service.rating,
              reviewCount: service.ratingCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  } catch {
    return null;
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <ServiceJsonLd slug={slug} />
      <ServiceDetailClient />
    </>
  );
}
