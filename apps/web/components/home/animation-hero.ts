/**
 * Hero de l'accueil : parallax souris de la maquette.
 *
 * L'ENTRÉE du hero (étiquette, titre mot à mot, sous-titre, boutons, maquette
 * et son contenu) est en CSS pur, dans home.css (@keyframes nk-mot, nk-monte…),
 * lancée dès le premier paint : le texte principal n'attend jamais le
 * JavaScript, le LCP n'en dépend pas, et sans JS ou avec
 * prefers-reduced-motion le contenu est là. Ici ne reste que ce qui exige un
 * pointeur : la maquette suit légèrement la souris, en `transform` seulement.
 */

/** Amplitude du parallax (px), volontairement discrète. */
const PARALLAX_X = 18;
const PARALLAX_Y = 12;

/**
 * Durée de l'entrée CSS de la coque (.dash-shell : .55 s de délai + .9 s).
 * Tant qu'elle joue, l'animation CSS prime sur le transform inline : on
 * attend sa fin avant de suivre la souris, sinon le premier mouvement saute.
 */
const FIN_ENTREE_MS = 1600;

/** Branche le parallax. Renvoie la fonction de nettoyage à appeler au démontage. */
export function lancerHero(root: HTMLElement, mouvementReduit: boolean): () => void {
  const hero = root.querySelector<HTMLElement>(".hero");
  const maquette = hero?.querySelector<HTMLElement>(".dash-shell");
  if (!hero || !maquette || mouvementReduit) return () => {};
  // Pointeur fin uniquement : rien sur tactile.
  if (!window.matchMedia("(pointer: fine)").matches) return () => {};

  let pret = false;
  const attente = window.setTimeout(() => {
    pret = true;
  }, FIN_ENTREE_MS);

  let cibleX = 0;
  let cibleY = 0;
  let posX = 0;
  let posY = 0;
  let raf = 0;
  let survol = false;

  // Une seule boucle rAF, qui s'arrête d'elle-même au repos.
  const boucle = () => {
    posX += (cibleX - posX) * 0.12;
    posY += (cibleY - posY) * 0.12;
    maquette.style.transform = `translate3d(${posX.toFixed(2)}px, ${posY.toFixed(2)}px, 0)`;
    if (Math.abs(cibleX - posX) > 0.05 || Math.abs(cibleY - posY) > 0.05) {
      raf = window.requestAnimationFrame(boucle);
      return;
    }
    raf = 0;
    if (!survol) {
      maquette.style.removeProperty("transform");
      maquette.style.removeProperty("will-change");
    }
  };
  const demarrer = () => {
    if (!raf) raf = window.requestAnimationFrame(boucle);
  };

  // Normalisé sur la fenêtre : aucune lecture de layout dans le handler.
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !pret) return;
    cibleX = (e.clientX / window.innerWidth - 0.5) * PARALLAX_X;
    cibleY = (e.clientY / window.innerHeight - 0.5) * PARALLAX_Y;
    demarrer();
  };
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    survol = true;
    maquette.style.willChange = "transform";
  };
  const onLeave = () => {
    survol = false;
    cibleX = 0;
    cibleY = 0;
    demarrer();
  };

  hero.addEventListener("pointermove", onMove, { passive: true });
  hero.addEventListener("pointerenter", onEnter);
  hero.addEventListener("pointerleave", onLeave);

  return () => {
    window.clearTimeout(attente);
    hero.removeEventListener("pointermove", onMove);
    hero.removeEventListener("pointerenter", onEnter);
    hero.removeEventListener("pointerleave", onLeave);
    if (raf) window.cancelAnimationFrame(raf);
    maquette.style.removeProperty("transform");
    maquette.style.removeProperty("will-change");
  };
}
