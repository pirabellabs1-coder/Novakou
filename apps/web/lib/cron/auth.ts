import { NextRequest, NextResponse } from "next/server";

/**
 * Unified cron authentication helper.
 *
 * All routes under /api/cron/** must call this at the top of their handler:
 *
 *   const authError = requireCronAuth(req);
 *   if (authError) return authError;
 *
 * Authorization rules:
 *  - Production with CRON_SECRET unset → 503 (server misconfigured, fail-closed).
 *  - Development with CRON_SECRET unset → allow (returns null) for local triggers.
 *  - With CRON_SECRET set → allow ONLY if `Authorization: Bearer <CRON_SECRET>`
 *    matches. L'en-tête `x-vercel-cron` seul ne suffit pas : il est trivial à
 *    ajouter depuis l'extérieur, et laissait déclencher les versements.
 *  - Otherwise → 401 Unauthorized.
 *
 * Returns NextResponse to short-circuit the route, or null if the request
 * is authorized and the handler should proceed.
 */
export function requireCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[CRON] CRON_SECRET missing in production");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
    }
    return null; // dev: allow without secret
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return null;

  // L'en-tête `x-vercel-cron` NE SUFFIT PLUS. N'importe qui pouvait l'ajouter à
  // une requête ordinaire et déclencher les tâches planifiées — dont celles qui
  // envoient de l'argent. Vercel joint `Authorization: Bearer $CRON_SECRET` à
  // ses appels dès que la variable existe : c'est cette preuve-là qu'on exige.
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
