/**
 * Sentry server config — placeholder activable.
 *
 * Pour activer Sentry server (route handlers, server components, RSC) :
 *   1. pnpm add @sentry/nextjs --filter @freelancehigh/web
 *   2. Décommenter le bloc ci-dessous.
 */

// === ACTIVATION (décommenter après install @sentry/nextjs) ============
// import * as Sentry from "@sentry/nextjs";
//
// Sentry.init({
//   dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
//   tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
//   environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
//   release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
//   ignoreErrors: [
//     "ECONNREFUSED",
//     "ETIMEDOUT",
//   ],
// });

// === No-op ===========================================================
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
if (sentryDsn && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.info("[Sentry] Server DSN set but @sentry/nextjs not installed — see sentry.server.config.ts");
}

export {};
