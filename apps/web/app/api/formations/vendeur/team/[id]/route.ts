/**
 * PATCH  /api/formations/vendeur/team/[id]   — change le rôle d'un membre (OWNER only)
 * DELETE /api/formations/vendeur/team/[id]   — retire un membre OU annule une invitation
 *
 * On accepte l'id d'un ShopMember OU d'une ShopInvitation (on détecte par lookup).
 * Le OWNER ne peut PAS se retirer lui-même (il doit transférer l'ownership d'abord).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { canManageTeam, getShopRole } from "@/lib/formations/team";
import type { ShopMemberRole } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

async function authorize() {
  const session = await getServerSession(authOptions);
  const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  if (!ctx) return { error: "Non autorisé", status: 401 as const };

  const shopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  if (!shopId) return { error: "Aucune boutique active", status: 400 as const };

  if (!(await canManageTeam(shopId, ctx.userId))) {
    return { error: "Seuls le propriétaire et les managers peuvent gérer l'équipe", status: 403 as const };
  }
  return { ctx, shopId };
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const auth = await authorize();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { ctx, shopId } = auth;

  const body = (await req.json().catch(() => ({}))) as { role?: ShopMemberRole };
  const newRole = body.role;
  if (!newRole || !["OWNER", "MANAGER", "EDITOR"].includes(newRole)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const myRole = await getShopRole(shopId, ctx.userId);
  if (myRole !== "OWNER") {
    return NextResponse.json({ error: "Seul le propriétaire peut changer les rôles" }, { status: 403 });
  }

  // Transfert d'ownership interdit pour l'instant (nécessite flux dédié)
  if (newRole === "OWNER") {
    return NextResponse.json({ error: "Transfert de propriété non supporté" }, { status: 400 });
  }

  const member = await prisma.shopMember.findFirst({ where: { id, shopId } });
  if (!member) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  if (member.role === "OWNER") {
    return NextResponse.json({ error: "Impossible de rétrograder le propriétaire" }, { status: 400 });
  }

  const updated = await prisma.shopMember.update({
    where: { id },
    data: { role: newRole },
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const auth = await authorize();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { ctx, shopId } = auth;

  // Est-ce un membre ou une invitation ?
  const member = await prisma.shopMember.findFirst({ where: { id, shopId } });
  if (member) {
    if (member.role === "OWNER") {
      return NextResponse.json({ error: "Le propriétaire ne peut pas être retiré" }, { status: 400 });
    }
    // Un MANAGER ne peut pas retirer un autre MANAGER
    const myRole = await getShopRole(shopId, ctx.userId);
    if (myRole === "MANAGER" && member.role === "MANAGER") {
      return NextResponse.json({ error: "Un manager ne peut pas retirer un autre manager" }, { status: 403 });
    }
    await prisma.shopMember.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: "member" } });
  }

  const invitation = await prisma.shopInvitation.findFirst({ where: { id, shopId } });
  if (invitation) {
    await prisma.shopInvitation.delete({ where: { id } });
    return NextResponse.json({ data: { deleted: "invitation" } });
  }

  return NextResponse.json({ error: "Introuvable" }, { status: 404 });
}
