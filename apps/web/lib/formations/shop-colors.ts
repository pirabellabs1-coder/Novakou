import { prisma } from "@/lib/prisma";

/**
 * Palette de couleurs de boutique. La 1re (vert Novakou) est le défaut « naturel »
 * de la boutique primaire ; les suivantes distinguent les boutiques d'un vendeur.
 */
export const SHOP_PALETTE = [
  "#006e2f", "#2563eb", "#db2777", "#f97316",
  "#7c3aed", "#0891b2", "#ca8a04", "#dc2626",
];

/** Première couleur de la palette non présente dans `used`. */
export function firstFreeShopColor(used: Set<string>, fallbackIndex = 0): string {
  const lower = new Set([...used].map((c) => c.toLowerCase()));
  return SHOP_PALETTE.find((c) => !lower.has(c.toLowerCase())) ?? SHOP_PALETTE[fallbackIndex % SHOP_PALETTE.length];
}

/**
 * Auto-répare les couleurs des boutiques d'un vendeur : deux boutiques ne doivent
 * jamais avoir la même couleur. Idempotent — appelé au chargement des boutiques
 * (comme ensurePrimaryShop). Une couleur déjà UNIQUE est conservée ; une couleur
 * nulle ou en DOUBLON reçoit la première couleur libre de la palette.
 *
 * Rétro-actif : recolore les boutiques existantes (créées avant l'attribution
 * automatique à la création), pour que les boutiques d'un même vendeur se
 * distinguent enfin. Après un passage, aucune collision ne subsiste → plus
 * d'écriture aux chargements suivants.
 */
export async function ensureDistinctShopColors(instructeurId: string): Promise<void> {
  const shops = await prisma.vendorShop.findMany({
    where: { instructeurId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { id: true, themeColor: true },
  });
  if (shops.length <= 1) return;

  const used = new Set<string>();
  const updates: { id: string; color: string }[] = [];
  for (const s of shops) {
    const cur = (s.themeColor?.trim() || "").toLowerCase();
    if (cur && !used.has(cur)) {
      used.add(cur); // couleur unique → conservée
      continue;
    }
    const next = firstFreeShopColor(used, updates.length);
    used.add(next.toLowerCase());
    updates.push({ id: s.id, color: next });
  }

  if (updates.length > 0) {
    await Promise.all(
      updates.map((u) =>
        prisma.vendorShop.update({ where: { id: u.id }, data: { themeColor: u.color } }).catch(() => null),
      ),
    );
  }
}
