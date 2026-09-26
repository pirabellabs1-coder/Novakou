"use client";

import { useId, useState, type ReactNode } from "react";

export type ElementAccordeon = { q: string; a: ReactNode };

/**
 * FAQ en accordéons : un seul ouvert à la fois, état exposé via
 * aria-expanded / aria-controls, panneau animé en grid-template-rows
 * (0fr → 1fr, public.css). Le panneau fermé est `inert` : invisible ET
 * hors de la tabulation, sans `display:none` qui casserait la transition.
 */
export function Accordeon({ items, ouvertParDefaut = null, className = "" }: { items: ElementAccordeon[]; ouvertParDefaut?: number | null; className?: string }) {
  const [ouvert, setOuvert] = useState<number | null>(ouvertParDefaut);
  const base = useId();

  return (
    <div className={`nkp-faq ${className}`.trim()}>
      {items.map((item, i) => {
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
      })}
    </div>
  );
}
