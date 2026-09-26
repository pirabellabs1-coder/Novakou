"use client";

import { useLayoutEffect, useRef } from "react";

const EASE = "cubic-bezier(.22,1,.36,1)";

/**
 * Fondu + montée de 8 px du contenu à chaque changement de route.
 *
 * WAAPI sur transform/opacity, sans remonter le sous-arbre : un `key`
 * sur le wrapper aurait réinitialisé l'état des layouts imbriqués à
 * chaque navigation. Rien au premier rendu (les pages ont déjà leurs
 * propres reveals) ni en prefers-reduced-motion.
 */
export function useRouteTransition<T extends HTMLElement>(pathname: string) {
  const ref = useRef<T>(null);
  const dernier = useRef(pathname);

  useLayoutEffect(() => {
    // Même route (strict mode, re-rendu) : rien à jouer.
    if (dernier.current === pathname) return;
    dernier.current = pathname;

    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const anim = el.animate(
      [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 300, easing: EASE },
    );
    return () => anim.cancel();
  }, [pathname]);

  return ref;
}
