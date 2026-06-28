"use client";

import { useEffect } from "react";
import { syncPushIfGranted } from "@/lib/push/client";

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
      // Si la page est DÉJÀ contrôlée par un SW, tout changement de contrôleur
      // = une nouvelle version vient d'être activée → on recharge UNE fois pour
      // récupérer le nouveau code (sinon l'app installée reste sur l'ancien).
      // Pas de listener au tout premier install (controller null) → pas de
      // reload parasite. Garde anti-boucle via `refreshing`.
      if (navigator.serviceWorker.controller) {
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      }
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Vérifie tout de suite s'il existe une version plus récente.
          reg.update().catch(() => {});
          // Si l'utilisateur a déjà accordé les notifications, on re-synchronise
          // silencieusement son abonnement (nouvel appareil, abonnement expiré…).
          syncPushIfGranted();
        })
        .catch(() => {
          /* silencieux — le site reste fonctionnel sans SW */
        });
    };
    // Attendre l'événement load pour ne pas concurrencer le rendu initial
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
