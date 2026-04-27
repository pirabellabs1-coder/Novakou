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
  const providers = [
    {
      id: "moneroo",
      label: "Moneroo",
      available: isMonerooConfigured(),
      description: "Paiement Mobile Money / carte via Moneroo",
    },
    {
      id: "paygenius",
      label: "PayGenius",
      available: isPayGeniusConfigured(),
      description: "Paiement Mobile Money / carte via GeniusPay",
    },
  ].filter((p) => p.available);

  // En dev sans aucun provider configuré, on ajoute un faux entry pour que
  // le checkout affiche quand même l'option (le backend tombera en mode mock)
  if (providers.length === 0) {
    providers.push({
      id: "moneroo",
      label: "Moneroo (mock)",
      available: false,
      description: "Mode développement — aucune vraie passerelle configurée",
    });
  }

  return NextResponse.json({ data: providers });
}
