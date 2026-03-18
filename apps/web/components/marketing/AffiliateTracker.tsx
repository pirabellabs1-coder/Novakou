"use client";

/**
 * FreelanceHigh — Affiliate & UTM Tracker
 *
 * Composant invisible (rendu null) place dans le layout racine.
 * A chaque montage :
 *   1. Detecte le parametre ?ref=CODE dans l'URL
 *      -> Enregistre un cookie affilie d'une duree de 30 jours
 *      -> Envoie un clic affilie au serveur (fire-and-forget)
 *   2. Detecte les parametres UTM (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
 *      -> Stocke dans sessionStorage pour le suivi de campagne
 *
 * Ce composant ne produit aucun rendu visuel.
 */

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { setAffiliateCookie, getAffiliateCookie } from "@/lib/marketing/affiliate-tracker-client";

// ── UTM keys we track ──────────────────────────────────────────────────────

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const UTM_STORAGE_KEY = "fh_utm_params";
const AFFILIATE_CLICK_ENDPOINT = "/api/marketing/affiliate/click";

// ── Component ──────────────────────────────────────────────────────────────

export default function AffiliateTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only run once per page load
    if (hasTracked.current) return;
    hasTracked.current = true;

    // ── 1. Affiliate tracking ──────────────────────────────────────────

    const refCode = searchParams.get("ref") || searchParams.get("affiliate");

    if (refCode && refCode.length >= 6 && refCode.length <= 12) {
      // Only set cookie if no existing affiliate cookie (first-touch attribution)
      const existingCode = getAffiliateCookie();
      if (!existingCode) {
        setAffiliateCookie(refCode, 30); // 30-day cookie
        console.log(`[AffiliateTracker] Cookie set: ref=${refCode}`);
      }

      // Track the click server-side (fire-and-forget)
      const visitorId = getOrCreateVisitorId();
      fetch(AFFILIATE_CLICK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateCode: refCode,
          visitorId,
          landingPage: pathname,
          referer: document.referrer || null,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {
        // Silently fail — tracking should never block the user experience
      });
    }

    // ── 2. UTM tracking ────────────────────────────────────────────────

    const utmParams: Record<string, string> = {};
    let hasUtm = false;

    for (const key of UTM_KEYS) {
      const value = searchParams.get(key);
      if (value) {
        utmParams[key] = value;
        hasUtm = true;
      }
    }

    if (hasUtm) {
      // Store UTM params in sessionStorage (persists during session, not across sessions)
      try {
        const existingRaw = sessionStorage.getItem(UTM_STORAGE_KEY);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};

        // Merge with any existing UTM params (new values override)
        const merged = { ...existing, ...utmParams, landingPage: pathname, timestamp: new Date().toISOString() };
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
        console.log(`[AffiliateTracker] UTM params stored:`, utmParams);
      } catch {
        // sessionStorage not available (SSR safety)
      }
    }
  }, [searchParams, pathname]);

  // Render nothing — this is a tracking-only component
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const VISITOR_ID_KEY = "fh_visitor_id";

function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage not available
    return `v_anon_${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Utility: retrieve stored UTM params from sessionStorage.
 * Can be imported by checkout flows to attach UTM data to purchases.
 */
export function getStoredUtmParams(): Record<string, string> | null {
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
