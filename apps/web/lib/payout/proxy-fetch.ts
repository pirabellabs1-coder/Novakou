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
// (IP dynamique Vercel). Moneroo n'utilise PAS ce helper (pas de filtre IP) —
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
export function payoutFetch(url: string, init?: RequestInit): Promise<Response> {
  const proxyUrl = process.env.PAYOUT_PROXY_URL?.trim();
  if (!proxyUrl) return fetch(url, init);

  if (!cachedAgent || cachedUrl !== proxyUrl) {
    cachedAgent = buildAgent(proxyUrl);
    cachedUrl = proxyUrl;
  }
  // La fetch globale (undici) lit `dispatcher` ; le type standard RequestInit ne
  // l'expose pas → on l'ajoute puis on caste au moment de l'appel.
  const withDispatcher = { ...init, dispatcher: cachedAgent };
  return fetch(url, withDispatcher as RequestInit);
}
