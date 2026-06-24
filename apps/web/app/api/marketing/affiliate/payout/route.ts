// POST /api/marketing/affiliate/payout — DÉPRÉCIÉ
//
// Cet endpoint était un stub qui renvoyait `success: true` SANS rien faire en
// production (aucune écriture DB, aucun payout) → risque de no-op silencieux
// sur de l'argent s'il était branché à une UI. Le vrai retrait affilié passe
// par /api/formations/affilie/retraits (solde validé + marquage des
// commissions PAID). On renvoie 410 pour éviter toute utilisation accidentelle.

import { NextResponse } from "next/server";

const PAYLOAD = {
  error: "Endpoint déprécié",
  message: "Les retraits affiliés passent par /api/formations/affilie/retraits.",
  replacedBy: ["/api/formations/affilie/retraits"],
};

export async function POST() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}

export async function GET() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}
