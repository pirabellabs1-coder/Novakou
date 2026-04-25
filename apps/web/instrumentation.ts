export async function register() {
  // Safety check: DEV_MODE must not be "true" in production
  if (process.env.NODE_ENV === "production" && process.env.DEV_MODE === "true") {
    console.error(
      "\n\n🚨 CRITICAL: DEV_MODE=true is set in production! This disables security features.\n" +
      "   Remove DEV_MODE from your production environment variables immediately.\n\n"
    );
    // Don't crash the app, but log a severe warning
  }

  // Sentry désactivé en dev — sera réactivé en production avec DSN configuré
}
