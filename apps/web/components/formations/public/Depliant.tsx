"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Ancre courante, décodée ; une URL malformée ne doit pas faire tomber la page. */
function ancreCourante(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}

/**
 * Zone repliable « Voir les N autres… » : un bouton (aria-expanded /
 * aria-controls) puis un panneau animé en grid-template-rows 0fr → 1fr
 * (public.css, `.nkp-more`), `inert` tant qu'il est fermé — même mécanique
 * que l'Accordeon. Les enfants restent des Server Components.
 *
 * S'ouvre seul quand `location.hash` vise l'une des `ancres` (cartes
 * voisines dont le détail vit ici) ou un élément du panneau : un lien du
 * méga-menu ne doit jamais aboutir sur du contenu replié.
 */
export function Depliant({
  libelle,
  libelleOuvert = "Masquer",
  detail,
  ancres = [],
  className = "",
  classeBouton = "",
  children,
}: {
  libelle: ReactNode;
  libelleOuvert?: ReactNode;
  /** Sous-ligne du bouton (ex. les rubriques repliées). */
  detail?: ReactNode;
  ancres?: string[];
  className?: string;
  classeBouton?: string;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const idPanneau = useId();
  const refPanneau = useRef<HTMLDivElement>(null);
  // Chaîne plutôt que tableau : dépendance stable, sinon l'effet rouvrirait la zone juste après que l'utilisateur l'a fermée.
  const cleAncres = ancres.join(" ");

  useEffect(() => {
    const ids = cleAncres ? cleAncres.split(" ") : [];
    function suivreAncre() {
      const cible = ancreCourante();
      if (!cible) return;
      const el = document.getElementById(cible);
      if (ids.includes(cible) || (el && refPanneau.current?.contains(el))) setOuvert(true);
    }
    suivreAncre();
    window.addEventListener("hashchange", suivreAncre);
    return () => window.removeEventListener("hashchange", suivreAncre);
  }, [cleAncres]);

  return (
    <div className={`nkp-more${ouvert ? " is-open" : ""} ${className}`.trim()}>
      <button
        type="button"
        className={`nkp-more__btn ${classeBouton}`.trim()}
        aria-expanded={ouvert}
        aria-controls={idPanneau}
        onClick={() => setOuvert((o) => !o)}
      >
        <span className="nkp-more__txt">
          <span className="nkp-more__lbl">{ouvert ? libelleOuvert : libelle}</span>
          {detail && <span className="nkp-more__detail">{detail}</span>}
        </span>
        <span className="nkp-more__ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div id={idPanneau} ref={refPanneau} className="nkp-more__panel" inert={!ouvert}>
        <div>
          <div className="nkp-more__body">{children}</div>
        </div>
      </div>
    </div>
  );
}
