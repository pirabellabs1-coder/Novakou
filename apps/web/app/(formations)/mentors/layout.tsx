import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentors · Réservez un appel avec un expert",
  description:
    "Trouvez un mentor spécialisé en business, marketing, design ou tech. Réservez une session de mentorat individuel et progressez plus vite.",
  openGraph: {
    title: "Mentors · Novakou",
    description: "Sessions de mentorat individuelles avec des experts africains et internationaux.",
    type: "website",
  },
};

export default function MentorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
