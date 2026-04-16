import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { PopularServicesSection } from "@/components/landing/PopularServicesSection";
import { TopFreelancesSection } from "@/components/landing/TopFreelancesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { CtaSection } from "@/components/landing/CtaSection";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.home");

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: "https://freelancehigh.com",
      siteName: "FreelanceHigh",
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "FreelanceHigh",
      description: t("twitter_description"),
    },
    alternates: {
      canonical: "https://freelancehigh.com",
    },
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "FreelanceHigh",
        url: "https://freelancehigh.com",
        description: t("description"),
        foundingDate: "2026",
        founder: {
          "@type": "Person",
          name: "Lissanon Gildas",
        },
        sameAs: [],
      }),
    },
  };
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <StatsBar />
      <CategoriesSection />
      <PopularServicesSection />
      <TopFreelancesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <TrustSection />
      <CtaSection />
    </div>
  );
}
