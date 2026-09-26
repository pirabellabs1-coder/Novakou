import { useEffect, useRef, useState } from "react";

/**
 * « A-t-on défilé ? » sans écouteur scroll : un témoin de `offset` px de haut
 * posé en haut du document, observé par IntersectionObserver. Tant qu'un
 * morceau du témoin est visible, on est en haut ; dès qu'il est passé sous le
 * bord, la barre se compacte. Zéro travail par image.
 *
 * (Un témoin d'un pixel combiné à un `rootMargin` négatif était hors cadre
 * dès le chargement : la barre naissait compactée.)
 */
export function useScrolled(offset = 24) {
  const sentinelRef = useRef<HTMLSpanElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { scrolled, sentinelRef, sentinelStyle: { height: offset } as const };
}
