import { NextResponse } from "next/server";
import { isMonerooConfigured } from "@/lib/moneroo";

/**
 * GET /api/formations/payment/providers
 *
 * Retourne la liste des passerelles de paiement utilisables côté checkout.
 * Moneroo est la SEULE passerelle du site (décision fondateur, définitive) :
 * aucun autre nom de fournisseur ne doit jamais apparaître ici — cette route
 * alimente directement les libellés affichés à l'acheteur.
 *
 * Sécurité : on n'expose AUCUNE clé. Juste des booléens.
 */
export async function GET() {
  const providers = isMonerooConfigured()
    ? [
        {
          id: "moneroo",
          label: "Moneroo",
          available: true,
          description: "Paiement Mobile Money / carte",
        },
      ]
    : [
        {
          // Dev sans passerelle : entrée factice pour que le checkout s'affiche
          id: "moneroo",
          label: "Paiement (mode développement)",
          available: false,
          description: "Mode développement — aucune vraie passerelle configurée",
        },
      ];

  return NextResponse.json({ data: providers });
}
