"use client";

import { useEffect, type RefObject } from "react";
import { mouvementReduit, observerReveals } from "./reveal";

/**
 * Branche la révélation en cascade sur les `.nkx-reveal` d'un conteneur.
 * `cle` doit changer dès que la liste rendue change (filtre, page, données) :
 * on ré-observe alors les cartes fraîchement montées ; celles déjà révélées
 * (`.in`) sont ignorées.
 */
export function useReveal(root: RefObject<HTMLElement | null>, cle: string) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    return observerReveals(el, mouvementReduit());
  }, [root, cle]);
}
