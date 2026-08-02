import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { payoutFetch, isPayoutProxyConfigured } from "@/lib/payout/proxy-fetch";

/**
 * GET /api/formations/admin/payout-proxy-check  (admin uniquement)
 *
 * Diagnostic du proxy de versement (Fixie). NE DÉPLACE PAS D'ARGENT : fait un
 * simple echo d'IP en direct ET à travers le proxy, pour confirmer que :
 *   - PAYOUT_PROXY_URL est bien pris en compte sur ce déploiement,
 *   - le proxy répond (pas de 407 d'auth),
 *   - et quelle IP de sortie whitelister chez FeexPay / FedaPay.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

async function getEgressIp(fetchFn: FetchLike): Promise<{ ip?: string; error?: string }> {
  try {
    const res = await fetchFn("https://api.ipify.org?format=json", { method: "GET" });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const j = (await res.json().catch(() => ({}))) as { ip?: string };
    return { ip: j.ip ?? "?" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toString().toUpperCase();
  if (!session?.user || (role !== "ADMIN" && !IS_DEV)) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }

  const configured = isPayoutProxyConfigured();
  const direct = await getEgressIp(fetch);
  const proxied = configured
    ? await getEgressIp(payoutFetch)
    : { error: "PAYOUT_PROXY_URL non détectée sur ce déploiement" };

  let hint: string;
  if (!configured) {
    hint =
      "PAYOUT_PROXY_URL absente de ce déploiement. Vérifie la variable sur Vercel (Production) puis redéploie.";
  } else if (proxied.ip && proxied.ip !== direct.ip) {
    hint = `OK — le proxy fonctionne. IP à whitelister chez FeexPay + FedaPay : ${proxied.ip} (IP directe Vercel, sans proxy : ${direct.ip ?? "?"}).`;
  } else if (proxied.error) {
    hint = `Le proxy est configuré mais l'appel a échoué : ${proxied.error}. Un 407 = identifiants Fixie incorrects dans l'URL ; un timeout = hôte/port erronés.`;
  } else {
    hint = `L'IP via proxy (${proxied.ip}) est identique à l'IP directe — le trafic ne semble PAS passer par le proxy. Vérifie l'URL Fixie.`;
  }

  return NextResponse.json({
    proxyConfigured: configured,
    directEgressIp: direct.ip ?? null,
    directError: direct.error ?? null,
    proxiedEgressIp: proxied.ip ?? null,
    proxiedError: proxied.error ?? null,
    proxyWorks: configured && !!proxied.ip && proxied.ip !== direct.ip,
    hint,
  });
}
