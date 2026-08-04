import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { IS_DEV } from "@/lib/env";
import { isPayoutProxyConfigured, payoutFetch } from "@/lib/payout/proxy-fetch";
import { credential, hasCredentials } from "@/lib/payments/credentials";

/**
 * GET /api/formations/admin/diagnostic-versement
 *
 * DIT POURQUOI UN VERSEMENT ÉCHOUE, sans déplacer un centime.
 *
 * « FeexPay est temporairement indisponible pour ce versement » recouvre trois
 * causes qui demandent trois actions opposées :
 *   • l'IP d'où nous appelons n'est pas autorisée chez le fournisseur ;
 *   • le versement n'est pas activé sur le compte marchand ;
 *   • le réseau de l'opérateur est en panne chez le fournisseur.
 *
 * Sans ce diagnostic, on ne peut que deviner — et on a tourné en rond une
 * matinée sur un retrait de 100 F.
 *
 * Chaque appel ici est une LECTURE : aucun versement n'est créé, aucun argent
 * ne bouge. Le pire qui puisse arriver est une réponse d'erreur.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sonde = {
  quoi: string;
  via: "proxy" | "direct";
  statut: number | null;
  verdict: string;
  reponse?: string;
};

/** Exécute une lecture et raconte ce qu'on en apprend, sans jamais lever. */
async function sonder(
  quoi: string,
  via: "proxy" | "direct",
  fn: () => Promise<Response>,
): Promise<Sonde> {
  try {
    const res = await fn();
    const texte = (await res.text().catch(() => "")).slice(0, 200);
    let verdict: string;
    if (res.status === 401 || res.status === 403) {
      verdict = "le serveur répond, mais refuse nos identifiants ou notre IP";
    } else if (res.status === 407) {
      verdict = "le PROXY refuse : identifiants proxy invalides ou quota épuisé";
    } else if (res.status >= 500) {
      verdict = "le serveur est en panne";
    } else {
      verdict = "joignable et accepté";
    }
    return { quoi, via, statut: res.status, verdict, reponse: texte || undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const cause = (err as { cause?: { code?: string } })?.cause?.code;
    return {
      quoi,
      via,
      statut: null,
      verdict: `injoignable — ${cause ?? msg}`.slice(0, 160),
    };
  }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token?.role?.toString().toUpperCase() !== "ADMIN" && !IS_DEV) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }

  const proxyConfigure = isPayoutProxyConfigured();
  // ⚠️ Les identifiants portent leur nom INTERNE (apiKey, secretKey…), pas
  // celui de leur variable d'environnement. S'être trompé ici a fait croire
  // que les clés manquaient alors qu'elles étaient bien là.
  const [cleFedapay, cleFeexpay] = await Promise.all([
    credential("fedapay", "secretKey").catch(() => ""),
    credential("feexpay", "apiKey").catch(() => ""),
  ]);

  // La MÊME vérification que celle du versement : une passerelle qui échoue
  // ici est purement et simplement SAUTÉE par l'orchestrateur, sans un mot.
  const [pretFedapay, pretFeexpay] = await Promise.all([
    hasCredentials("fedapay").catch(() => false),
    hasCredentials("feexpay").catch(() => false),
  ]);

  const sondes: Sonde[] = [];

  // 1. Le proxy lui-même, via une lecture anodine.
  if (proxyConfigure) {
    sondes.push(
      await sonder("Proxy à IP fixe → FedaPay", "proxy", () =>
        payoutFetch("https://api.fedapay.com/v1/currencies", { method: "GET" }),
      ),
    );
  }

  // 2. Les fournisseurs AVEC nos identifiants — c'est ce qui distingue
  //    « IP non autorisée » de « clé invalide » de « compte non activé ».
  if (cleFedapay) {
    sondes.push(
      await sonder("FedaPay authentifié", proxyConfigure ? "proxy" : "direct", () =>
        payoutFetch("https://api.fedapay.com/v1/currencies", {
          method: "GET",
          headers: { Authorization: `Bearer ${cleFedapay}`, "Content-Type": "application/json" },
        }),
      ),
    );
  }
  if (cleFeexpay) {
    sondes.push(
      await sonder("FeexPay authentifié", proxyConfigure ? "proxy" : "direct", () =>
        payoutFetch("https://api-v2.feexpay.me/api/payouts/status/public/diagnostic", {
          method: "GET",
          headers: { Authorization: `Bearer ${cleFeexpay}`, "Content-Type": "application/json" },
        }),
      ),
    );
  }

  if (cleFeexpay) {
    sondes.push(
      await sonder("FeexPay sans proxy", "direct", () =>
        fetch("https://api-v2.feexpay.me/api/payouts/status/public/diagnostic", {
          method: "GET",
          headers: { Authorization: `Bearer ${cleFeexpay}` },
        }),
      ),
    );
  }

  // 3. Les mêmes, SANS le proxy : si le direct passe et le proxy non, le
  //    coupable est le proxy. Si les deux échouent en 401, c'est l'IP.
  sondes.push(
    await sonder("FedaPay sans proxy", "direct", () =>
      fetch("https://api.fedapay.com/v1/currencies", {
        method: "GET",
        headers: cleFedapay ? { Authorization: `Bearer ${cleFedapay}` } : undefined,
      }),
    ),
  );

  // ── Conclusion en français, pas en codes HTTP ─────────────────────────────
  const parProxy = sondes.filter((s) => s.via === "proxy");
  const proxyMuet = parProxy.length > 0 && parProxy.every((s) => s.statut === null);
  const proxyRefuse = parProxy.some((s) => s.statut === 407);
  const directOk = sondes.some((s) => s.via === "direct" && s.statut !== null && s.statut < 400);

  let conclusion: string;
  if (!proxyConfigure) {
    conclusion =
      "Aucun proxy à IP fixe configuré. Les appels partent depuis les IP de Vercel, " +
      "qui changent — les fournisseurs les refuseront.";
  } else if (proxyRefuse) {
    conclusion =
      "Le PROXY refuse nos identifiants (407) : abonnement expiré, quota épuisé " +
      "ou mot de passe changé. Aucun versement ne peut partir tant que ce n'est pas réglé.";
  } else if (proxyMuet) {
    conclusion =
      "Le PROXY ne répond pas du tout, alors que les fournisseurs répondent en direct. " +
      "C'est lui qu'il faut réparer — les fournisseurs vont bien.";
  } else if (directOk && parProxy.every((s) => (s.statut ?? 0) >= 400)) {
    conclusion =
      "Le proxy répond mais le fournisseur refuse ce qui en sort : IP du proxy " +
      "probablement absente de la liste blanche, ou clé invalide. Regardez la réponse ci-dessous.";
  } else {
    conclusion =
      "Le chemin de versement répond normalement. Si un retrait échoue quand même, " +
      "la cause est propre à l'opérateur ou au montant — lisez le détail du retrait dans l'admin.";
  }

  return NextResponse.json({
    data: {
      conclusion,
      proxyConfigure,
      identifiants: { fedapay: Boolean(cleFedapay), feexpay: Boolean(cleFeexpay) },
      // « prêt » = ce que teste réellement l'orchestrateur avant d'essayer une
      // passerelle. À faux, elle est sautée en silence.
      pretPourVerser: { fedapay: pretFedapay, feexpay: pretFeexpay },
      ordreEssai: ["fedapay", "feexpay"],
      sondes,
      note:
        "Aucun versement n'a été créé par ce diagnostic — ce sont uniquement des lectures.",
    },
  });
}
