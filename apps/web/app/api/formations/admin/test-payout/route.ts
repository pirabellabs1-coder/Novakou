import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { initPayout, isMonerooConfigured } from "@/lib/moneroo";
import { getPayoutMethod, normalizeMsisdn } from "@/lib/moneroo-payout-methods";

// Augmente le timeout a 30s (compatible Pro plan) pour laisser le temps
// a Moneroo de repondre. Sur Hobby ca reste a 10s max.
export const maxDuration = 30;
export const dynamic = "force-dynamic";

/**
 * POST /api/formations/admin/test-payout
 *
 * Outil de diagnostic admin. Envoie un payout Moneroo sans passer par
 * InstructorWithdrawal. Utile pour tester une méthode + numéro et voir
 * exactement ce que Moneroo renvoie (succès ou message d'erreur detaille).
 *
 * Body :
 *   {
 *     method: "mtn_bj" | "wave_sn" | ...,
 *     msisdn: "22957335726",
 *     amount: 500,
 *     firstName?: "Test",
 *     lastName?: "Admin",
 *     email?: "admin@novakou.com",
 *   }
 *
 * Admin only. Retourne la reponse Moneroo (id + status) ou l'erreur brute.
 */
export async function POST(request: Request) {
  const startedAt = Date.now();
  const debug: Record<string, unknown> = {};
  try {
    debug.step = "session_lookup";
    const session = await getServerSession(authOptions);
    const sessionRole = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || (sessionRole !== "ADMIN" && !IS_DEV)) {
      return NextResponse.json({ error: "Accès refusé — admin requis.", debug }, { status: 403 });
    }

    debug.step = "env_check";
    debug.hasMonerooKey = !!process.env.MONEROO_SECRET_KEY;
    debug.hasWebhookSecret = !!process.env.MONEROO_WEBHOOK_SECRET;
    if (!isMonerooConfigured()) {
      return NextResponse.json(
        { error: "MONEROO_SECRET_KEY non configurée dans Vercel", debug },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const method: string = body.method;
    const rawMsisdn: string = body.msisdn ?? body.phone;
    const amount: number = Number(body.amount ?? 500);
    const firstName: string = body.firstName ?? "Test";
    const lastName: string = body.lastName ?? "Novakou";
    const email: string = body.email ?? session.user.email ?? "test@novakou.com";

    if (!method || !rawMsisdn) {
      return NextResponse.json(
        { error: "Champs requis : method + msisdn (ou phone)" },
        { status: 400 },
      );
    }

    const methodDef = getPayoutMethod(method);
    if (!methodDef) {
      return NextResponse.json(
        {
          error: `Méthode "${method}" inconnue dans notre catalog.`,
          availableMethods: ["wave_sn", "orange_sn", "wave_ci", "orange_ci", "mtn_ci", "moov_ci", "mtn_bj", "moov_bj", "orange_cm", "mtn_cm", "..."],
        },
        { status: 400 },
      );
    }

    const msisdn = normalizeMsisdn(rawMsisdn);

    const payload = {
      amount: Math.round(amount),
      currency: methodDef.currency,
      description: `Test payout Novakou — ${methodDef.label}`,
      customer: { email, first_name: firstName, last_name: lastName },
      method,
      recipient: { msisdn },
      metadata: { type: "admin_test", timestamp: new Date().toISOString() },
    };

    // Tentative d'init Moneroo avec le vrai payload — on expose la reponse brute
    debug.step = "moneroo_init";
    try {
      const data = await initPayout(payload);
      debug.durationMs = Date.now() - startedAt;
      return NextResponse.json({
        ok: true,
        moneroo: data,
        payloadSent: payload,
        debug,
        note: "Payout initié avec succès.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debug.durationMs = Date.now() - startedAt;
      debug.errorMessage = msg;
      return NextResponse.json(
        {
          ok: false,
          error: msg,
          payloadSent: payload,
          debug,
          hint: msg.includes("method") ? "Le code méthode est probablement invalide." :
                msg.includes("msisdn") ? "Le format msisdn est invalide (digits only, sans +, ex 22957335726)." :
                msg.includes("balance") ? "Solde Moneroo insuffisant." :
                msg.includes("401") || msg.toLowerCase().includes("unauthorized") ? "Clé API invalide ou payouts non actives." :
                msg.includes("timeout") ? "Moneroo n'a pas répondu à temps." :
                "Voir le message d'erreur brut ci-dessus.",
        },
        { status: 200 }, // Important : on renvoie 200 pour que le client puisse parser le JSON
      );
    }
  } catch (err) {
    debug.durationMs = Date.now() - startedAt;
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack?.split("\n").slice(0, 10).join("\n") : undefined;
    console.error("[admin/test-payout] CRASH", { msg, stack, debug });
    return NextResponse.json(
      { ok: false, error: msg, stack, debug },
      { status: 200 }, // On renvoie 200 pour que le JSON passe toujours
    );
  }
}
