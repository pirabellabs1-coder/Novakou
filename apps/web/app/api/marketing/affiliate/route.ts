// GET/POST /api/marketing/affiliate — DÉPRÉCIÉ
//
// Cette route servait un programme d'affiliation FICTIF (affiliés « Aminata »,
// « Kofi »… codés en dur) dès que DEV_MODE était vrai, et en production :
//   - GET  renvoyait `{ programs: [] }` quoi qu'il arrive (requête Prisma restée
//     commentée) → le vendeur voyait « aucun programme » même s'il en avait un ;
//   - POST renvoyait `{ success: true, program: null }` sans rien enregistrer →
//     modifier la commission ou approuver un affilié ne faisait RIEN, en
//     silence, sur de l'argent.
//
// L'espace vendeur utilise /api/formations/vendeur/marketing/affiliation
// (lecture + création, filtrées sur l'instructeur connecté).

import { NextResponse } from "next/server";

const PAYLOAD = {
  error: "Endpoint déprécié",
  message: "Le programme d'affiliation vendeur passe par /api/formations/vendeur/marketing/affiliation.",
  replacedBy: [
    "/api/formations/vendeur/marketing/affiliation",
    "/api/formations/vendeur/marketing/affiliation/[id]",
  ],
};

export async function GET() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}

export async function POST() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}
