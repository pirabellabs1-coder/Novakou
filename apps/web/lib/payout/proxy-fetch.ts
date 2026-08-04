// fetch dédié aux appels de VERSEMENT (payout) sortants vers FeexPay / FedaPay.
//
// Problème : Vercel a des IP de sortie DYNAMIQUES, alors que FeexPay et FedaPay
// n'autorisent que des IP FIXES whitelistées → « IP not allowed / non autorisée ».
// Solution : faire sortir ces appels par un PROXY à IP fixe (que l'on whitelist
// chez les fournisseurs), via la variable d'env PAYOUT_PROXY_URL.
//
//   PAYOUT_PROXY_URL="http://user:pass@proxy-host:port"
//
// Inerte tant que la variable n'est pas posée : on retombe sur un fetch normal
// (IP dynamique Vercel). la passerelle n'utilise PAS ce helper (pas de filtre IP) —
// ainsi le fournisseur principal ne dépend jamais du proxy.

import { ProxyAgent } from "undici";

let cachedAgent: ProxyAgent | null = null;
let cachedUrl: string | null = null;

/** Vrai si un proxy de versement à IP fixe est configuré. */
export function isPayoutProxyConfigured(): boolean {
  return Boolean(process.env.PAYOUT_PROXY_URL && process.env.PAYOUT_PROXY_URL.trim());
}

/**
 * Construit le ProxyAgent. Les proxys authentifiés (ex. Fixie :
 * `http://fixie:MOTDEPASSE@host:port`) exigent un en-tête Proxy-Authorization.
 * Selon les versions d'undici, les identifiants présents dans l'URI ne sont pas
 * toujours convertis en header → on fournit le `token` Basic explicitement.
 */
function buildAgent(proxyUrl: string): ProxyAgent {
  const u = new URL(proxyUrl);
  const username = decodeURIComponent(u.username);
  const password = decodeURIComponent(u.password);
  if (username || password) {
    const token = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    return new ProxyAgent({ uri: `${u.protocol}//${u.host}`, token });
  }
  return new ProxyAgent(proxyUrl);
}

/**
 * fetch qui sort par le proxy à IP fixe si PAYOUT_PROXY_URL est défini,
 * sinon fetch standard. À utiliser pour TOUS les appels FeexPay / FedaPay.
 */
/**
 * Codes d'erreur signifiant que la CONNEXION n'a jamais abouti : DNS, refus,
 * délai de connexion, proxy injoignable. La requête n'a donc jamais quitté
 * notre serveur.
 *
 * La distinction est vitale pour l'argent : sur un versement, une erreur
 * ambiguë (délai d'attente APRÈS envoi, coupure en cours) interdit d'essayer
 * une autre passerelle — le premier versement est peut-être parti, et
 * recommencer paierait deux fois. Une connexion jamais établie, elle, ne peut
 * rien avoir déclenché : basculer est alors sans danger.
 */
const CODES_JAMAIS_ENVOYE = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_PROXY",
]);

/** Erreur de versement dont on sait qu'AUCUNE requête n'a atteint le fournisseur. */
export class PayoutNeverSentError extends Error {
  readonly code: string;
  constructor(code: string, cause: unknown) {
    super(`Connexion impossible (${code}) — la requête n'a jamais atteint le fournisseur`);
    this.name = "PayoutNeverSentError";
    this.code = code;
    this.cause = cause;
  }
}

/** Extrait le code système d'une erreur undici, quel que soit son emballage. */
function codeErreur(err: unknown): string | null {
  let e: unknown = err;
  for (let i = 0; i < 4 && e && typeof e === "object"; i++) {
    const c = (e as { code?: unknown }).code;
    if (typeof c === "string") return c;
    e = (e as { cause?: unknown }).cause;
  }
  return null;
}

export async function payoutFetch(url: string, init?: RequestInit): Promise<Response> {
  const proxyUrl = process.env.PAYOUT_PROXY_URL?.trim();

  try {
    if (!proxyUrl) return await fetch(url, init);

    if (!cachedAgent || cachedUrl !== proxyUrl) {
      cachedAgent = buildAgent(proxyUrl);
      cachedUrl = proxyUrl;
    }
    // La fetch globale (undici) lit `dispatcher` ; le type standard RequestInit ne
    // l'expose pas → on l'ajoute puis on caste au moment de l'appel.
    const withDispatcher = { ...init, dispatcher: cachedAgent };
    return await fetch(url, withDispatcher as RequestInit);
  } catch (err) {
    const code = codeErreur(err);
    if (code && CODES_JAMAIS_ENVOYE.has(code)) {
      throw new PayoutNeverSentError(code, err);
    }
    // Toute autre erreur reste AMBIGUË : on la laisse remonter telle quelle,
    // et l'orchestrateur refusera de basculer. Mieux vaut un retrait en
    // attente qu'un versement payé deux fois.
    throw err;
  }
}
