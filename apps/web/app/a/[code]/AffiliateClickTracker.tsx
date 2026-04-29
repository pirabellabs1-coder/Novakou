"use client";

import { useEffect } from "react";

/**
 * Records the click against this affiliate code on mount and ensures the
 * tracking cookie is set, so any purchase made within the cookie's window
 * attributes commission to this affiliate. Fires once per page load.
 *
 * Server component pages can't drop cookies directly during render, hence
 * this tiny client effect that hits the existing /api/marketing/affiliate/click
 * endpoint (which writes the AffiliateClick row in Prisma + sets the
 * fh_aff_code / fh_aff_visitor cookies on the response).
 */

const VISITOR_COOKIE = "nk_visitor_id";
const VISITOR_TTL_DAYS = 365;

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateVisitorId(): string {
  if (typeof document === "undefined") return "";
  // Read existing cookie
  const match = document.cookie.match(new RegExp(`(?:^|; )${VISITOR_COOKIE}=([^;]*)`));
  if (match && match[1]) {
    try { return decodeURIComponent(match[1]); } catch { /* fallthrough */ }
  }
  // Create new
  const id = genId();
  const maxAge = VISITOR_TTL_DAYS * 24 * 60 * 60;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  return id;
}

export default function AffiliateClickTracker({ code }: { code: string }) {
  useEffect(() => {
    if (!code) return;
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    const controller = new AbortController();
    fetch("/api/marketing/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        affiliateCode: code,
        visitorId,
        landingPage: typeof window !== "undefined" ? window.location.pathname + window.location.search : `/a/${code}`,
        referer: typeof document !== "undefined" ? document.referrer || null : null,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      }),
      signal: controller.signal,
      keepalive: true,
      credentials: "include", // ensure server can set cookies
    }).catch(() => {
      // Click tracking is best-effort — never block the boutique render.
    });
    return () => controller.abort();
  }, [code]);

  return null;
}
