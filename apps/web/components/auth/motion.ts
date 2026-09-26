/**
 * Mouvement des pages d'authentification.
 *
 * L'entrée initiale (panneau, carte, champs) est en CSS pur (auth.css,
 * `[data-reveal]`) : elle démarre au premier paint, sans attendre
 * l'hydratation, et survit sans JavaScript.
 *
 * anime.js n'intervient que pour les bascules APRÈS interaction (changement
 * d'onglet de rôle, passage e-mail → code, écran de succès) : chargé à la
 * demande, comme `components/home/reveal-compteurs.ts`. En
 * prefers-reduced-motion ou si le module ne charge pas, l'état final est
 * simplement posé — le contenu prime.
 */

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const DUREE_BASCULE_MS = 480;
const PAS_CASCADE_MS = 60;
const CASCADE_MAX_MS = 360;

type Anime = {
  animate: typeof import("animejs/animation").animate;
  ease: (t: number) => number;
};

let animePromise: Promise<Anime> | null = null;

/** Même courbe que --ease-out-soft dans auth.css. */
function chargerAnime(): Promise<Anime> {
  animePromise ??= Promise.all([import("animejs/animation"), import("animejs/easings/cubic-bezier")]).then(
    ([{ animate }, { cubicBezier }]) => ({ animate, ease: cubicBezier(0.22, 1, 0.36, 1) }),
  );
  return animePromise;
}

export function mouvementReduit(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** État final, quelle que soit la voie empruntée : on rend la main au CSS. */
function poser(el: HTMLElement) {
  el.style.removeProperty("opacity");
  el.style.removeProperty("transform");
  el.style.removeProperty("will-change");
}

/**
 * À chaque changement de `cle` (jamais au premier rendu), les éléments
 * `selecteur` du conteneur arrivent en cascade (fondu + 10 px). useLayoutEffect pose
 * l'état de départ avant le paint : pas d'image « finale puis cachée ».
 */
export function useAnimerBascule(
  ref: RefObject<HTMLElement | null>,
  cle: string | number | undefined,
  selecteur = "[data-swap]",
) {
  const premier = useRef(true);

  useLayoutEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    const root = ref.current;
    if (!root || cle === undefined || mouvementReduit()) return;

    const cibles = Array.from(root.querySelectorAll<HTMLElement>(selecteur));
    if (!cibles.length) return;

    cibles.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(10px)";
      el.style.willChange = "transform, opacity";
    });

    let arrete = false;
    const enCours = new Set<{ pause(): unknown }>();

    chargerAnime()
      .then(({ animate, ease }) => {
        if (arrete) return;
        cibles.forEach((el, i) => {
          const anim = animate(el, {
            opacity: [0, 1],
            translateY: [10, 0],
            duration: DUREE_BASCULE_MS,
            delay: Math.min(i * PAS_CASCADE_MS, CASCADE_MAX_MS),
            ease,
            onComplete: () => {
              enCours.delete(anim);
              poser(el);
            },
          });
          enCours.add(anim);
        });
      })
      .catch(() => cibles.forEach(poser));

    return () => {
      arrete = true;
      enCours.forEach((a) => a.pause());
      cibles.forEach(poser);
    };
  }, [cle, ref, selecteur]);
}

/**
 * Vrai pendant le premier rendu seulement. Sert à réserver l'entrée CSS
 * (`data-reveal`) aux éléments présents au chargement : ce qui apparaît après
 * une interaction passe par `useAnimerBascule`, sans double animation.
 */
export function usePremierRendu(): boolean {
  const premier = useRef(true);
  useEffect(() => {
    premier.current = false;
  }, []);
  return premier.current;
}
