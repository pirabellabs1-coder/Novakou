"use client";

import { useId, useState, type ReactNode } from "react";
import { Depliant } from "./Depliant";

export type ElementAccordeon = { q: string; a: ReactNode };

/**
 * FAQ en accordéons : un seul ouvert à la fois, état exposé via
 * aria-expanded / aria-controls, panneau animé en grid-template-rows
 * (0fr → 1fr, public.css). Le panneau fermé est `inert` : invisible ET
 * hors de la tabulation, sans `display:none` qui casserait la transition.
 *
 * `visibles` (facultatif) : au-delà de ce rang, les questions passent dans
 * une zone « Plus de questions » repliée — toujours dans le DOM (JSON-LD,
 * indexation), un seul accordéon ouvert à la fois sur l'ensemble.
 */
export function Accordeon({
  items,
  ouvertParDefaut = null,
  className = "",
  visibles,
  libelleSuite = "Plus de questions",
}: {
  items: ElementAccordeon[];
  ouvertParDefaut?: number | null;
  className?: string;
  visibles?: number;
  libelleSuite?: string;
}) {
  const [ouvert, setOuvert] = useState<number | null>(ouvertParDefaut);
  const base = useId();
  const coupe = visibles !== undefined && visibles >= 0 && visibles < items.length ? visibles : items.length;

  function rendre(item: ElementAccordeon, i: number) {
    const estOuvert = ouvert === i;
    const idQ = `${base}-q-${i}`;
    const idA = `${base}-a-${i}`;
    return (
      <div key={idQ} className={`nkp-faq__item${estOuvert ? " is-open" : ""}`}>
        <h3 className="m-0">
          <button
            type="button"
            id={idQ}
            className="nkp-faq__q"
            aria-expanded={estOuvert}
            aria-controls={idA}
            onClick={() => setOuvert(estOuvert ? null : i)}
          >
            {item.q}
            <span className="nkp-faq__ic" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </button>
        </h3>
        <div id={idA} role="region" aria-labelledby={idQ} className="nkp-faq__a" inert={!estOuvert}>
          <div>{typeof item.a === "string" ? <p>{item.a}</p> : <div className="nkp-faq__body">{item.a}</div>}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`nkp-faq ${className}`.trim()}>
      {items.slice(0, coupe).map((item, i) => rendre(item, i))}
      {coupe < items.length && (
        <Depliant libelle={`${libelleSuite} (${items.length - coupe})`} libelleOuvert="Moins de questions" className="nkp-faq__suite">
          <div className="nkp-faq__reste">{items.slice(coupe).map((item, j) => rendre(item, coupe + j))}</div>
        </Depliant>
      )}
    </div>
  );
}
