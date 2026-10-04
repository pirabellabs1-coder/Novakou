"use client";

import { useEffect, useRef } from "react";

/**
 * Appelle `fn` toutes les `intervalleMs`, UNIQUEMENT quand l'onglet est
 * visible — et une fois au retour sur l'onglet si le dernier passage est plus
 * vieux que l'intervalle.
 *
 * POURQUOI : chaque appel est une exécution de fonction Vercel (plafond de
 * l'offre gratuite : 1 million par mois). Un `setInterval` classique continue
 * de tourner dans un onglet oublié en arrière-plan : un tableau de bord ouvert
 * toute la journée coûtait des centaines d'appels pour personne.
 */
export function useIntervalleVisible(fn: () => void, intervalleMs: number) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let dernier = Date.now();
    const executer = () => {
      dernier = Date.now();
      fnRef.current();
    };
    const id = setInterval(() => {
      if (document.visibilityState === "visible") executer();
    }, intervalleMs);
    const auRetour = () => {
      if (document.visibilityState === "visible" && Date.now() - dernier >= intervalleMs) executer();
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [intervalleMs]);
}
