import { NextResponse } from "next/server";

/**
 * POST /api/formations/admin/test-payout-raw
 *
 * Endpoint ultra-minimal pour tester connectivite + env vars Moneroo.
 * Pas d'auth (DEV seulement), pas de Prisma, pas de getServerSession.
 * Juste : lit env var, appelle Moneroo direct, retourne la reponse brute.
 *
 * Ca evite toute la chaine Next-auth + Prisma qui pourrait crasher.
 */
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const trace: string[] = [];
  const push = (s: string) => { trace.push(`[${new Date().toISOString()}] ${s}`); };

  try {
    // SECURITE : token admin obligatoire (sinon n'importe qui pourrait vider
    // ton solde Moneroo). Le token est stocke dans la DB Configuration ou
    // via l'env var TEST_PAYOUT_TOKEN cote Vercel.
    const providedToken = request.headers.get("x-test-token") ?? "";
    const expectedToken = process.env.TEST_PAYOUT_TOKEN || "";
    if (!expectedToken || providedToken !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Header X-Test-Token invalide ou TEST_PAYOUT_TOKEN non configure dans Vercel." },
        { status: 401 },
      );
    }

    push("START");
    const body = await request.json().catch(() => ({}));
    push(`body parsed: ${JSON.stringify(body).slice(0, 200)}`);

    const key = process.env.MONEROO_SECRET_KEY;
    push(`MONEROO_SECRET_KEY: ${key ? "present (" + key.slice(0, 8) + "...)" : "ABSENT"}`);

    if (!key) {
      return NextResponse.json({
        ok: false,
        error: "MONEROO_SECRET_KEY absent du runtime",
        trace,
      });
    }

    const payload = {
      amount: Number(body.amount ?? 500),
      currency: "XOF",
      description: "Test payout",
      customer: {
        email: "test@novakou.com",
        first_name: "Test",
        last_name: "Novakou",
      },
      method: body.method ?? "mtn_bj",
      recipient: { msisdn: String(body.msisdn ?? "22957335726").replace(/\D/g, "") },
      metadata: { source: "test-raw" },
    };
    push(`payload built: ${JSON.stringify(payload)}`);

    push("fetching Moneroo...");
    const t0 = Date.now();
    const res = await fetch("https://api.moneroo.io/v1/payouts/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    push(`Moneroo replied in ${Date.now() - t0}ms, status=${res.status}`);

    const rawText = await res.text();
    push(`rawText length=${rawText.length}, first 200: ${rawText.slice(0, 200)}`);

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      push("Moneroo response is NOT JSON");
    }

    return NextResponse.json({
      ok: res.ok,
      httpStatus: res.status,
      monerooResponse: parsed ?? rawText.slice(0, 500),
      payloadSent: payload,
      trace,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    push(`CRASH: ${msg}`);
    return NextResponse.json({
      ok: false,
      error: msg,
      stack: stack?.split("\n").slice(0, 10).join("\n"),
      trace,
    });
  }
}
