import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { IS_DEV } from "@/lib/env";
import { isMonerooConfigured } from "@/lib/moneroo";
import { isFeexpayConfigured } from "@/lib/feexpay";
import { isFedapayConfigured } from "@/lib/fedapay";
import { getPayoutMethod, normalizeMsisdn } from "@/lib/moneroo-payout-methods";
import { executePayout, type PayoutProviderId } from "@/lib/payout/execute";
import { getPayoutMapping } from "@/lib/payout/methods-map";

// 30s (Pro plan) pour laisser le temps au fournisseur de répondre.
export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * POST /api/formations/admin/test-payout
 *
 * Outil de diagnostic admin. Déclenche un VRAI payout de test (déplace de
 * l'argent réel) via l'orchestrateur, en FORÇANT le fournisseur choisi — donc
 * exactement le même chemin qu'en production, sans bascule qui masquerait un
 * échec. Ne crée pas de InstructorWithdrawal.
 *
 * Body : { method, msisdn, amount, provider?: "moneroo"|"feexpay"|"fedapay", firstName?, lastName?, email? }
 * Admin only.
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const debug: Record<string, unknown> = {};
  try {
    debug.step = "jwt_token_lookup";
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const tokenRole = token?.role?.toString().toUpperCase();
    if ((!token || tokenRole !== "ADMIN") && !IS_DEV) {
      return NextResponse.json({ error: "Accès refusé — admin requis.", debug }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const method: string = body.method;
    const rawMsisdn: string = body.msisdn ?? body.phone;
    const amount: number = Number(body.amount ?? 500);
    const firstName: string = body.firstName ?? "Test";
    const lastName: string = body.lastName ?? "Novakou";
    const email: string = body.email ?? (token?.email as string | undefined) ?? "test@novakou.com";

    const providerRaw = String(body.provider ?? "moneroo").toLowerCase();
    const provider: PayoutProviderId =
      providerRaw === "feexpay" ? "feexpay" :
      providerRaw === "fedapay" ? "fedapay" : "moneroo";

    debug.step = "env_check";
    debug.provider = provider;
    debug.hasMonerooKey = isMonerooConfigured();
    debug.hasFeexpayKey = isFeexpayConfigured();
    debug.hasFedapayKey = isFedapayConfigured();

    const configured =
      provider === "moneroo" ? isMonerooConfigured() :
      provider === "feexpay" ? isFeexpayConfigured() :
      isFedapayConfigured();
    if (!configured) {
      return NextResponse.json(
        { error: `Le fournisseur "${provider}" n'est pas configuré (clés absentes dans Vercel).`, debug },
        { status: 500 },
      );
    }

    if (!method || !rawMsisdn) {
      return NextResponse.json({ error: "Champs requis : method + msisdn (ou phone)" }, { status: 400 });
    }

    const methodDef = getPayoutMethod(method);
    if (!methodDef) {
      return NextResponse.json({ error: `Méthode "${method}" inconnue dans notre catalogue.` }, { status: 400 });
    }

    // Le fournisseur forcé couvre-t-il cet opérateur ?
    const mapping = getPayoutMapping(method);
    if (provider === "feexpay" && !mapping?.feexpay) {
      return NextResponse.json({ error: `FeexPay ne dispose pas de route pour l'opérateur "${method}".`, debug }, { status: 400 });
    }
    if (provider === "fedapay" && !mapping?.fedapay) {
      return NextResponse.json({ error: `FedaPay n'a pas de code "mode" confirmé pour l'opérateur "${method}" (à compléter dans methods-map).`, debug }, { status: 400 });
    }

    const msisdn = normalizeMsisdn(rawMsisdn, method);
    const testId = `admin_test_${Date.now()}`;

    debug.step = "execute_payout";
    const exec = await executePayout({
      method,
      amount: Math.round(amount),
      msisdn,
      customer: { email, firstName, lastName },
      description: `Test payout Novakou — ${methodDef.label}`,
      withdrawalId: testId,
      forceProvider: provider, // pas de bascule : on teste CE fournisseur précis.
    });
    debug.durationMs = Date.now() - startedAt;

    if (exec.ok) {
      return NextResponse.json({
        ok: true,
        provider: exec.provider,
        reference: exec.providerRef,
        status: exec.status,
        attempts: exec.attempts,
        sent: { method, msisdn, amount: Math.round(amount) },
        debug,
        note: `Payout de test envoyé via ${exec.provider} (ref ${exec.providerRef}, statut ${exec.status}).`,
      });
    }
    return NextResponse.json({
      ok: false,
      terminal: exec.terminal,
      error: exec.userMessage,
      attempts: exec.attempts,
      sent: { method, msisdn, amount: Math.round(amount) },
      debug,
    }, { status: 200 }); // 200 pour que le client parse toujours le JSON.
  } catch (err) {
    debug.durationMs = Date.now() - startedAt;
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack?.split("\n").slice(0, 10).join("\n") : undefined;
    console.error("[admin/test-payout] CRASH", { msg, stack, debug });
    return NextResponse.json({ ok: false, error: msg, stack, debug }, { status: 200 });
  }
}
