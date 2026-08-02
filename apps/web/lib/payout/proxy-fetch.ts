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
 * fetch qui sort par le proxy à IP fixe si PAYOUT_PROXY_URL est défini,
 * sinon fetch standard. À utiliser pour TOUS les appels FeexPay / FedaPay.
 */
export function payoutFetch(url: string, init?: RequestInit): Promise<Response> {
  const proxyUrl = process.env.PAYOUT_PROXY_URL?.trim();
  if (!proxyUrl) return fetch(url, init);

  if (!cachedAgent || cachedUrl !== proxyUrl) {
    cachedAgent = new ProxyAgent(proxyUrl);
    cachedUrl = proxyUrl;
  }
  // La fetch globale (undici) lit `dispatcher` ; le type standard RequestInit ne
  // l'expose pas → on l'ajoute puis on caste au moment de l'appel.
  const withDispatcher = { ...init, dispatcher: cachedAgent };
  return fetch(url, withDispatcher as RequestInit);
}
