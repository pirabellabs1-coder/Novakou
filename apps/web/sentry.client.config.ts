/**
 * Sentry client config — actif en production.
 *
 * DSN à fournir via env Vercel :
 *   - NEXT_PUBLIC_SENTRY_DSN (ex. https://abc@oXYZ.ingest.sentry.io/123)
 *   - SENTRY_AUTH_TOKEN (build only — upload des source maps)
 *   - SENTRY_ORG, SENTRY_PROJECT
 *
 * Si DSN absent, Sentry s'initialise pas (no-op safe).
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Loading chunk",
      "Network request failed",
      "AbortError",
      "Non-Error promise rejection captured",
    ],
    beforeSend(event) {
      // Strip PII from payment errors
      if (event.request?.cookies) {
        event.request.cookies = { redacted: "true" };
      }
      return event;
    },
  });
}
