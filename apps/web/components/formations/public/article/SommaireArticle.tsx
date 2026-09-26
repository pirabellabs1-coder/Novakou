"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type EntreeSommaire = {
  /** Ancre de la section (id présent dans la page). */
  id: string;
  label: string;
  /** Numéro affiché (« 01 ») ; décoratif, masqué aux lecteurs d'écran. */
  n?: string;
};

/**
 * Sommaire des pages longues (guides, documents légaux, nouveautés).
 *
 * Desktop : colonne collante, lien de la section en cours marqué
 * `aria-current` (suivi par IntersectionObserver, aucun écouteur de
 * défilement). Téléphone : <details> natif, utilisable sans JS, refermé
 * après un choix. Les deux listes coexistent dans le HTML ; une seule est
 * affichée (display:none retire l'autre de l'arbre d'accessibilité).
 */
export function SommaireArticle({
  items,
  titre = "Sommaire",
  unite = "sections",
  bas,
}: {
  items: EntreeSommaire[];
  titre?: string;
  unite?: string;
  /** Liens sous le sommaire desktop (retour à l'index, autres documents). */
  bas?: ReactNode;
}) {
  const [actif, setActif] = useState<string | null>(null);
  const refMobile = useRef<HTMLDetailsElement>(null);
  // Chaîne plutôt que tableau : dépendance stable entre deux rendus.
  const cle = items.map((i) => i.id).join(" ");

  useEffect(() => {
    const ids = cle.split(" ").filter(Boolean);
    const cibles = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (!cibles.length || !("IntersectionObserver" in window)) return;

    // Zone de lecture : sous la barre de navigation, moitié haute de l'écran.
    // La première section (ordre du document) qui la traverse est « en cours ».
    const visibles = new Set<string>();
    const io = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) visibles.add(e.target.id);
          else visibles.delete(e.target.id);
        }
        const premier = ids.find((id) => visibles.has(id));
        if (premier) setActif(premier);
      },
      { rootMargin: "-104px 0px -55% 0px" },
    );
    cibles.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cle]);

  function choisir(id: string) {
    setActif(id);
    if (refMobile.current) refMobile.current.open = false;
  }

  const liste = (
    <ol className="nka-toc__list">
      {items.map((it) => (
        <li key={it.id}>
          <a
            href={`#${it.id}`}
            className="nka-toc__a"
            aria-current={actif === it.id ? "location" : undefined}
            onClick={() => choisir(it.id)}
          >
            {it.n && (
              <span className="nka-toc__n" aria-hidden="true">
                {it.n}
              </span>
            )}
            <span>{it.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav className="nka-toc" aria-label={titre}>
      <details className="nka-toc__m" ref={refMobile}>
        <summary>
          <span>
            <b>{titre}</b>
            <small>
              {items.length} {unite}
            </small>
          </span>
          <span className="nka-toc__chev" aria-hidden="true">
            <ChevronDown strokeWidth={2.2} />
          </span>
        </summary>
        {liste}
      </details>
      <div className="nka-toc__d">
        <p className="nka-toc__t">{titre}</p>
        <div className="nka-toc__prog" aria-hidden="true">
          <i />
        </div>
        {liste}
        {bas && <div className="nka-toc__bas">{bas}</div>}
      </div>
    </nav>
  );
}
