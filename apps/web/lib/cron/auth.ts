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
 *  - With CRON_SECRET set → allow if either:
 *      * `Authorization: Bearer <CRON_SECRET>` header matches, OR
 *      * Vercel injected the `x-vercel-cron` header (managed cron run).
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
  const vercelCron = req.headers.get("x-vercel-cron");
  if (auth === `Bearer ${secret}` || vercelCron) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
