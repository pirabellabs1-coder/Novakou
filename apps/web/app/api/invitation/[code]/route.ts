/**
 * GET  /api/invitation/[code]        — récupère les détails d'une invitation (pour affichage sur /invitation/[code])
 * POST /api/invitation/[code]        — accepte l'invitation (user connecté requis)
 *
 * Le flux :
 *   1. L'invité clique sur le lien email → /invitation/[code]
 *   2. Si pas connecté → redirect vers /inscription?next=/invitation/[code]
 *   3. Si connecté avec un email différent de l'invitation → warning ("accepter avec le bon email ?")
 *   4. Si tout OK → POST accept → ShopMember créé → redirect vers /vendeur
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { code } = await params;
  const invitation = await prisma.shopInvitation.findUnique({
    where: { inviteCode: code },
    include: {
      shop: { select: { id: true, name: true, slug: true, logoUrl: true } },
      inviter: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable ou expirée" }, { status: 404 });
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "Cette invitation a déjà été acceptée" }, { status: 410 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Cette invitation a expiré" }, { status: 410 });
  }

  return NextResponse.json({
    data: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      shop: invitation.shop,
      inviterName: invitation.inviter?.name ?? invitation.inviter?.email ?? "Un vendeur",
      expiresAt: invitation.expiresAt,
    },
  });
}

export async function POST(_req: Request, { params }: Params) {
  const { code } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour accepter l'invitation" },
      { status: 401 }
    );
  }

  const invitation = await prisma.shopInvitation.findUnique({
    where: { inviteCode: code },
    include: { shop: { select: { id: true, name: true, slug: true } } },
  });
  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "Invitation déjà acceptée" }, { status: 410 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  // Vérif email : l'invitation est pour un email spécifique.
  // Si le user connecté a un email différent, on refuse (sécurité).
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `Cette invitation a été envoyée à ${invitation.email}. Connectez-vous avec ce compte ou demandez une nouvelle invitation.`,
        expectedEmail: invitation.email,
      },
      { status: 403 }
    );
  }

  // Déjà membre ? (rare edge case)
  const existing = await prisma.shopMember.findUnique({
    where: { shopId_userId: { shopId: invitation.shopId, userId: user.id } },
  });
  if (existing) {
    await prisma.shopInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return NextResponse.json({
      data: { shop: invitation.shop, role: existing.role, alreadyMember: true },
    });
  }

  // Création du ShopMember + marquage de l'invitation
  const member = await prisma.$transaction(async (tx) => {
    const m = await tx.shopMember.create({
      data: {
        shopId: invitation.shopId,
        userId: user.id,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      },
    });
    await tx.shopInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return m;
  });

  return NextResponse.json({
    data: {
      shop: invitation.shop,
      role: member.role,
      redirectUrl: "/vendeur/choisir-boutique",
    },
  });
}
