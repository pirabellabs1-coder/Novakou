/**
 * Sentry server config — route handlers, server components, RSC.
 *
 * DSN via env Vercel : SENTRY_DSN (ou fallback NEXT_PUBLIC_SENTRY_DSN).
 * Si DSN absent → no-op safe.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    ignoreErrors: [
      "ECONNREFUSED",
      "ETIMEDOUT",
      "EPIPE",
    ],
    beforeSend(event) {
      // Never log Authorization headers
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, unknown>;
        if (h.authorization) h.authorization = "[redacted]";
        if (h.cookie) h.cookie = "[redacted]";
      }
      return event;
    },
  });
}
