import { NextResponse } from "next/server";
import { isMonerooConfigured } from "@/lib/moneroo";
import { isPayGeniusConfigured } from "@/lib/paygenius";

/**
 * GET /api/formations/payment/providers
 *
 * Retourne la liste des providers de paiement utilisables côté checkout.
 * Le frontend s'en sert pour afficher (ou masquer) le sélecteur Moneroo / PayGenius.
 *
 * Sécurité : on n'expose AUCUNE clé. Juste des booléens.
 */
export async function GET() {
  // PayGenius = passerelle de paiement UNIQUE. On n'annonce que PayGenius ;
  // Moneroo n'apparaît qu'en repli si PayGenius n'est pas configuré.
  const providers = isPayGeniusConfigured()
    ? [
        {
          id: "paygenius",
          label: "GeniusPay",
          available: true,
          description: "Paiement Mobile Money / carte via GeniusPay",
        },
      ]
    : isMonerooConfigured()
      ? [
          {
            id: "moneroo",
            label: "Moneroo",
            available: true,
            description: "Paiement Mobile Money / carte (repli)",
          },
        ]
      : [
          {
            // Dev sans passerelle : entrée factice pour que le checkout s'affiche
            id: "paygenius",
            label: "GeniusPay (mock)",
            available: false,
            description: "Mode développement — aucune vraie passerelle configurée",
          },
        ];

  return NextResponse.json({ data: providers });
}
