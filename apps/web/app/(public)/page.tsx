import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsBar } from "@/components/landing/StatsBar";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { TopFreelancesSection } from "@/components/landing/TopFreelancesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CtaSection } from "@/components/landing/CtaSection";

export const metadata: Metadata = {
  title: "FreelanceHigh — La plateforme freelance qui élève votre carrière",
  description:
    "Connectez-vous avec les meilleurs freelances d'Afrique francophone, de la diaspora et du monde entier. Marketplace premium de services digitaux.",
  openGraph: {
    title: "FreelanceHigh — La plateforme freelance qui élève votre carrière",
    description:
      "Connectez-vous avec les meilleurs freelances d'Afrique francophone, de la diaspora et du monde entier.",
    url: "https://freelancehigh.com",
    siteName: "FreelanceHigh",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreelanceHigh",
    description:
      "La plateforme freelance qui élève votre carrière au plus haut niveau.",
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
      description:
        "Plateforme internationale de freelancing francophone, ciblant l'Afrique francophone, la diaspora et le marché international.",
      foundingDate: "2026",
      founder: {
        "@type": "Person",
        name: "Lissanon Gildas",
      },
      sameAs: [],
    }),
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <StatsBar />
      <CategoriesSection />
      <TopFreelancesSection />
      <HowItWorksSection />
      <CtaSection />
    </div>
  );
}
