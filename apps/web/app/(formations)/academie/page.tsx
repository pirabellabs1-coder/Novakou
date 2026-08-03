import type { Metadata } from "next";
import AcademieClient from "./AcademieClient";

export const metadata: Metadata = {
  title: "Académie Novakou · Ressources gratuites pour créateurs",
  description:
    "Guides, vidéos et ebooks gratuits pour lancer et vendre vos formations et produits digitaux en Afrique francophone.",
  alternates: { canonical: "/academie" },
  openGraph: {
    title: "Académie Novakou · Ressources gratuites pour créateurs",
    description:
      "Guides, vidéos et ebooks gratuits pour lancer et vendre vos formations et produits digitaux.",
    type: "website",
  },
};

export default function AcademiePage() {
  return <AcademieClient />;
}
