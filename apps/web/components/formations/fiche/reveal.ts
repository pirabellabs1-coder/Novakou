/**
 * Révélation en cascade des blocs d'une fiche — anime.js à la demande.
 *
 * Même mécanique que la marketplace (components/formations/explorer/reveal.ts)
 * avec la classe `.nkf-reveal` et un seuil à 0 : une section très haute
 * (longue description) doit partir dès son premier pixel visible, pas après
 * 10 % de sa hauteur. anime.js n'est chargé (sous-chemins, pas le paquet
 * entier) qu'au premier élément visible. Le HTML porte déjà le contenu ; en
 * prefers-reduced-motion ou sans IntersectionObserver, on pose l'état final
 * sans bouger. Transform et opacity uniquement ; `will-change` posé juste
 * avant, retiré à la fin.
 */

const PAS_CASCADE_MS = 60;
const CASCADE_MAX_MS = 360;
const DUREE_MS = 550;

/** Classe portée par tout bloc à révéler (état initial dans fiche.css). */
export const CLASSE_REVEAL = "nkf-reveal";

type Anime = {
  animate: typeof import("animejs/animation").animate;
  ease: (t: number) => number;
};

let animePromise: Promise<Anime> | null = null;

/** Même courbe que --nkf-ease dans fiche.css. */
function chargerAnime(): Promise<Anime> {
  animePromise ??= Promise.all([import("animejs/animation"), import("animejs/easings/cubic-bezier")]).then(
    ([{ animate }, { cubicBezier }]) => ({ animate, ease: cubicBezier(0.22, 1, 0.36, 1) }),
  );
  return animePromise;
}

/** État final, quelle que soit la voie empruntée : on rend la main au CSS. */
function poser(el: HTMLElement) {
  el.style.removeProperty("opacity");
  el.style.removeProperty("transform");
  el.style.removeProperty("will-change");
  el.classList.add("in", "settled");
}

export function mouvementReduit(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Observe les `.nkf-reveal` pas encore révélés sous `root`. Ceux qui entrent
 * dans la même salve arrivent en cascade. Le nettoyage pose immédiatement les
 * éléments en cours pour ne jamais en laisser un caché.
 */
export function observerReveals(root: HTMLElement, reduit: boolean): () => void {
  const cibles = root.querySelectorAll<HTMLElement>(`.${CLASSE_REVEAL}:not(.in)`);
  if (!cibles.length) return () => {};
  if (reduit || !("IntersectionObserver" in window)) {
    cibles.forEach(poser);
    return () => {};
  }

  let arrete = false;
  const enCours = new Map<{ pause(): unknown }, HTMLElement>();

  const io = new IntersectionObserver(
    (entrees) => {
      const visibles = entrees.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      if (!visibles.length) return;
      visibles.forEach((el) => io.unobserve(el));

      chargerAnime()
        .then(({ animate, ease }) => {
          if (arrete) {
            visibles.forEach(poser);
            return;
          }
          visibles.forEach((el, i) => {
            el.style.willChange = "transform, opacity";
            const anim = animate(el, {
              opacity: [0, 1],
              translateY: [20, 0],
              duration: DUREE_MS,
              delay: Math.min(i * PAS_CASCADE_MS, CASCADE_MAX_MS),
              ease,
              onComplete: () => {
                enCours.delete(anim);
                poser(el);
              },
            });
            enCours.set(anim, el);
          });
        })
        // anime.js indisponible (réseau) : le contenu prime, on affiche.
        .catch(() => visibles.forEach(poser));
    },
    { threshold: 0, rootMargin: "0px 0px -8% 0px" },
  );
  cibles.forEach((el) => io.observe(el));

  return () => {
    arrete = true;
    io.disconnect();
    enCours.forEach((el, anim) => {
      anim.pause();
      poser(el);
    });
    enCours.clear();
  };
}
