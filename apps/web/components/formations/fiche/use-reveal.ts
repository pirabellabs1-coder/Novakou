"use client";

import { useEffect, type RefObject } from "react";
import { mouvementReduit, observerReveals } from "./reveal";

/**
 * Branche la révélation en cascade sur les `.nkf-reveal` d'une fiche.
 * `cle` doit changer quand la fiche est rendue (id de l'article chargé) : la
 * racine n'existe pas pendant le squelette, l'effet doit repasser une fois le
 * contenu monté.
 */
export function useRevealFiche(root: RefObject<HTMLElement | null>, cle: string) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    return observerReveals(el, mouvementReduit());
  }, [root, cle]);
}
