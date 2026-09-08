import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron/auth";
import { credential, hasCredentials } from "@/lib/payments/credentials";
import { OPERATORS, routeFor } from "@/lib/payments/registry";

/**
 * GET /api/cron/diagnostic-couverture
 *
 * CE QUE NOS COMPTES SAVENT VRAIMENT FAIRE, DEMANDÉ AUX FOURNISSEURS EUX-MÊMES.
 *
 * Le registre déclare des routes ; les fournisseurs, eux, savent ce qui est
 * ACTIVÉ sur nos comptes. Les deux ont divergé plusieurs fois : Wave CI
 * « servi » par FeexPay alors que le marchand agrégé n'était pas configuré,
 * MTN Cameroun « versable » par PawaPay alors que le versement n'y était pas
 * ouvert. À chaque fois, un vendeur a découvert l'écart en essayant de retirer
 * son argent.
 *
 * Cette route n'est PAS planifiée : elle se déclenche à la main, protégée par
 * CRON_SECRET comme les autres tâches — c'est la seule authentification serveur
 * dont dispose un opérateur sans session admin. Elle ne déplace AUCUN argent :
 *   • PawaPay : /v2/active-conf, lecture seule ;
 *   • FeexPay : une demande d'encaissement Wave d'un montant symbolique vers un
 *     numéro de test, que personne ne validera — elle expire d'elle-même. C'est
 *     la seule façon de savoir si le marchand agrégé Wave est activé, FeexPay
 *     n'exposant aucun endpoint de capacité. Même méthode que les sondes du
 *     2026-08-08.
 *
 * La clé de chiffrement des identifiants ne vit qu'en production : ce
 * diagnostic ne peut donc tourner QUE là, et c'est voulu.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FEEXPAY_COLLECT = "https://api-v2.feexpay.me/api/transactions/requesttopay/integration";

/** Numéros syntaxiquement valides, jamais attribués à un vrai client. */
const NUMERO_TEST: Record<string, string> = { "WAVE CI": "2250700000000", "WAVE SN": "221770000000" };

type SondeFeexpay = {
  reseau: string;
  http: number | null;
  code: string | null;
  message: string | null;
  referenceRecue: boolean;
  verdict: "ACTIF" | "NON_ACTIVE_SUR_LE_COMPTE" | "INDETERMINE";
};

async function sonderWaveFeexpay(reseau: string): Promise<SondeFeexpay> {
  const [apiKey, shop] = await Promise.all([credential("feexpay", "apiKey"), credential("feexpay", "shopId")]);
  if (!apiKey || !shop) {
    return { reseau, http: null, code: null, message: "identifiants FeexPay absents", referenceRecue: false, verdict: "INDETERMINE" };
  }
  try {
    const res = await fetch(FEEXPAY_COLLECT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      body: JSON.stringify({
        phoneNumber: NUMERO_TEST[reseau],
        amount: 100,
        reseau,
        description: "Diagnostic Novakou",
        customId: `diagnostic-${Date.now()}`,
        shop,
        token: apiKey,
        payment_interface: "API",
        callback_info: { ref: "diagnostic" },
        currency: "XOF",
        first_name: "Diagnostic",
        email: "",
        otp: "",
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { reference?: string; transaction_id?: string; code?: string; message?: string };
    const referenceRecue = Boolean(json.reference || json.transaction_id);
    const texte = `${json.code ?? ""} ${json.message ?? ""}`;
    const verdict: SondeFeexpay["verdict"] = referenceRecue
      ? "ACTIF"
      : /aggregated|not configured|not enabled|not_enabled|non activ/i.test(texte)
        ? "NON_ACTIVE_SUR_LE_COMPTE"
        : "INDETERMINE";
    return { reseau, http: res.status, code: json.code ?? null, message: (json.message ?? null)?.slice(0, 200) ?? null, referenceRecue, verdict };
  } catch (e) {
    return { reseau, http: null, code: null, message: e instanceof Error ? e.message : String(e), referenceRecue: false, verdict: "INDETERMINE" };
  }
}

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  // ── PawaPay : ce que le compte a d'ouvert, confronté au registre ──────────
  let pawapay: unknown = { erreur: "non configuré" };
  if (await hasCredentials("pawapay")) {
    try {
      const { configurationBrute } = await import("@/lib/pawapay");
      const conf = await configurationBrute();
      const parProvider = new Map(conf.map((c) => [c.provider.toUpperCase(), c] as const));

      // Chaque route PawaPay du registre, confrontée au compte.
      const ecarts: Array<{ operateur: string; sens: "collect" | "payout"; code: string; etat: string }> = [];
      for (const op of Object.keys(OPERATORS)) {
        for (const sens of ["collect", "payout"] as const) {
          const r = routeFor(op, "pawapay", sens);
          if (!r) continue;
          const c = parProvider.get(r.code.toUpperCase());
          const attendu = sens === "collect" ? "DEPOSIT" : "PAYOUT";
          const ok = Boolean(c && c.operations.includes(attendu));
          const authOk = sens !== "collect" || !c || c.authDepot === "PROVIDER_AUTH";
          const etat = !c
            ? "ABSENT_DU_COMPTE"
            : !ok
              ? `${attendu}_NON_OUVERT`
              : !authOk
                ? `DEPOSIT_${c.authDepot}_NON_GERE`
                : "OK";
          if (etat !== "OK") ecarts.push({ operateur: op, sens, code: r.code, etat });
        }
      }
      pawapay = { operateursActifs: conf.length, compte: conf, ecartsAvecLeRegistre: ecarts };
    } catch (e) {
      pawapay = { erreur: e instanceof Error ? e.message : String(e) };
    }
  }

  // ── FeexPay : Wave, la question ouverte depuis le 2026-08-08 ─────────────
  let feexpay: unknown = { erreur: "non configuré" };
  if (await hasCredentials("feexpay")) {
    feexpay = { wave: await Promise.all(["WAVE CI", "WAVE SN"].map(sonderWaveFeexpay)) };
  }

  return NextResponse.json({ genereLe: new Date().toISOString(), pawapay, feexpay });
}
