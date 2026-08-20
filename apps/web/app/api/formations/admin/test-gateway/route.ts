import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { payoutFetch, isPayoutProxyConfigured } from "@/lib/payout/proxy-fetch";
import { getGatewayCredentials } from "@/lib/payments/gateways";

/**
 * POST /api/formations/admin/test-gateway   (admin uniquement)
 * Body : { provider: "feexpay" | "fedapay" | "kkiapay" | "ipaymoney" }
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
  const auth = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };

  // FeexPay sert l'ENCAISSEMENT et le VERSEMENT depuis DEUX hôtes distincts.
  // Ne sonder qu'un seul rend le diagnostic faux : un encaissement en panne
  // passerait pour une clé refusée, ou l'inverse.
  const results: string[] = [];
  let collectOk = false;
  let payoutOk = false;
  let lastStatus: number | null = null;

  try {
    // Hôte d'ENCAISSEMENT : pas de filtre IP, donc pas de proxy (facturé à la requête).
    const res = await fetch(`https://api.feexpay.me/api/shop/${encodeURIComponent(shopId)}`, { method: "GET", headers: auth });
    lastStatus = res.status;
    collectOk = res.ok;
    results.push(
      res.ok
        ? "Encaissement : OK."
        : `Encaissement : HTTP ${res.status}${res.status >= 500 ? " — service FeexPay indisponible (api.feexpay.me)" : ""}.`,
    );
  } catch (e) {
    results.push(`Encaissement : injoignable (${e instanceof Error ? e.message : String(e)}).`);
  }

  try {
    // Référence inexistante : la réponse dit seulement si la clé est acceptée.
    const res = await payoutFetch("https://api-v2.feexpay.me/api/payouts/status/public/diagnostic", { method: "GET", headers: auth });
    // 404 = clé acceptée, référence inconnue. 401/403 = clé ou IP refusée.
    payoutOk = res.ok || res.status === 404 || res.status === 400;
    lastStatus = lastStatus ?? res.status;
    results.push(payoutOk ? "Versement : OK." : `Versement : HTTP ${res.status}.`);
  } catch (e) {
    results.push(`Versement : injoignable (${e instanceof Error ? e.message : String(e)}).`);
  }

  return { ok: collectOk && payoutOk, httpStatus: lastStatus, detail: results.join(" ") };
}

/**
 * Sonde PawaPay : /v2/active-conf.
 *
 * Choix deliberé — c'est une LECTURE SEULE qui, en plus de valider le jeton,
 * renvoie les pays et operateurs reellement actives sur le compte. Un test qui
 * dit « ca marche » sans dire ce qu'on peut encaisser n'apprend presque rien.
 */
async function probePawapay(creds: Record<string, string>): Promise<Probe> {
  const jeton = creds.apiToken;
  if (!jeton) return { ok: false, httpStatus: null, detail: "Jeton API manquant." };
  const { isSandbox } = await import("@/lib/payments/credentials");
  const base = (await isSandbox("pawapay"))
    ? "https://api.sandbox.pawapay.io"
    : "https://api.pawapay.io";
  try {
    // PawaPay ne filtre pas par IP : en direct, le proxy ne sert qu'à FeexPay.
    const res = await fetch(`${base}/v2/active-conf`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${jeton}` },
    });
    // NE PAS tronquer avant d'analyser : leur reponse depasse largement
    // quelques milliers de caracteres (logos, libelles traduits, plafonds), et
    // la couper d'abord faisait echouer l'analyse — le test retombait alors sur
    // du JSON brut illisible en pretendant que la reponse etait inexploitable.
    const texte = await res.text();
    let resume = texte.slice(0, 300);
    if (res.ok) {
      try {
        // Leur reponse complete pese plusieurs milliers de lignes (logos,
        // libelles traduits, plafonds...). On n'en garde que ce qui sert a
        // declarer la couverture : pays, code operateur, devise.
        type Conf = {
          countries?: Array<{
            country?: string;
            providers?: Array<{
              provider?: string;
              currencies?: Array<{
                currency?: string;
                operationTypes?: {
                  DEPOSIT?: { authType?: string };
                  PAYOUT?: Record<string, unknown>;
                };
              }>;
            }>;
          }>;
        };
        const j = JSON.parse(texte) as Conf;
        const pays = j.countries ?? [];
        const lignes: string[] = [];
        let encaissables = 0;
        for (const c of pays) {
          for (const op of c.providers ?? []) {
            const dev = (op.currencies ?? []).map((x) => x.currency).filter(Boolean).join("/");
            // MODE D'AUTORISATION. Un opérateur present dans la couverture
            // n'est pas pour autant encaissable par nous : nous n'implementons
            // que la demande poussee sur le telephone (PROVIDER_AUTH). Sans
            // cette colonne, un operateur en PREAUTH ou REDIRECT_AUTH passait
            // pour disponible, et chaque vente partait vers un echec certain.
            const ops = op.currencies?.[0]?.operationTypes;
            const auth = ops?.DEPOSIT?.authType ?? "?";
            const utilisable = auth === "PROVIDER_AUTH";
            // VERSEMENT : la presence de PAYOUT dans la configuration dit si
            // NOTRE compte peut verser sur cet operateur. C'est ce qui manquait
            // pour decider, faits a l'appui, quels pays ouvrir au retrait via
            // PawaPay — le registre en fermait plusieurs (Benin, Cote d'Ivoire)
            // sans qu'on sache si c'etait un choix ou un oubli.
            const versement = ops && "PAYOUT" in ops ? "versement:OUI" : "versement:non";
            if (utilisable) encaissables += 1;
            if (c.country && op.provider) {
              lignes.push(
                `${utilisable ? "OK " : "NON"} ${c.country} ${op.provider} ${dev} [${auth}] ${versement}`,
              );
            }
          }
        }
        const sautDeLigne = String.fromCharCode(10);
        resume =
          `${pays.length} pays, ${lignes.length} operateurs — ${encaissables} encaissables par nous ` +
          `(demande poussee). Les lignes « NON » exigent un code a usage unique ou une page operateur : ` +
          `elles sont refusees a la commande au lieu de partir vers un echec certain.` +
          sautDeLigne +
          lignes.sort().join(sautDeLigne);
      } catch {
        // Reponse illisible : on garde le texte brut, il servira au diagnostic.
      }
    }
    return { ok: res.ok, httpStatus: res.status, detail: resume };
  } catch (e) {
    return { ok: false, httpStatus: null, detail: e instanceof Error ? e.message : "Injoignable" };
  }
}

async function probeIpaymoney(creds: Record<string, string>): Promise<Probe> {
  const key = creds.secretKey;
  if (!key) return { ok: false, httpStatus: null, detail: "Clé secrète manquante." };
  const { isSandbox } = await import("@/lib/payments/credentials");
  const sb = await isSandbox("ipaymoney");
  const env = sb
    ? process.env.IPAYMONEY_ENV_SANDBOX?.trim() || "sandbox"
    : process.env.IPAYMONEY_ENV_LIVE?.trim() || "live";
  try {
    // Lecture d'une référence volontairement inexistante : aucune écriture,
    // et la réponse suffit à savoir si la clé est acceptée.
    const res = await fetch("https://i-pay.money/api/v1/payments/diagnostic-novakou", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
        "Ipay-Target-Environment": env,
      },
    });
    const text = (await res.text().catch(() => "")).slice(0, 300);
    if (res.status === 401 || res.status === 403) {
      return { ok: false, httpStatus: res.status, detail: `Clé refusée. ${text}` };
    }
    // 400/404 sur une référence bidon = la clé est passée, seule la
    // transaction est introuvable : c'est exactement le résultat attendu.
    return {
      ok: true,
      httpStatus: res.status,
      detail: `Clé acceptée (${sb ? "bac à sable" : "production"}). ${text}`,
    };
  } catch (e) {
    return { ok: false, httpStatus: null, detail: e instanceof Error ? e.message : String(e) };
  }
}

async function probeKkiapay(creds: Record<string, string>): Promise<Probe> {
  const { publicKey, privateKey, secret } = creds;
  if (!publicKey || !privateKey || !secret) {
    return { ok: false, httpStatus: null, detail: "Clé publique, clé privée ou secret manquant." };
  }
  const sandbox = (await import("@/lib/payments/credentials")).isSandbox;
  const isSb = await sandbox("kkiapay");
  const base = isSb ? "https://api-sandbox.kkiapay.me" : "https://api.kkiapay.me";
  try {
    // Vérification d'une transaction volontairement inexistante : aucune
    // écriture, et la réponse dit si les clés sont acceptées.
    const res = await fetch(`${base}/api/v1/transactions/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": publicKey,
        "x-private-key": privateKey,
        "x-secret-key": secret,
      },
      body: JSON.stringify({ transactionId: "diagnostic-novakou" }),
    });
    const text = (await res.text().catch(() => "")).slice(0, 300);
    // INVALID_KEY = clés refusées. Toute autre réponse = clés acceptées, seule
    // la transaction est introuvable — ce qui est exactement attendu ici.
    if (text.includes("INVALID_KEY") || res.status === 401) {
      return { ok: false, httpStatus: res.status, detail: `Clés refusées. ${text}` };
    }
    return {
      ok: true,
      httpStatus: res.status,
      detail: `Clés acceptées (${isSb ? "bac à sable" : "production"}). ${text}`,
    };
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
    const res = await fetch(`${base}/currencies`, {
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
  if (p.httpStatus !== null && p.httpStatus >= 500) {
    return "LE FOURNISSEUR EST EN PANNE (erreur 5xx de son côté). Vos identifiants ne sont pas en cause — contactez son support.";
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
  // Liste des fournisseurs pour lesquels une sonde EXISTE réellement. Elle
  // doit rester alignée avec l'aiguillage plus bas et avec les boutons de
  // l'écran admin : « pawapay » avait sa sonde et son bouton, mais pas son
  // entrée ici — le test échouait donc sur un message trompeur, qui laissait
  // croire à une passerelle mal intégrée alors que tout fonctionnait.
  if (!["feexpay", "fedapay", "kkiapay", "ipaymoney", "pawapay"].includes(provider)) {
    return NextResponse.json({ error: "Fournisseur non testable : " + provider }, { status: 400 });
  }

  const creds = await getGatewayCredentials(provider);
  if (!creds || Object.keys(creds).length === 0) {
    return NextResponse.json(
      { error: "Aucun identifiant enregistré pour cette passerelle.", code: "NO_CREDENTIALS" },
      { status: 400 },
    );
  }

  const probe =
    provider === "feexpay" ? await probeFeexpay(creds)
    : provider === "kkiapay" ? await probeKkiapay(creds)
    : provider === "ipaymoney" ? await probeIpaymoney(creds)
    : provider === "pawapay" ? await probePawapay(creds)
    : await probeFedapay(creds);

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
