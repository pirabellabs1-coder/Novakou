/**
 * Helpers équipe / collaborateurs boutique.
 *
 * Règle d'accès :
 *   - OWNER  : tout permis (retraits, invite/remove team, archive, supprimer shop)
 *   - MANAGER : invite/remove EDITOR, CRUD produits, voir stats. PAS de retrait.
 *   - EDITOR  : CRUD produits seulement, voir stats. PAS d'invite, PAS de retrait.
 *
 * Le OWNER est l'instructeur original qui a créé la boutique.
 * Il a un ShopMember auto-créé (lazy) avec role=OWNER dès qu'on lui demande son rôle.
 */

import { prisma } from "@/lib/prisma";
import type { ShopMemberRole } from "@prisma/client";

export type Role = ShopMemberRole;

/**
 * Résout le rôle d'un user dans une boutique.
 * - Si userId === shop.instructeur.userId → OWNER (auto-upsert le ShopMember)
 * - Sinon on cherche dans ShopMember
 * - Si non membre → null
 */
export async function getShopRole(shopId: string, userId: string): Promise<Role | null> {
  const shop = await prisma.vendorShop.findUnique({
    where: { id: shopId },
    select: { id: true, instructeur: { select: { userId: true } } },
  });
  if (!shop) return null;

  // OWNER implicite : propriétaire original
  if (shop.instructeur.userId === userId) {
    // Lazy upsert pour que l'OWNER apparaisse dans les listes "mes boutiques membres"
    await prisma.shopMember
      .upsert({
        where: { shopId_userId: { shopId, userId } },
        create: { shopId, userId, role: "OWNER" },
        update: { role: "OWNER" },
      })
      .catch(() => null);
    return "OWNER";
  }

  // Membre invité
  const m = await prisma.shopMember.findUnique({
    where: { shopId_userId: { shopId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

/** Retourne true si le user peut faire des retraits depuis cette boutique (OWNER only). */
export async function canWithdraw(shopId: string, userId: string): Promise<boolean> {
  const role = await getShopRole(shopId, userId);
  return role === "OWNER";
}

/** Retourne true si le user peut inviter / retirer des membres (OWNER + MANAGER). */
export async function canManageTeam(shopId: string, userId: string): Promise<boolean> {
  const role = await getShopRole(shopId, userId);
  return role === "OWNER" || role === "MANAGER";
}

/** Retourne true si le user peut éditer les produits (tous rôles de membres). */
export async function canEditProducts(shopId: string, userId: string): Promise<boolean> {
  const role = await getShopRole(shopId, userId);
  return role !== null;
}
