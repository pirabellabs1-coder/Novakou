/**
 * Révélations au défilement et compteurs numériques de l'accueil — anime.js.
 *
 * anime.js est chargé à la demande (sous-chemins : ni draggable, ni svg, ni
 * texte), après le montage, et seulement s'il y a quelque chose à animer.
 * Tout est additif : le HTML porte déjà le contenu et les valeurs finales.
 * Sans JS, `<noscript>` (page.tsx) affiche les `.reveal` ; en
 * prefers-reduced-motion, on pose l'état final sans bouger.
 *
 * - `observerReveals` : IntersectionObserver sur `.reveal` ; les éléments qui
 *   entrent dans la même salve (une rangée de cartes) arrivent en cascade
 *   (stagger). Transform et opacity uniquement ; `will-change` posé juste
 *   avant, retiré à la fin, styles inline nettoyés pour rendre la main au CSS.
 * - `animerCompteurs` : les `[data-count]` comptent jusqu'à leur valeur quand
 *   ils deviennent visibles.
 */

const PAS_CASCADE_MS = 70;
const CASCADE_MAX_MS = 350;
const DUREE_REVEAL_MS = 700;
const DUREE_COMPTEUR_MS = 1300;

type Anime = {
  animate: typeof import("animejs/animation").animate;
  ease: (t: number) => number;
};

let animePromise: Promise<Anime> | null = null;

/** Même courbe que --ease-out-soft dans home.css. */
function chargerAnime(): Promise<Anime> {
  animePromise ??= Promise.all([import("animejs/animation"), import("animejs/easings/cubic-bezier")]).then(
    ([{ animate }, { cubicBezier }]) => ({ animate, ease: cubicBezier(0.22, 1, 0.36, 1) }),
  );
  return animePromise;
}

/** « 412000 » → « 412 000 », « 2.9 » (1 décimale) → « 2,9 ». */
export function formaterNombre(n: number, decimales = 0): string {
  const [entier, fraction] = n.toFixed(decimales).split(".");
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return fraction ? `${groupe},${fraction}` : groupe;
}

/** État final d'un `.reveal`, quelle que soit la voie empruntée. */
function poser(el: HTMLElement) {
  el.style.removeProperty("opacity");
  el.style.removeProperty("transform");
  el.style.removeProperty("will-change");
  el.classList.add("in", "settled");
}

export function observerReveals(root: HTMLElement, mouvementReduit: boolean): () => void {
  const cibles = root.querySelectorAll<HTMLElement>(".reveal");
  if (!cibles.length) return () => {};
  if (mouvementReduit || !("IntersectionObserver" in window)) {
    cibles.forEach(poser);
    return () => {};
  }

  let arrete = false;
  const enCours = new Set<{ pause(): unknown }>();

  const io = new IntersectionObserver(
    (entrees) => {
      const visibles = entrees.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      if (!visibles.length) return;
      visibles.forEach((el) => io.unobserve(el));

      chargerAnime()
        .then(({ animate, ease }) => {
          if (arrete) return;
          visibles.forEach((el, i) => {
            el.style.willChange = "transform, opacity";
            const anim = animate(el, {
              opacity: [0, 1],
              translateY: [24, 0],
              duration: DUREE_REVEAL_MS,
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
    enCours.forEach((a) => a.pause());
  };
}

export function animerCompteurs(root: HTMLElement, mouvementReduit: boolean): () => void {
  const cibles = root.querySelectorAll<HTMLElement>("[data-count]");
  if (!cibles.length || mouvementReduit || !("IntersectionObserver" in window)) return () => {};

  let arrete = false;
  const enCours = new Set<{ pause(): unknown }>();

  const io = new IntersectionObserver(
    (entrees) => {
      const visibles = entrees.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      if (!visibles.length) return;
      visibles.forEach((el) => io.unobserve(el));

      chargerAnime()
        .then(({ animate, ease }) => {
          if (arrete) return;
          visibles.forEach((el) => {
            const cible = Number(el.dataset.count);
            if (!Number.isFinite(cible)) return;
            const decimales = Number(el.dataset.decimals ?? 0);
            const suffixe = el.dataset.suffix ?? "";
            const valeur = { v: 0 };
            const anim = animate(valeur, {
              v: cible,
              duration: DUREE_COMPTEUR_MS,
              ease,
              onUpdate: () => {
                el.textContent = formaterNombre(valeur.v, decimales) + suffixe;
              },
              onComplete: () => {
                enCours.delete(anim);
                el.textContent = formaterNombre(cible, decimales) + suffixe;
              },
            });
            enCours.add(anim);
          });
        })
        .catch(() => {
          // Le HTML porte déjà la valeur finale : rien à faire.
        });
    },
    { threshold: 0.4 },
  );
  cibles.forEach((el) => io.observe(el));

  return () => {
    arrete = true;
    io.disconnect();
    enCours.forEach((a) => a.pause());
  };
}
