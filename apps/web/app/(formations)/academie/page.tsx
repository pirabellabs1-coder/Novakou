import type { Metadata } from "next";
import AcademieClient from "./AcademieClient";

export const metadata: Metadata = {
  // `absolute` : « Novakou » est deja dans le titre. Sans ça, le template
  // du layout racine ajoute « | Novakou » et le nom sort deux fois.
  title: { absolute: "Académie Novakou · Ressources gratuites pour créateurs" },
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
