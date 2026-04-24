import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { initPayout, isMonerooConfigured } from "@/lib/moneroo";
import { getPayoutMethod, normalizeMsisdn } from "@/lib/moneroo-payout-methods";

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
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || (sessionRole !== "ADMIN" && !IS_DEV)) {
      return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
    }

    if (!isMonerooConfigured()) {
      return NextResponse.json(
        { error: "MONEROO_SECRET_KEY non configurée dans Vercel" },
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
    try {
      const data = await initPayout(payload);
      return NextResponse.json({
        ok: true,
        moneroo: data,
        payloadSent: payload,
        note: "Payout initié avec succès. Vérifiez le statut via /api/webhooks/moneroo ou consultez le dashboard Moneroo.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          ok: false,
          error: msg,
          payloadSent: payload,
          hint: msg.includes("method") ? "Le code méthode est probablement invalide. Vérifier la liste ci-dessus." :
                msg.includes("msisdn") ? "Le format msisdn est invalide. Format attendu : digits only, sans +, ex 22957335726." :
                msg.includes("balance") ? "Solde Moneroo insuffisant. Créditer votre compte." :
                msg.includes("401") || msg.includes("auth") ? "Clé API invalide ou payouts non actives sur votre compte." :
                "Voir le message d'erreur brut ci-dessus.",
        },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[admin/test-payout]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
