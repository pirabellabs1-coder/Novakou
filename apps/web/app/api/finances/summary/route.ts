// /api/finances/summary — DÉSACTIVÉ (legacy FreelanceHigh)
//
// Ce endpoint dépendait des modèles WalletAgency / WalletFreelance qui ont
// été supprimés lors du pivot vers Novakou (marketplace de formations).
// Aucun consommateur frontend ne l'appelle aujourd'hui — `financesApi` dans
// lib/api-client.ts est défini mais jamais importé.
//
// On répond 410 Gone pour matérialiser l'absence côté monitoring sans
// crasher le runtime avec une erreur Prisma "Unknown model".

import { NextResponse } from "next/server";

const PAYLOAD = {
  error: "Endpoint déprécié",
  message:
    "L'API /api/finances/summary fait partie de l'ancien wallet freelance/agence (FreelanceHigh). Utilisez /api/formations/apprenant/dashboard ou /api/formations/vendeur/dashboard selon le rôle.",
  replacedBy: ["/api/formations/apprenant/dashboard", "/api/formations/vendeur/dashboard"],
};

export async function GET() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}
