import { prisma } from "@/lib/prisma";

/**
 * Garantit qu'un vendeur (instructeur) a toujours AU MOINS une boutique principale.
 *
 * Cas d'usage :
 *  - User s'inscrit directement comme vendeur → boutique créée dans /api/auth/register
 *  - User existe déjà comme client → devient vendeur en accédant à /vendeur/*
 *    → resolveVendorContext crée l'InstructeurProfile mais PAS de boutique
 *    → ce helper crée la boutique au premier appel à /shops ou /shops/active
 *
 * Idempotent : si le vendeur a déjà >=1 boutique, ne fait rien.
 * Si la 1ère boutique existante n'est pas marquée isPrimary, la promeut.
 *
 * Retourne l'ID de la boutique primaire.
 */
export async function ensurePrimaryShop(params: {
  instructeurId: string;
  userId: string;
}): Promise<string | null> {
  const { instructeurId, userId } = params;

  // Combien de boutiques ce vendeur possède ?
  const existing = await prisma.vendorShop.findMany({
    where: { instructeurId },
    select: { id: true, isPrimary: true },
    orderBy: { createdAt: "asc" },
  });

  // Déjà une boutique avec isPrimary=true → rien à faire
  const primary = existing.find((s) => s.isPrimary);
  if (primary) return primary.id;

  // Au moins une boutique mais aucune n'est primaire → on promeut la plus ancienne
  if (existing.length > 0) {
    const oldest = existing[0];
    await prisma.vendorShop.update({
      where: { id: oldest.id },
      data: { isPrimary: true },
    });
    return oldest.id;
  }

  // ZÉRO boutique → on en crée une primaire avec le nom du user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const displayName =
    user?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "Ma boutique";

  const baseSlug = displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30) || "boutique";

  // Slug unique : on ajoute un suffixe aléatoire pour éviter les collisions
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const shop = await prisma.vendorShop.create({
      data: {
        instructeurId,
        name: displayName,
        slug,
        isPrimary: true,
      },
      select: { id: true },
    });
    return shop.id;
  } catch (err) {
    // Si race condition (2 requêtes concurrentes) → refetch
    console.warn("[ensurePrimaryShop] create failed, refetching:", err);
    const refetched = await prisma.vendorShop.findFirst({
      where: { instructeurId, isPrimary: true },
      select: { id: true },
    });
    return refetched?.id ?? null;
  }
}
