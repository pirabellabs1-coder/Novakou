import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { payoutFetch, isPayoutProxyConfigured } from "@/lib/payout/proxy-fetch";
import { getGatewayCredentials } from "@/lib/payments/gateways";

/**
 * POST /api/formations/admin/test-gateway   (admin uniquement)
 * Body : { provider: "feexpay" | "fedapay" }
 *
 * TEST DE CONNEXION — NE DÉPLACE AUCUN ARGENT.
 *
 * Fait un appel authentifié en LECTURE seule chez le fournisseur pour répondre
 * à deux questions avant tout paiement réel :
 *   1. les identifiants saisis sont-ils acceptés ?
 *   2. l'IP sortante est-elle autorisée (filtre IP FeexPay/FedaPay) ?
 *
 * On sépare volontairement ce diagnostic du test de paiement : découvrir un
 * problème de clé ou d'IP ne devrait pas coûter une transaction réelle.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Probe = { ok: boolean; httpStatus: number | null; detail: string };

async function probeFeexpay(creds: Record<string, string>): Promise<Probe> {
  const apiKey = creds.apiKey;
  const shopId = creds.shopId;
  if (!apiKey || !shopId) {
    return { ok: false, httpStatus: null, detail: "Clé API ou identifiant boutique manquant." };
  }
  try {
    const res = await payoutFetch(`https://api.feexpay.me/api/shop/${encodeURIComponent(shopId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    const text = (await res.text().catch(() => "")).slice(0, 300);
    if (res.ok) return { ok: true, httpStatus: res.status, detail: "Identifiants acceptés et IP autorisée." };
    return { ok: false, httpStatus: res.status, detail: text || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, httpStatus: null, detail: e instanceof Error ? e.message : String(e) };
  }
}

async function probeFedapay(creds: Record<string, string>): Promise<Probe> {
  const key = creds.secretKey;
  if (!key) return { ok: false, httpStatus: null, detail: "Clé secrète manquante." };
  const base =
    (process.env.FEDAPAY_ENVIRONMENT || "live").toLowerCase() === "sandbox"
      ? "https://sandbox-api.fedapay.com/v1"
      : "https://api.fedapay.com/v1";
  try {
    // Lecture seule : liste des devises du compte.
    const res = await payoutFetch(`${base}/currencies`, {
      method: "GET",
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    const text = (await res.text().catch(() => "")).slice(0, 300);
    if (res.ok) return { ok: true, httpStatus: res.status, detail: "Identifiants acceptés et IP autorisée." };
    return { ok: false, httpStatus: res.status, detail: text || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, httpStatus: null, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Traduit une erreur brute en cause probable, pour éviter les fausses pistes. */
function diagnose(p: Probe): string {
  if (p.ok) return "Tout est bon : la passerelle répond et accepte vos identifiants.";
  const l = p.detail.toLowerCase();
  if (l.includes("ip") && (l.includes("allow") || l.includes("autoris") || l.includes("not"))) {
    return "IP NON AUTORISÉE. Whitelistez les IP sortantes du proxy dans le tableau de bord du fournisseur.";
  }
  if (p.httpStatus === 401 || l.includes("unauthorized") || l.includes("invalid token")) {
    return "IDENTIFIANTS REFUSÉS. Vérifiez la clé saisie dans /admin/passerelles (attention aux espaces et aux copies tronquées).";
  }
  if (p.httpStatus === 403) {
    return "ACCÈS INTERDIT (403) : soit l'IP n'est pas autorisée, soit la fonction n'est pas activée sur le compte.";
  }
  if (p.httpStatus === 404) {
    return "RESSOURCE INTROUVABLE (404) : l'identifiant boutique est probablement incorrect.";
  }
  if (l.includes("timeout") || l.includes("fetch failed")) {
    return "FOURNISSEUR INJOIGNABLE. Réessayez ; si cela persiste, vérifiez l'URL du proxy.";
  }
  return "Échec non catégorisé — le détail brut du fournisseur est ci-dessous.";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toString().toUpperCase();
  if (!session?.user || (role !== "ADMIN" && !IS_DEV)) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const provider = String(body.provider ?? "").trim().toLowerCase();
  if (!["feexpay", "fedapay"].includes(provider)) {
    return NextResponse.json({ error: "Fournisseur non testable : " + provider }, { status: 400 });
  }

  const creds = await getGatewayCredentials(provider);
  if (!creds || Object.keys(creds).length === 0) {
    return NextResponse.json(
      { error: "Aucun identifiant enregistré pour cette passerelle.", code: "NO_CREDENTIALS" },
      { status: 400 },
    );
  }

  const probe = provider === "feexpay" ? await probeFeexpay(creds) : await probeFedapay(creds);

  return NextResponse.json({
    data: {
      provider,
      ok: probe.ok,
      httpStatus: probe.httpStatus,
      diagnosis: diagnose(probe),
      detail: probe.detail,
      proxyUsed: isPayoutProxyConfigured(),
      note: "Test en lecture seule — aucun paiement n'a été déclenché.",
    },
  });
}
