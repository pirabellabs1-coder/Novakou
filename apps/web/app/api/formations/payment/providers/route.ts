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
  // Provider actif piloté par env PAYMENT_PROVIDER (par défaut "moneroo" depuis
  // le 2026-06-27, settlement GeniusPay bloqué). Repasser à GeniusPay =
  // PAYMENT_PROVIDER=paygenius. On annonce uniquement le provider actif.
  const pref = (process.env.PAYMENT_PROVIDER || "moneroo").toLowerCase();
  const usePayGenius = pref === "paygenius" && isPayGeniusConfigured();
  const useMoneroo = !usePayGenius && isMonerooConfigured();

  const providers = usePayGenius
    ? [
        {
          id: "paygenius",
          label: "GeniusPay",
          available: true,
          description: "Paiement Mobile Money / carte via GeniusPay",
        },
      ]
    : useMoneroo
      ? [
          {
            id: "moneroo",
            label: "Moneroo",
            available: true,
            description: "Paiement Mobile Money / carte",
          },
        ]
      : isPayGeniusConfigured()
        ? [
            {
              id: "paygenius",
              label: "GeniusPay",
              available: true,
              description: "Paiement Mobile Money / carte via GeniusPay",
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
