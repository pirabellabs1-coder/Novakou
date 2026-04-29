/**
 * Sentry client config — placeholder activable.
 *
 * Pour activer Sentry :
 *   1. pnpm add @sentry/nextjs --filter @freelancehigh/web
 *   2. npx @sentry/wizard@latest -i nextjs (auto-config)
 *   3. Décommenter le bloc ci-dessous et supprimer le no-op.
 *
 * Variables d'env nécessaires (Vercel):
 *   - NEXT_PUBLIC_SENTRY_DSN
 *   - SENTRY_AUTH_TOKEN (pour upload source maps au build)
 *   - SENTRY_ORG, SENTRY_PROJECT
 */

// === ACTIVATION (décommenter après install @sentry/nextjs) ============
// import * as Sentry from "@sentry/nextjs";
//
// Sentry.init({
//   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
//   tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
//   environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
//   release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
//   replaysSessionSampleRate: 0.0, // off by default — opt-in
//   replaysOnErrorSampleRate: 1.0, // all errors get a replay
//   integrations: [],
//   // Filter out noise (chunk load errors, ad blockers, ResizeObserver loop)
//   ignoreErrors: [
//     "ResizeObserver loop limit exceeded",
//     "ResizeObserver loop completed with undelivered notifications",
//     "Loading chunk",
//     "Network request failed",
//   ],
// });

// === No-op until package is installed =================================
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (sentryDsn && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.info("[Sentry] Client DSN set but @sentry/nextjs not installed — see sentry.client.config.ts");
}

export {};
