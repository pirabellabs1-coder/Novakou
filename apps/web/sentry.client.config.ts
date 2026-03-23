// Sentry client config — @sentry/nextjs will be installed in V2
// For now, this file is a no-op placeholder

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  console.info("[Sentry] Client DSN configured but @sentry/nextjs not installed yet");
}
