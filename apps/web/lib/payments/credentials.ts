import type { ProviderId } from "@/lib/payments/registry";

/**
 * Identifiants effectifs d'une passerelle : ceux saisis dans l'admin d'abord,
 * les variables d'environnement en repli.
 *
 * POURQUOI CE MODULE EXISTE. L'admin `/admin/passerelles` chiffrait et stockait
 * les identifiants, les affichait masqués, et le bouton de test les utilisait —
 * mais les modules de paiement lisaient `process.env` en dur. Autrement dit :
 * brancher une passerelle depuis l'admin ne branchait rien du tout, et rien ne
 * le signalait. Le formulaire donnait le sentiment d'avoir agi.
 *
 * Tout passe désormais par ici. L'admin devient réellement la source, les
 * variables Vercel restent le repli (utile au build et aux environnements de
 * préproduction sans base).
 */

/** Champs attendus par fournisseur, alignés sur le formulaire d'admin. */
const ENV_KEYS: Record<ProviderId, Record<string, string>> = {
  feexpay: { apiKey: "FEEXPAY_API_KEY", shopId: "FEEXPAY_SHOP_ID" },
  fedapay: { secretKey: "FEDAPAY_SECRET_KEY" },
  kkiapay: {
    publicKey: "KKIAPAY_PUBLIC_KEY",
    privateKey: "KKIAPAY_PRIVATE_KEY",
    secret: "KKIAPAY_SECRET",
  },
  monetbil: { serviceKey: "MONETBIL_SERVICE_KEY" },
  ipaymoney: {
    secretKey: "IPAYMONEY_SECRET_KEY",
    webhookSecret: "IPAYMONEY_WEBHOOK_SECRET",
  },
};

type Entry = { creds: Record<string, string>; sandbox: boolean; at: number };

/**
 * Cache court. Une route de paiement peut lire les identifiants plusieurs fois
 * (init, statut, vérification) : sans cache, autant d'allers-retours en base
 * sur le chemin critique d'un paiement. 30 s suffit à absorber une requête
 * complète tout en propageant vite un changement fait dans l'admin.
 */
const CACHE_MS = 30_000;
const cache = new Map<ProviderId, Entry>();

function fromEnv(provider: ProviderId): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, envName] of Object.entries(ENV_KEYS[provider] ?? {})) {
    const v = process.env[envName]?.trim();
    if (v) out[field] = v;
  }
  return out;
}

async function load(provider: ProviderId): Promise<Entry> {
  const cached = cache.get(provider);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached;

  let dbCreds: Record<string, string> = {};
  let sandbox = false;
  try {
    const { prisma } = await import("@/lib/prisma");
    const row = await prisma.paymentGateway.findUnique({ where: { provider } });
    if (row) {
      sandbox = row.isSandbox === true;
      if (row.credentials) {
        const { decryptCredentials } = await import("@/lib/crypto/secret-box");
        dbCreds = decryptCredentials(row.credentials);
      }
    }
  } catch {
    // Base injoignable ou secret illisible : on ne bloque pas un paiement pour
    // autant, les variables d'environnement prennent le relais.
  }

  const entry: Entry = { creds: { ...fromEnv(provider), ...dbCreds }, sandbox, at: Date.now() };
  cache.set(provider, entry);
  return entry;
}

/** Identifiants effectifs (admin prioritaire, environnement en repli). */
export async function credentialsFor(provider: ProviderId): Promise<Record<string, string>> {
  return (await load(provider)).creds;
}

/** Un identifiant précis, ou null s'il manque. */
export async function credential(provider: ProviderId, field: string): Promise<string | null> {
  const v = (await credentialsFor(provider))[field];
  return v?.trim() ? v.trim() : null;
}

/** Vrai si TOUS les champs attendus par ce fournisseur sont renseignés. */
export async function hasCredentials(provider: ProviderId): Promise<boolean> {
  const creds = await credentialsFor(provider);
  const fields = Object.keys(ENV_KEYS[provider] ?? {});
  return fields.length > 0 && fields.every((f) => Boolean(creds[f]?.trim()));
}

/** Mode bac à sable coché dans l'admin pour ce fournisseur. */
export async function isSandbox(provider: ProviderId): Promise<boolean> {
  return (await load(provider)).sandbox;
}

/** À appeler après une écriture dans l'admin pour ne pas servir l'ancien cache. */
export function invalidateCredentialsCache(provider?: ProviderId) {
  if (provider) cache.delete(provider);
  else cache.clear();
}
