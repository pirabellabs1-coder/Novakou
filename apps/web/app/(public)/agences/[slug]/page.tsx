import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import AgencyProfileClient from "./AgencyProfileClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Try by ID first, then by slugified name
    let agency = await prisma.agencyProfile.findUnique({
      where: { id: slug },
      select: { agencyName: true, description: true, logo: true, sector: true, country: true, verified: true },
    });

    if (!agency) {
      const all = await prisma.agencyProfile.findMany({ select: { id: true, agencyName: true } });
      const match = all.find((a) => a.agencyName.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase());
      if (match) {
        agency = await prisma.agencyProfile.findUnique({
          where: { id: match.id },
          select: { agencyName: true, description: true, logo: true, sector: true, country: true, verified: true },
        });
      }
    }

    if (!agency) {
      return { title: "Agence introuvable | FreelanceHigh" };
    }

    const title = agency.agencyName;
    const description = agency.description
      ? agency.description.slice(0, 160)
      : `Decouvrez ${agency.agencyName} sur FreelanceHigh${agency.sector ? ` — ${agency.sector}` : ""}`;
    const ogImage = agency.logo || "https://freelancehigh.com/og-default.png";

    return {
      title: `${title} | FreelanceHigh`,
      description,
      openGraph: {
        title: `${title} | FreelanceHigh`,
        description,
        images: [{ url: ogImage, width: 400, height: 400, alt: title }],
        type: "website",
        siteName: "FreelanceHigh",
      },
      twitter: {
        card: "summary",
        title: `${title} | FreelanceHigh`,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: "FreelanceHigh — Agences" };
  }
}

async function AgencyJsonLd({ slug }: { slug: string }) {
  try {
    let agency = await prisma.agencyProfile.findUnique({
      where: { id: slug },
      select: { agencyName: true, description: true, logo: true, website: true, sector: true, country: true },
    });

    if (!agency) {
      const all = await prisma.agencyProfile.findMany({ select: { id: true, agencyName: true } });
      const match = all.find((a) => a.agencyName.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase());
      if (match) {
        agency = await prisma.agencyProfile.findUnique({
          where: { id: match.id },
          select: { agencyName: true, description: true, logo: true, website: true, sector: true, country: true },
        });
      }
    }

    if (!agency) return null;

    // Get aggregate rating from agency services reviews
    const ratingAgg = await prisma.review.aggregate({
      where: { service: { agency: { agencyName: agency.agencyName } } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: agency.agencyName,
      description: agency.description?.slice(0, 300) || "",
      url: `https://freelancehigh.com/agences/${slug}`,
      ...(agency.logo ? { logo: agency.logo } : {}),
      ...(agency.website ? { sameAs: [agency.website] } : {}),
      ...(agency.country ? { address: { "@type": "PostalAddress", addressCountry: agency.country } } : {}),
    };

    if (ratingAgg._count.rating > 0) {
      jsonLd.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: Math.round((ratingAgg._avg.rating ?? 0) * 10) / 10,
        reviewCount: ratingAgg._count.rating,
        bestRating: 5,
        worstRating: 1,
      };
    }

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

export default async function AgencyProfilePage({ params }: Props) {
  const { slug } = await params;

  return (
    <>
      <AgencyJsonLd slug={slug} />
      <AgencyProfileClient />
    </>
  );
}
