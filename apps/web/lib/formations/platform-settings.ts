/**
 * Lecture des paramètres plateforme configurables par l'admin
 * (table FormationsConfig, page /admin/configuration).
 *
 * Évite les « réglages morts » : ces valeurs sont RÉELLEMENT appliquées par le
 * backend (commission des ventes vendeur, seuil de retrait, limite tier
 * gratuit). Lecture mise en cache 60 s pour ne pas frapper la DB à chaque vente.
 *
 * IMPORTANT — commission : elle n'est appliquée qu'aux NOUVELLES ventes
 * vendeur (le taux + le net sont STOCKÉS par vente dans PlatformRevenue). Les
 * ventes passées conservent leur taux → changer la commission n'altère JAMAIS
 * rétroactivement les soldes. (Les sessions mentor restent au taux plateforme.)
 */
import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  commission_rate: 10, // pourcent
  min_payout_amount: 5000, // FCFA
  max_products_free_tier: 3,
} as const;

const CACHE_TTL_MS = 60_000;
let cache: { values: Record<string, string>; expiresAt: number } | null = null;

async function loadSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.values;
  try {
    const rows = await prisma.formationsConfig.findMany({
      where: { key: { in: Object.keys(DEFAULTS) } },
      select: { key: true, value: true },
    });
    const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    cache = { values, expiresAt: now + CACHE_TTL_MS };
    return values;
  } catch {
    return cache?.values ?? {};
  }
}

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Taux de commission plateforme en FRACTION (0.10 = 10%), borné à [0, 0.5]. */
export async function getCommissionRate(): Promise<number> {
  const v = await loadSettings();
  const pct = num(v.commission_rate, DEFAULTS.commission_rate);
  return Math.min(0.5, Math.max(0, pct / 100));
}

/** Part nette vendeur (1 - commission). */
export async function getVendorNetRate(): Promise<number> {
  return 1 - (await getCommissionRate());
}

/** Seuil minimum de retrait en FCFA. */
export async function getMinPayoutAmount(): Promise<number> {
  const v = await loadSettings();
  return num(v.min_payout_amount, DEFAULTS.min_payout_amount);
}

/** Nombre max de produits/formations pour un vendeur au plan gratuit. */
export async function getMaxProductsFreeTier(): Promise<number> {
  const v = await loadSettings();
  return Math.round(num(v.max_products_free_tier, DEFAULTS.max_products_free_tier));
}

/** À appeler après une mise à jour de la config admin pour rafraîchir le cache. */
export function invalidatePlatformSettingsCache(): void {
  cache = null;
}
