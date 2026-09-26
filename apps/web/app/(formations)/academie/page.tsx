import type { Metadata } from "next";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
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
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Académie Novakou"
        titre={
          <>
            Apprenez à vendre <em>et à réussir</em>
          </>
        }
        sousTitre="Formations vidéo, guides PDF et ressources gratuites — pour tirer le meilleur de Novakou. Accessible à tous, même sans compte. Mis à jour régulièrement par l'équipe."
        actions={
          <>
            <BoutonVerre href="#ressources" variante="primary" taille="lg" fleche>
              Parcourir les ressources
            </BoutonVerre>
            <BoutonVerre href="/guides" taille="lg">
              Lire les guides écrits
            </BoutonVerre>
          </>
        }
        meta={["100 % gratuit", "Sans inscription", "Vidéos, PDF et liens"]}
      />
      <AcademieClient />
    </CoquePublique>
  );
}
