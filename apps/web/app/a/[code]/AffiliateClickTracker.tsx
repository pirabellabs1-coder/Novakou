"use client";

import { useEffect } from "react";

/**
 * Records the click against this affiliate code on mount and ensures the
 * tracking cookie is set, so any purchase made within the cookie's window
 * attributes commission to this affiliate. Fires once per page load.
 *
 * Server component pages can't drop cookies directly during render, hence
 * this tiny client effect that hits the existing /api/marketing/affiliate/click
 * endpoint (which also writes the AffiliateClick row in Prisma).
 */
export default function AffiliateClickTracker({ code }: { code: string }) {
  useEffect(() => {
    if (!code) return;
    const controller = new AbortController();
    fetch("/api/marketing/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        affiliateCode: code,
        landingPage: typeof window !== "undefined" ? window.location.pathname : `/a/${code}`,
        referer: typeof document !== "undefined" ? document.referrer || null : null,
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // Click tracking is best-effort — never block the boutique render.
    });
    return () => controller.abort();
  }, [code]);

  return null;
}
