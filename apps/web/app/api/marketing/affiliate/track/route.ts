// GET  /api/marketing/affiliate/track — DÉPRÉCIÉ (ouvrait une redirection libre)
// POST /api/marketing/affiliate/track — DÉPRÉCIÉ (no-op silencieux sur de l'argent)
//
// Deux raisons de fermer cette route :
//
// 1. Le GET redirigeait vers `?dest=` sans aucun contrôle d'origine
//    (`NextResponse.redirect(new URL(dest, req.url))` accepte une URL absolue).
//    N'importe qui pouvait forger https://novakou.com/api/marketing/affiliate/
//    track?dest=https://site-pirate.example : le lien porte NOTRE domaine et
//    atterrit ailleurs — hameçonnage prêt à l'emploi. En production la route
//    n'écrivait par ailleurs RIEN en base (logique Prisma restée commentée) :
//    le clic n'était jamais attribué.
// 2. Le POST renvoyait `success: true, message: "Conversion enregistree"` sans
//    créer la moindre commission. Un appelant croyait l'affilié payé.
//
// Les vrais chemins, eux, fonctionnent :
//   - clic affilié   → POST /api/marketing/affiliate/click (écrit AffiliateClick
//     + pose les cookies d'attribution) ; vitrine publique /a/[code].
//   - commission     → créée par le fulfillment (lib/formations/fulfillment.ts)
//     après paiement confirmé, via lib/marketing/affiliate-tracker.

import { NextResponse } from "next/server";

const PAYLOAD = {
  error: "Endpoint déprécié",
  message:
    "Le clic affilié passe par POST /api/marketing/affiliate/click ; la commission est créée par le fulfillment après paiement confirmé.",
  replacedBy: ["/api/marketing/affiliate/click", "/a/[code]"],
};

export async function GET() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}

export async function POST() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}
