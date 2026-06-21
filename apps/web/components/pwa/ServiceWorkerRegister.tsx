"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker `/sw.js` (PWA v2.0) côté client, après
 * l'hydratation, uniquement en production et si le navigateur le supporte.
 * Aucune UI. Échoue silencieusement (le site fonctionne sans SW).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* silencieux — le site reste fonctionnel sans SW */
      });
    };
    // Attendre l'événement load pour ne pas concurrencer le rendu initial
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
