import Link from "next/link";
import type { ReactNode } from "react";
import { inter } from "@/lib/fonts";
import { CoquePublique } from "./CoquePublique";

function Marque() {
  return (
    <>
      <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect width="36" height="36" rx="10" fill="#006e2f" />
        <path d="M11 26V10h3l7 10.5V10h3v16h-3L14 15.5V26h-3z" fill="white" />
      </svg>
      <span>Novakou</span>
    </>
  );
}

/**
 * Coque des pages rendues hors du groupe (formations) — 404 racine,
 * maintenance : pas de barre de navigation ni de pied global, donc une
 * marque en haut, le contenu centré sur la hauteur et un pied minimal.
 * `lienAccueil={false}` quand l'accueil n'est pas joignable (maintenance).
 */
export function PageEtat({
  children,
  pied,
  lienAccueil = true,
}: {
  children: ReactNode;
  pied?: ReactNode;
  lienAccueil?: boolean;
}) {
  return (
    <CoquePublique className={`${inter.variable} nkp-etat`}>
      <div className="nkp-etat__barre">
        {lienAccueil ? (
          <Link href="/" className="nkp-etat__logo" aria-label="Novakou — accueil">
            <Marque />
          </Link>
        ) : (
          <span className="nkp-etat__logo">
            <Marque />
          </span>
        )}
      </div>
      {/* Pas de <main> ici : le layout racine en fournit déjà un (#main-content). */}
      <div className="nkp-etat__main">{children}</div>
      {pied && <footer className="nkp-etat__pied">{pied}</footer>}
    </CoquePublique>
  );
}
