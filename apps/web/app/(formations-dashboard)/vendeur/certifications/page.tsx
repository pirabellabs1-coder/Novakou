import { redirect } from "next/navigation";

/**
 * Alias /vendeur/certifications → /vendeur/dashboard
 *
 * Pas encore de page dédiée aux certifications côté vendeur. Le dashboard
 * affiche les statistiques de complétion qui mènent aux certificats émis.
 */
export default function VendeurCertificationsAlias() {
  redirect("/vendeur/dashboard");
}
