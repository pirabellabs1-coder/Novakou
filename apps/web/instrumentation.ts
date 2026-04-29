/**
 * Next.js 15 instrumentation hook.
 * Called once at app boot, both server-side and edge runtime.
 *
 * Registers :
 *   - Sentry (server / edge config files)
 *   - Critical env safety checks
 */

export async function register() {
  // ── Critical safety check : DEV_MODE in prod ────────────────────────
  if (process.env.NODE_ENV === "production" && process.env.DEV_MODE === "true") {
    console.error(
      "\n\n🚨 CRITICAL: DEV_MODE=true is set in production! This disables security features.\n" +
      "   Remove DEV_MODE from your production environment variables immediately.\n\n"
    );
  }

  // ── Sentry registration (per-runtime config) ───────────────────────
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      await import("./sentry.server.config");
    } else if (process.env.NEXT_RUNTIME === "edge") {
      await import("./sentry.edge.config");
    }
  }
}

/**
 * Sentry's onRequestError hook — captures nested route errors that don't
 * bubble to error.tsx. Only forwards if @sentry/nextjs is installed.
 */
export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[]> },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
  },
) {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(err, request, context);
  } catch {
    // @sentry/nextjs not installed yet — silent
  }
}
