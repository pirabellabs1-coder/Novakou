"use client";

/**
 * Google Analytics 4 avec Consent Mode v2 (conforme RGPD / CNIL).
 *
 * Comportement :
 *   - Le tag gtag.js est chargé IMMÉDIATEMENT (recommandation Google),
 *     mais tous les signaux analytics/marketing sont par défaut "denied".
 *   - Quand le user accepte via le <CookieBanner>, on envoie `gtag('consent','update',{...granted})`
 *     et GA commence à mesurer.
 *   - Si le user refuse, GA n'envoie rien (aucun cookie _ga/_gid déposé).
 *
 * Active seulement si NEXT_PUBLIC_GA_ID est défini.
 */

import Script from "next/script";
import { useEffect } from "react";

interface ConsentDetail {
  analytics?: boolean;
  marketing?: boolean;
  preferences?: boolean;
}

function readConsent(): ConsentDetail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("nk_consent");
    if (!raw) return null;
    return JSON.parse(raw) as ConsentDetail;
  } catch {
    return null;
  }
}

export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  useEffect(() => {
    // Update consent whenever the user changes it via the banner.
    function sync() {
      const c = readConsent();
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      if (typeof w.gtag !== "function") return;
      w.gtag("consent", "update", {
        analytics_storage: c?.analytics ? "granted" : "denied",
        ad_storage: c?.marketing ? "granted" : "denied",
        ad_user_data: c?.marketing ? "granted" : "denied",
        ad_personalization: c?.marketing ? "granted" : "denied",
        functionality_storage: c?.preferences ? "granted" : "denied",
        personalization_storage: c?.preferences ? "granted" : "denied",
        security_storage: "granted", // toujours OK (cookies essentiels)
      });
    }
    sync();
    window.addEventListener("nk:consent-change", sync);
    return () => window.removeEventListener("nk:consent-change", sync);
  }, []);

  return (
    <>
      {/* Default consent state BEFORE any script loads — RGPD-compliant */}
      <Script id="consent-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('consent','default',{
          analytics_storage:'denied',
          ad_storage:'denied',
          ad_user_data:'denied',
          ad_personalization:'denied',
          functionality_storage:'denied',
          personalization_storage:'denied',
          security_storage:'granted',
          wait_for_update: 500
        });
      `}</Script>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">{`
        gtag('js', new Date());
        gtag('config', '${measurementId}', {
          anonymize_ip: true,
          send_page_view: true
        });
      `}</Script>
    </>
  );
}
