import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { CentreAide } from "@/components/formations/public/CentreAide";

/*
 * Centre d'aide — Server Component (métadonnées, FAQPage et fil d'Ariane
 * JSON-LD dans layout.tsx). L'en-tête avec recherche et les listes sont
 * dans CentreAide (client : état de recherche partagé).
 */
export default function AidePage() {
  return (
    <CoquePublique>
      <CentreAide />
    </CoquePublique>
  );
}
