import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nous contacter — Novakou",
  description:
    "Contactez l'équipe Novakou pour toute question, partenariat ou assistance. Nous répondons sous 24h.",
  openGraph: {
    title: "Contact — Novakou",
    description: "Contactez l'équipe Novakou pour toute question ou assistance.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
