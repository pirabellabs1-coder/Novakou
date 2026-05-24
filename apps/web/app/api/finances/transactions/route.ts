// /api/finances/transactions — DÉSACTIVÉ (legacy FreelanceHigh)
//
// Historique transactions wallet (modèles supprimés). Sur Novakou, les
// transactions vendeurs sont consultables via /api/formations/vendeur/transactions
// et celles côté apprenant via /api/formations/apprenant/spending.

import { NextResponse } from "next/server";

const PAYLOAD = {
  error: "Endpoint déprécié",
  message:
    "Utilisez /api/formations/vendeur/transactions (vendeur) ou /api/formations/apprenant/spending (apprenant).",
  replacedBy: [
    "/api/formations/vendeur/transactions",
    "/api/formations/apprenant/spending",
  ],
};

export async function GET() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}
