import type { CSSProperties, ReactNode } from "react";
import { Check } from "lucide-react";

/** Rang dans la cascade d'entrée (public.css, `[data-monte]`). */
export function monte(i: number) {
  return { "data-monte": "", style: { "--i": i } as CSSProperties };
}

/**
 * En-tête commun des pages publiques : eyebrow en pilule, titre Sora
 * fluide (un seul h1 par page), sous-titre, CTA principal + secondaire,
 * puis une rangée de garanties et d'éventuels enfants (recherche, chips).
 * Fond : trame fine masquée + halo vert, comme le hero de l'accueil.
 *
 * `avant` (fil d'Ariane…) précède l'étiquette ; `infos` (date, durée de
 * lecture, auteur) suit le sous-titre. Tous deux facultatifs : sans eux,
 * le rendu est identique à l'existant.
 */
export function EnTetePage({
  eyebrow,
  titre,
  sousTitre,
  actions,
  meta,
  children,
  align = "center",
  avant,
  infos,
}: {
  eyebrow: string;
  titre: ReactNode;
  sousTitre?: ReactNode;
  actions?: ReactNode;
  meta?: string[];
  children?: ReactNode;
  align?: "center" | "left";
  avant?: ReactNode;
  infos?: ReactNode;
}) {
  let rang = 0;
  return (
    <header className={`nkp-hero${align === "left" ? " nkp-hero--left" : ""}`}>
      <div className="nkp-wrap">
        <div className="nkp-hero__inner">
          {avant && (
            <div {...monte(rang++)} className="nkp-avant">
              {avant}
            </div>
          )}
          <span {...monte(rang++)} className="nkp-tag">
            {eyebrow}
          </span>
          <h1 {...monte(rang++)} className="nkp-h1">
            {titre}
          </h1>
          {sousTitre && (
            <p {...monte(rang++)} className="nkp-sub">
              {sousTitre}
            </p>
          )}
          {infos && (
            <div {...monte(rang++)} className="nkp-infos">
              {infos}
            </div>
          )}
          {actions && (
            <div {...monte(rang++)} className="nkp-actions">
              {actions}
            </div>
          )}
          {meta && meta.length > 0 && (
            <div {...monte(rang++)} className="nkp-meta">
              {meta.map((m) => (
                <span key={m}>
                  <Check strokeWidth={2.4} aria-hidden="true" />
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
        {children && (
          <div {...monte(rang++)} className="mt-9">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
