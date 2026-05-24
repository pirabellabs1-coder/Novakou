// /api/conversations/offer — DÉSACTIVÉ (legacy FreelanceHigh)
//
// Permettait à un freelance d'envoyer une "offre commerciale" via le chat
// (titre, montant, délai, révisions). Modèle Prisma `Offer` supprimé lors
// du pivot Novakou. Le seul consommateur (components/messaging/MessagingLayout.tsx)
// n'est plus monté dans aucune page.
//
// Si la fonctionnalité revient un jour, recréer le modèle Offer dans le schéma
// et restaurer cette route depuis l'historique git.

import { NextResponse } from "next/server";

const PAYLOAD = {
  error: "Endpoint déprécié",
  message:
    "La création d'offres commerciales via chat n'est pas active sur Novakou. Pour proposer un service, utilisez la création de produit /api/formations/vendeur/products/create.",
};

export async function POST() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json(PAYLOAD, { status: 410 });
}
