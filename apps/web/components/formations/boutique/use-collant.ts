import { useEffect, useRef, useState } from "react";

/**
 * Barre « collante » sans `position: sticky`.
 *
 * Les adresses courtes (`/<boutique>`) sont rendues sous `MainWithChrome`,
 * dont le `overflow-x: hidden` fait du <main> un conteneur de défilement :
 * `sticky` y est sans effet (mesuré : le menu partait avec la page). On
 * observe donc un témoin placé juste au-dessus de la barre ; quand il passe
 * sous le bord haut, la barre devient `fixed` et son emplacement garde sa
 * hauteur (aucun saut de mise en page). Zéro écouteur scroll.
 */
export function useCollant<T extends HTMLElement>(decalageHaut: number) {
  const temoinRef = useRef<HTMLDivElement | null>(null);
  const barreRef = useRef<T | null>(null);
  const [colle, setColle] = useState(false);
  const [hauteur, setHauteur] = useState(0);

  useEffect(() => {
    const temoin = temoinRef.current;
    const barre = barreRef.current;
    if (!temoin || !barre || !("IntersectionObserver" in window)) return;

    // Hauteur réservée à l'emplacement, recalculée si la barre change de
    // taille (chips qui passent à la ligne, redimensionnement).
    const ro = new ResizeObserver(([e]) => setHauteur(Math.ceil(e.contentRect.height)));
    ro.observe(barre);

    const io = new IntersectionObserver(
      ([e]) => setColle(!e.isIntersecting && e.boundingClientRect.top < decalageHaut),
      { rootMargin: `-${decalageHaut}px 0px 0px 0px`, threshold: 0 },
    );
    io.observe(temoin);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [decalageHaut]);

  return { temoinRef, barreRef, colle, hauteur };
}
