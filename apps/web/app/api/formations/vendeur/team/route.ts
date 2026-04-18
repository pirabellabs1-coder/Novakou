/**
 * GET  /api/formations/vendeur/team         — liste les membres + invitations de la boutique active
 * POST /api/formations/vendeur/team         — invite un nouvel email (role EDITOR ou MANAGER)
 *
 * Règles :
 *   - Seuls OWNER et MANAGER peuvent inviter
 *   - Le OWNER est visible en tête avec role=OWNER (auto-upsert dans ShopMember)
 *   - Expiration invitation : 14 jours
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { canManageTeam, getShopRole } from "@/lib/formations/team";
import { sendShopInvitationEmail } from "@/lib/email/templates/team";
import crypto from "crypto";
import type { ShopMemberRole } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const shopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  if (!shopId) return NextResponse.json({ error: "Aucune boutique active" }, { status: 400 });

  const myRole = await getShopRole(shopId, ctx.userId);
  if (!myRole) return NextResponse.json({ error: "Pas membre de cette boutique" }, { status: 403 });

  const [members, invitations, shop] = await Promise.all([
    prisma.shopMember.findMany({
      where: { shopId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      include: { user: { select: { id: true, email: true, name: true, image: true } } },
    }),
    prisma.shopInvitation.findMany({
      where: { shopId, acceptedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendorShop.findUnique({ where: { id: shopId }, select: { id: true, name: true, slug: true } }),
  ]);

  return NextResponse.json({
    data: {
      shop,
      myRole,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        name: m.user.name,
        image: m.user.image,
        role: m.role,
        createdAt: m.createdAt,
      })),
      invitations: invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  if (!ctx) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const shopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  if (!shopId) return NextResponse.json({ error: "Aucune boutique active" }, { status: 400 });

  // Permission : OWNER ou MANAGER peuvent inviter
  const allowed = await canManageTeam(shopId, ctx.userId);
  if (!allowed) {
    return NextResponse.json({ error: "Seuls le propriétaire et les managers peuvent inviter" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { email?: string; role?: ShopMemberRole };
  const email = (body.email || "").trim().toLowerCase();
  const role = (body.role === "MANAGER" ? "MANAGER" : "EDITOR") as ShopMemberRole;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  // Seul un OWNER peut créer un MANAGER
  if (role === "MANAGER") {
    const myRole = await getShopRole(shopId, ctx.userId);
    if (myRole !== "OWNER") {
      return NextResponse.json({ error: "Seul le propriétaire peut créer un Manager" }, { status: 403 });
    }
  }

  // Déjà membre ?
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.shopMember.findUnique({
      where: { shopId_userId: { shopId, userId: existingUser.id } },
    });
    if (existingMember) {
      return NextResponse.json({ error: "Cette personne est déjà membre de la boutique" }, { status: 409 });
    }
  }

  // Déjà une invitation en attente ?
  const existingInvite = await prisma.shopInvitation.findFirst({
    where: { shopId, email, acceptedAt: null, expiresAt: { gte: new Date() } },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "Une invitation est déjà en attente pour cet email" }, { status: 409 });
  }

  const inviteCode = crypto.randomBytes(24).toString("base64url"); // 32 chars URL-safe
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 jours

  const invitation = await prisma.shopInvitation.create({
    data: {
      shopId,
      email,
      role,
      inviteCode,
      invitedBy: ctx.userId,
      expiresAt,
    },
    include: { shop: { select: { name: true } } },
  });

  // Email (best effort — ne bloque pas si échec)
  try {
    const inviter = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true, email: true },
    });
    await sendShopInvitationEmail(email, {
      shopName: invitation.shop.name,
      inviterName: inviter?.name ?? inviter?.email ?? "Un vendeur",
      role,
      inviteCode,
      expiresAt,
    });
  } catch (err) {
    console.error("[team invite email]", err);
  }

  return NextResponse.json({
    data: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    },
  }, { status: 201 });
}
