import { useEffect, useRef, useState } from "react";

export type Phase = "closed" | "open" | "closing";

/**
 * Garde un panneau monté le temps de son animation de sortie.
 *
 * `open` porte l'intention ; la phase « closing » laisse le CSS jouer la
 * fermeture (plus courte que l'ouverture) avant le démontage. Sans ça, le
 * panneau disparaîtrait d'un coup, ce qui lit comme un bug.
 */
export function usePresence(open: boolean, exitMs: number): Phase {
  const [closing, setClosing] = useState(false);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      setClosing(false);
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    setClosing(true);
    const t = setTimeout(() => setClosing(false), exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);

  return open ? "open" : closing ? "closing" : "closed";
}

/** Vrai si l'utilisateur demande moins de mouvement (lu à l'appel, côté client). */
export function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * `will-change` posé juste avant l'animation d'un panneau, retiré à la fin
 * (animationend du panneau lui-même, pas de ses enfants en cascade).
 */
export function useWillChange(phase: Phase) {
  const [hot, setHot] = useState(false);
  useEffect(() => {
    if (phase !== "closed") setHot(true);
  }, [phase]);
  const style = hot ? ({ willChange: "transform, opacity" } as const) : undefined;
  const onAnimationEnd = (e: React.AnimationEvent<HTMLElement>) => {
    if (e.target === e.currentTarget) setHot(false);
  };
  return { style, onAnimationEnd };
}
