// POST /api/marketing/affiliate/join — DÉPRÉCIÉ
//
// En production cette route renvoyait `{ success: true, profile: null }` SANS
// rien écrire (la logique Prisma était restée en commentaire) : l'utilisateur
// lisait « Vous avez rejoint le programme d'affiliation avec succès » alors
// qu'aucun AffiliateProfile n'existait, donc aucun code, aucun lien, aucune
// commission possible. Un no-op silencieux sur de l'argent.
//
// L'inscription réelle à un programme d'affiliation se fait par
// POST /api/formations/apprenant/affiliate (crée le profil + le code).

import { NextResponse } from "next/server";

const PAYLOAD = {
  error: "Endpoint déprécié",
  message: "L'inscription à un programme d'affiliation passe par /api/formations/apprenant/affiliate.",
  replacedBy: ["/api/formations/apprenant/affiliate"],
};

export async function POST() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}

export async function GET() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}
