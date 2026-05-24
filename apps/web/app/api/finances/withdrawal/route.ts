// /api/finances/withdrawal — DÉSACTIVÉ (legacy FreelanceHigh)
//
// Modèles utilisés (WalletTransaction / WalletFreelance / WalletAgency) supprimés
// lors du pivot Novakou. Les retraits vendeurs passent désormais par
// /api/formations/vendeur/withdrawal (Moneroo / PayGenius / Wave / Orange Money).

import { NextResponse } from "next/server";

const PAYLOAD = {
  error: "Endpoint déprécié",
  message:
    "Les retraits vendeur passent par /api/formations/vendeur/withdrawal. Les retraits affiliés passent par /api/formations/affilie/retraits.",
  replacedBy: [
    "/api/formations/vendeur/withdrawal",
    "/api/formations/affilie/retraits",
  ],
};

export async function GET() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}

export async function POST() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}
