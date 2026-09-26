import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type Props = {
  href: string;
  children: ReactNode;
  variante?: "glass" | "primary" | "white";
  taille?: "sm" | "md" | "lg";
  /** Flèche dans son propre disque (« bouton dans le bouton »). */
  fleche?: boolean;
  bloc?: boolean;
  className?: string;
  ariaLabel?: string;
};

/**
 * Bouton verre des pages publiques (même langue que .btn-glass de l'accueil
 * et .nk-btn du menu). Rend un <Link> ; les mailto: passent par <a>.
 */
export function BoutonVerre({ href, children, variante = "glass", taille = "md", fleche = false, bloc = false, className = "", ariaLabel }: Props) {
  const classes = [
    "nkp-btn",
    variante !== "glass" && `nkp-btn--${variante}`,
    taille !== "md" && `nkp-btn--${taille}`,
    bloc && "nkp-btn--block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const contenu = (
    <>
      {children}
      {fleche && (
        <span className="nkp-btn__ico" aria-hidden="true">
          <ArrowRight strokeWidth={2.2} />
        </span>
      )}
    </>
  );

  if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {contenu}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {contenu}
    </Link>
  );
}

/** Icône « coche » des listes (décorative). */
export function Coche({ non = false }: { non?: boolean }) {
  return (
    <span className={`nkp-ck${non ? " nkp-ck--no" : ""}`} aria-hidden="true">
      {non ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </span>
  );
}
