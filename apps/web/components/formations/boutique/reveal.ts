/**
 * Révélations au défilement de la vitrine — même mécanique que l'accueil
 * (components/home/reveal-compteurs.ts) : anime.js chargé à la demande,
 * IntersectionObserver, cascade courte, transform/opacity seulement.
 *
 * Le HTML porte déjà le contenu ; sans JS ou en mouvement réduit, tout est
 * visible d'emblée (règles CSS dans boutique.css). Les éléments déjà révélés
 * (`.in`) sont ignorés : le hook peut être relancé après un filtrage sans
 * refaire bouger ce qui est déjà en place.
 */

const PAS_CASCADE_MS = 60;
const CASCADE_MAX_MS = 300;
const DUREE_MS = 600;
/* Délai maximal accordé au chargement d'anime.js avant d'afficher sans animer :
   le contenu prime, l'animation n'est qu'un agrément. */
const GRACE_MS = 300;

type Anime = {
  animate: typeof import("animejs/animation").animate;
  ease: (t: number) => number;
};

let animePromise: Promise<Anime> | null = null;

/** Même courbe que --nkb-ease. */
function chargerAnime(): Promise<Anime> {
  animePromise ??= Promise.all([import("animejs/animation"), import("animejs/easings/cubic-bezier")]).then(
    ([{ animate }, { cubicBezier }]) => ({ animate, ease: cubicBezier(0.22, 1, 0.36, 1) }),
  );
  return animePromise;
}

function poser(el: HTMLElement) {
  el.style.removeProperty("opacity");
  el.style.removeProperty("transform");
  el.style.removeProperty("will-change");
  el.classList.add("in", "settled");
}

export function mouvementReduit(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Au-delà de ce délai depuis l'arrivée sur la page, le filet CSS a déjà
   affiché les éléments : animer reviendrait à les cacher puis les refaire
   apparaître. Même valeur que dans boutique.css (2,5 s). */
const FILET_MS = 2500;

/**
 * @param forcer  vrai lors d'un refiltrage : de nouvelles cartes arrivent
 *                sous les yeux du visiteur, la cascade a du sens quel que
 *                soit le temps écoulé.
 */
export function observerReveals(root: HTMLElement, forcer = false): () => void {
  // Le JS prend la main : le filet CSS n'a plus lieu d'être.
  root.setAttribute("data-reveal-ready", "");
  const cibles = Array.from(root.querySelectorAll<HTMLElement>(".nkb-reveal:not(.in)"));
  if (!cibles.length) return () => {};
  const tard = !forcer && performance.now() > FILET_MS;
  if (tard || mouvementReduit() || !("IntersectionObserver" in window)) {
    cibles.forEach(poser);
    return () => {};
  }

  let arrete = false;
  const enCours = new Set<{ pause(): unknown }>();
  // Éléments dont l'animation a démarré : ceux-là seulement sont posés à
  // l'arrêt. Les autres restent cachés et seront observés au prochain appel.
  const demarres = new Set<HTMLElement>();
  // Préchargement : la bibliothèque est en général prête avant le premier
  // élément visible ; sinon la course ci-dessous affiche sans attendre.
  void chargerAnime().catch(() => null);

  const io = new IntersectionObserver(
    (entrees) => {
      const visibles = entrees.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      if (!visibles.length) return;
      visibles.forEach((el) => io.unobserve(el));

      Promise.race([chargerAnime(), new Promise<null>((r) => setTimeout(() => r(null), GRACE_MS))])
        .then((anime) => {
          if (arrete) return;
          if (!anime) {
            // anime.js pas encore là (chargement lent) : on affiche, sans cascade.
            visibles.forEach(poser);
            return;
          }
          const { animate, ease } = anime;
          visibles.forEach((el, i) => {
            demarres.add(el);
            el.style.willChange = "transform, opacity";
            const anim = animate(el, {
              opacity: [0, 1],
              translateY: [24, 0],
              duration: DUREE_MS,
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
        // anime.js indisponible (réseau) : le contenu prime, on affiche.
        .catch(() => visibles.forEach(poser));
    },
    { threshold: 0.1 },
  );
  cibles.forEach((el) => io.observe(el));

  return () => {
    arrete = true;
    io.disconnect();
    // Une animation interrompue ne doit pas laisser une carte à demi visible.
    enCours.forEach((a) => a.pause());
    demarres.forEach((el) => {
      if (!el.classList.contains("in")) poser(el);
    });
  };
}
