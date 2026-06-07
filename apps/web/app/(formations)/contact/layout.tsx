import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export const metadata: Metadata = {
  title: "Nous contacter",
  description:
    "Contactez l'équipe Novakou pour toute question, partenariat ou assistance. Nous répondons sous 24h, en français, depuis Dakar.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — Novakou",
    description: "Contactez l'équipe Novakou pour toute question ou assistance.",
    type: "website",
    url: `${BASE_URL}/contact`,
    images: [
      {
        url: `${BASE_URL}/api/og?type=default&title=${encodeURIComponent("Nous contacter")}&subtitle=${encodeURIComponent("Une question, un partenariat ? L'équipe Novakou répond sous 24h.")}`,
        width: 1200,
        height: 630,
        alt: "Contacter Novakou",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — Novakou",
    description: "Contactez l'équipe Novakou pour toute question ou assistance.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
