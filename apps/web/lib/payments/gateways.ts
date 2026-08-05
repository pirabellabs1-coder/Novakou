import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptCredentials, encryptCredentials, maskSecret } from "@/lib/crypto/secret-box";
import {
  OPERATORS,
  PROVIDERS,
  getOperator,
  listOperators,
  routeFor,
  type PaymentDirection,
  type ProviderId,
} from "@/lib/payments/registry";

// Couche de service des PASSERELLES : fait le lien entre ce que le registre
// sait faire (théorie) et ce que l'admin a réellement branché (pratique).
//
// Un moyen de paiement n'est proposé à l'acheteur que si LES DEUX sont vrais :
//   1. le registre connaît une route pour cet opérateur chez un fournisseur ;
//   2. ce fournisseur est activé, autorisé à encaisser, et configuré.
// Sans cette double condition, on afficherait des moyens qui échoueraient au
// moment de payer — exactement le défaut qu'on vient de corriger avec PayPal.

/** Champs d'identifiants attendus par fournisseur (pour le formulaire admin). */
export const CREDENTIAL_FIELDS: Record<ProviderId, Array<{ key: string; label: string; secret: boolean }>> = {
  feexpay: [
    { key: "apiKey", label: "Clé API", secret: true },
    { key: "shopId", label: "Identifiant boutique", secret: false },
  ],
  fedapay: [{ key: "secretKey", label: "Clé secrète", secret: true }],
  // Sans cette entrée, l'écran admin n'affiche AUCUN champ pour Monetbil :
  // la passerelle serait déclarée mais impossible à configurer autrement
  // qu'en variable d'environnement.
  monetbil: [{ key: "serviceKey", label: "Clé de service", secret: true }],
  kkiapay: [
    { key: "publicKey", label: "Clé publique", secret: false },
    { key: "privateKey", label: "Clé privée", secret: true },
    { key: "secret", label: "Secret", secret: true },
  ],
  ipaymoney: [
    { key: "secretKey", label: "Clé secrète", secret: true },
    // Chaîne partagée que le fournisseur renvoie dans l'en-tête `secret-hash`
    // de chaque webhook : c'est elle qui prouve que l'appel vient bien de lui.
    { key: "webhookSecret", label: "Secret du webhook", secret: true },
  ],
};

export type GatewayRow = {
  id: string;
  provider: ProviderId;
  label: string;
  isActive: boolean;
  canCollect: boolean;
  canPayout: boolean;
  isSandbox: boolean;
  priority: number;
  /** Identifiants masqués — on ne renvoie JAMAIS les valeurs en clair. */
  credentialsMasked: Record<string, string>;
  configured: boolean;
  lastTestAt: Date | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;
};

/**
 * Identifiants hérités des variables d'environnement.
 *
 * Les passerelles se configurent côté admin, avec repli sur les variables
 * d'environnement. Sans ce repli, la page admin les afficherait « non
 * configurées » alors qu'elles encaissent réellement — l'écran mentirait sur
 * l'état du système.
 * Les identifiants saisis en base restent PRIORITAIRES : dès que l'admin en
 * enregistre, ce sont eux qui priment.
 */
function envCredentials(provider: ProviderId): Record<string, string> {
  const pick = (v: string | undefined) => (v?.trim() ? v.trim() : undefined);
  const map: Record<string, Record<string, string | undefined>> = {
    feexpay: {
      apiKey: pick(process.env.FEEXPAY_API_KEY),
      shopId: pick(process.env.FEEXPAY_SHOP_ID),
    },
    fedapay: { secretKey: pick(process.env.FEDAPAY_SECRET_KEY) },
    kkiapay: {
      publicKey: pick(process.env.KKIAPAY_PUBLIC_KEY),
      privateKey: pick(process.env.KKIAPAY_PRIVATE_KEY),
      secret: pick(process.env.KKIAPAY_SECRET),
    },
    ipaymoney: {
      secretKey: pick(process.env.IPAYMONEY_SECRET_KEY),
      webhookSecret: pick(process.env.IPAYMONEY_WEBHOOK_SECRET),
    },
  };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map[provider] ?? {})) if (v) out[k] = v;
  return out;
}

/** Identifiants effectifs : base d'abord, variables d'environnement en repli. */
function effectiveCredentials(provider: ProviderId, dbCreds: Record<string, string>): Record<string, string> {
  return { ...envCredentials(provider), ...dbCreds };
}

/** Une passerelle est « configurée » quand tous ses champs requis sont remplis. */
function isConfigured(provider: ProviderId, creds: Record<string, string>): boolean {
  const fields = CREDENTIAL_FIELDS[provider] ?? [];
  if (fields.length === 0) return false;
  const eff = effectiveCredentials(provider, creds);
  return fields.every((f) => Boolean(eff[f.key]?.trim()));
}

/**
 * Liste des passerelles pour l'ADMIN : identifiants masqués, jamais en clair.
 * Les fournisseurs connus du registre mais pas encore créés en base
 * apparaissent tout de même, en « non configuré », pour être branchables.
 */
export async function listGatewaysForAdmin(): Promise<GatewayRow[]> {
  const rows = await prisma.paymentGateway.findMany({ orderBy: { priority: "asc" } });
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  return PROVIDERS.map((meta) => {
    const row = byProvider.get(meta.id);
    let creds: Record<string, string> = {};
    let readable = true;
    if (row?.credentials) {
      try {
        creds = decryptCredentials(row.credentials);
      } catch {
        // Clé de chiffrement absente ou secret altéré : on ne fait pas semblant.
        readable = false;
      }
    }
    const eff = effectiveCredentials(meta.id, creds);
    const masked: Record<string, string> = {};
    for (const f of CREDENTIAL_FIELDS[meta.id] ?? []) {
      const v = eff[f.key];
      masked[f.key] = v ? (f.secret ? maskSecret(v) : v) : "";
    }
    return {
      id: row?.id ?? "",
      provider: meta.id,
      label: row?.label ?? meta.label,
      isActive: row?.isActive ?? false,
      canCollect: row?.canCollect ?? false,
      canPayout: row?.canPayout ?? false,
      isSandbox: row?.isSandbox ?? false,
      priority: row?.priority ?? 100,
      credentialsMasked: masked,
      configured: readable && isConfigured(meta.id, creds),
      lastTestAt: row?.lastTestAt ?? null,
      lastTestOk: row?.lastTestOk ?? null,
      lastTestMessage: readable
        ? row?.lastTestMessage ?? null
        : "Identifiants illisibles — PAYMENT_CREDENTIALS_KEY absente ou modifiée.",
    };
  });
}

/** Crée ou met à jour une passerelle. Les identifiants sont chiffrés avant écriture. */
export async function upsertGateway(input: {
  provider: ProviderId;
  label?: string;
  credentials?: Record<string, string>;
  isActive?: boolean;
  canCollect?: boolean;
  canPayout?: boolean;
  isSandbox?: boolean;
  priority?: number;
}): Promise<void> {
  const meta = PROVIDERS.find((p) => p.id === input.provider);
  if (!meta) throw new Error(`Fournisseur inconnu : ${input.provider}`);

  const existing = await prisma.paymentGateway.findUnique({ where: { provider: input.provider } });

  // Fusion : un champ laissé vide par l'admin conserve sa valeur actuelle
  // (sinon rouvrir le formulaire et enregistrer effacerait les clés).
  let credsPayload: string | undefined;
  if (input.credentials) {
    let current: Record<string, string> = {};
    if (existing?.credentials) {
      try { current = decryptCredentials(existing.credentials); } catch { current = {}; }
    }
    const merged = { ...current };
    for (const [k, v] of Object.entries(input.credentials)) {
      if (typeof v === "string" && v.trim()) merged[k] = v.trim();
    }
    credsPayload = encryptCredentials(merged);
  }

  const data = {
    label: input.label ?? existing?.label ?? meta.label,
    ...(credsPayload !== undefined ? { credentials: credsPayload } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(input.canCollect !== undefined ? { canCollect: input.canCollect } : {}),
    ...(input.canPayout !== undefined ? { canPayout: input.canPayout } : {}),
    ...(input.isSandbox !== undefined ? { isSandbox: input.isSandbox } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
  };

  await prisma.paymentGateway.upsert({
    where: { provider: input.provider },
    create: { provider: input.provider, ...data },
    update: data,
  });

  // Sans ça, l'admin sauvegarde et le paiement continue d'utiliser les
  // anciennes clés pendant la durée du cache — impossible à comprendre.
  const { invalidateCredentialsCache } = await import("@/lib/payments/credentials");
  invalidateCredentialsCache(input.provider);
}

/**
 * Identifiants EN CLAIR d'une passerelle — usage serveur uniquement.
 * Base d'abord, variables d'environnement en repli. Null si rien n'est
 * configuré nulle part.
 */
export async function getGatewayCredentials(provider: ProviderId): Promise<Record<string, string> | null> {
  const row = await prisma.paymentGateway.findUnique({ where: { provider } });
  let dbCreds: Record<string, string> = {};
  if (row?.credentials) {
    try { dbCreds = decryptCredentials(row.credentials); } catch { dbCreds = {}; }
  }
  const eff = effectiveCredentials(provider, dbCreds);
  return Object.keys(eff).length > 0 ? eff : null;
}

/** Fournisseurs actifs, configurés et autorisés dans cette direction, par priorité. */
export async function activeProviders(direction: PaymentDirection): Promise<ProviderId[]> {
  const rows = await prisma.paymentGateway.findMany({
    where: { isActive: true, ...(direction === "collect" ? { canCollect: true } : { canPayout: true }) },
    orderBy: { priority: "asc" },
  });
  const out: ProviderId[] = [];
  for (const r of rows) {
    let creds: Record<string, string> = {};
    // Identifiants illisibles en base : on n'abandonne pas la passerelle pour
    // autant — isConfigured retombera sur les variables d'environnement.
    try { creds = decryptCredentials(r.credentials); } catch { creds = {}; }
    if (isConfigured(r.provider, creds)) out.push(r.provider);
  }
  return out;
}

export type PaymentOption = {
  /** Code opérateur interne (clé du registre). */
  code: string;
  label: string;
  family: "mobile_money" | "card";
  currency: "XOF" | "XAF";
  country: string;
  /** Fournisseur qui traitera ce moyen (le plus prioritaire disponible). */
  provider: ProviderId;
  /** La carte passe par une page hébergée (jamais de saisie chez nous : PCI-DSS). */
  hosted: boolean;
};

/**
 * ÉCRAN UNIQUE : tous les moyens réellement encaissables pour un pays donné,
 * toutes passerelles confondues, dédupliqués et prêts à afficher.
 *
 * Un même opérateur peut être servi par plusieurs passerelles : on retient la
 * plus prioritaire, et les autres restent disponibles en repli côté serveur.
 */
export async function paymentOptionsForCountry(
  countryIso2: string,
  direction: PaymentDirection = "collect",
): Promise<PaymentOption[]> {
  return optionsFor(
    (countryIso2 || "").trim().toLowerCase(),
    await activeProviders(direction),
    direction,
  );
}

/**
 * Calcul pur, à providers déjà connus. Extrait pour que la liste des pays et
 * les moyens d'un pays partagent EXACTEMENT la même logique : quand les deux
 * étaient calculés séparément, un pays payable uniquement par carte
 * n'apparaissait jamais dans la liste — le Mali était invendable en silence
 * alors que la carte y fonctionnait.
 */
function optionsFor(
  country: string,
  providers: ProviderId[],
  direction: PaymentDirection = "collect",
): PaymentOption[] {
  if (providers.length === 0) return [];

  // Devises réellement pertinentes pour ce pays (d'après le registre).
  const currencies = new Set(
    Object.values(OPERATORS).filter((o) => o.country === country).map((o) => o.currency),
  );
  if (currencies.size === 0) return [];

  const options: PaymentOption[] = [];
  for (const currency of currencies) {
    const candidates = listOperators({ direction, currency });
    for (const op of candidates) {
      // Mobile money : réservé au pays ; carte : proposée dans la devise du pays.
      if (op.family === "mobile_money" && op.country !== country) continue;
      // On ne VERSE jamais sur une carte : un retrait part sur un compte
      // Mobile Money, jamais vers un numéro de carte bancaire.
      if (direction === "payout" && op.family === "card") continue;

      const provider = providers.find((p) => routeFor(op.code, p, direction));
      if (!provider) continue; // aucune passerelle branchée ne sait le traiter

      options.push({
        code: op.code,
        label: op.label,
        family: op.family,
        currency: op.currency,
        country: op.country,
        provider,
        hosted: op.family === "card",
      });
    }
  }
  // Mobile money d'abord (le plus utilisé), carte ensuite.
  return options.sort((a, b) => (a.family === b.family ? 0 : a.family === "mobile_money" ? -1 : 1));
}

/** Pays proposables à l'acheteur : ceux qui ont au moins un moyen encaissable. */
export async function availableCountries(
  direction: PaymentDirection = "collect",
): Promise<Array<{ code: string; operators: number }>> {
  const providers = await activeProviders(direction);
  if (providers.length === 0) return [];

  // Un pays est proposable dès qu'il a AU MOINS un moyen encaissable — la
  // carte comprise. On interroge le même calcul que l'écran de paiement pour
  // qu'aucun pays ne soit listé sans moyen, ni écarté alors qu'il en a un.
  const countries = new Set(
    Object.values(OPERATORS).map((o) => o.country).filter((c): c is string => Boolean(c)),
  );

  return [...countries]
    .map((code) => ({ code, operators: optionsFor(code, providers, direction).length }))
    .filter((c) => c.operators > 0)
    .sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Passerelle qui doit traiter l'ENCAISSEMENT de cet opérateur : la plus
 * prioritaire parmi celles qui sont activées, configurées, autorisées à
 * encaisser ET qui savent router cet opérateur.
 *
 * Renvoie null si personne ne peut → l'appelant retombe alors sur le chemin
 * historique plutôt que de faire échouer la vente. Aucun encaissement ne doit
 * être perdu à cause d'une passerelle mal configurée.
 */
export async function resolveCollectProvider(
  operator: string,
): Promise<{ provider: ProviderId; code: string } | null> {
  return (await resolveCollectProviders(operator))[0] ?? null;
}

/**
 * TOUTES les passerelles capables d'encaisser cet opérateur, par priorité.
 *
 * Renvoyer la liste et non la seule première permet à l'initialisation de
 * BASCULER quand une passerelle échoue. Ce n'est pas théorique : le 2026-08-02,
 * l'API d'encaissement de FeexPay a répondu 502 sur toutes ses routes pendant
 * plusieurs heures. Sans bascule, toutes les ventes du Bénin, de Côte d'Ivoire,
 * du Togo et du Sénégal tombaient — alors qu'une autre passerelle active savait
 * les traiter.
 */
export async function resolveCollectProviders(
  operator: string,
): Promise<Array<{ provider: ProviderId; code: string }>> {
  if (!operator) return [];
  const out: Array<{ provider: ProviderId; code: string; hosted: boolean }> = [];
  for (const provider of await activeProviders("collect")) {
    const route = routeFor(operator, provider, "collect");
    if (route) out.push({ provider, code: route.code, hosted: Boolean(route.params?.hosted) });
  }

  // ON GARDE L'ACHETEUR CHEZ NOUS, par ordre de préférence :
  //   0. débit depuis notre serveur — l'acheteur ne quitte jamais la page,
  //      il confirme sur son téléphone ;
  //   1. fenêtre du fournisseur posée SUR notre page — il reste sur le site ;
  //   2. page hébergée du fournisseur — il change de site, de design, et une
  //      part n'en revient jamais. Dernier recours uniquement.
  //
  // SAUF POUR LA CARTE : là, l'ordre s'inverse. Une carte ne se confirme pas
  // sur un téléphone — elle EXIGE une page sécurisée, et nous n'avons pas le
  // droit de collecter un numéro de carte sur nos pages (PCI-DSS). Classer la
  // page hébergée en dernier faisait tenter d'abord des passerelles qui ne
  // rendaient aucune page : l'acheteur atterrissait sur « Confirmez sur votre
  // téléphone » et regardait tourner indéfiniment.
  const estCarte = getOperator(operator)?.family === "card";

  /**
   * Ordre d'essai POUR LA CARTE, décidé par constat et non par principe.
   *
   * FedaPay était en tête — c'est elle qui héberge la page. Mais sur notre
   * compte marchand, sa page de paiement n'affiche QUE du Mobile Money :
   * la carte n'y est pas activée, et l'acheteur arrivait donc sur un écran
   * sans le moyen qu'il venait de choisir.
   *
   * iPay Money passe donc devant en attendant que FedaPay ouvre la carte sur
   * le compte. Remettre "fedapay" en tête suffira le jour où ce sera fait.
   */
  const PREFERENCE_CARTE: ProviderId[] = ["ipaymoney", "kkiapay", "fedapay"];

  const rang = (r: { provider: ProviderId; hosted: boolean }) => {
    if (estCarte) {
      const i = PREFERENCE_CARTE.indexOf(r.provider);
      return i === -1 ? PREFERENCE_CARTE.length : i;
    }
    // Mobile Money : on garde l'acheteur chez nous — débit direct, puis
    // fenêtre sur notre page, et la page hébergée seulement en dernier.
    if (r.hosted) return 2;
    return PROVIDERS.find((p) => p.id === r.provider)?.collectIntegration === "widget" ? 1 : 0;
  };
  return out
    .sort((a, b) => rang(a) - rang(b))
    .map(({ provider, code }) => ({ provider, code }));
}
