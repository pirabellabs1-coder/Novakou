import type { ReactNode } from "react";

/**
 * Carte double-bezel d'une étape du formulaire d'achat (coordonnées, moyen
 * de paiement…). `id` est posé sur l'élément extérieur : c'est lui que la
 * page fait défiler quand un champ manque.
 *
 * `serre` : pour un contenu qui arrive déjà avec sa propre marge haute
 * (l'écran de paiement partagé), l'en-tête n'en ajoute pas.
 */
export function CarteEtape({
  id,
  numero,
  titre,
  sousTitre,
  serre = false,
  className = "",
  children,
}: {
  id?: string;
  numero?: number;
  titre: string;
  sousTitre?: ReactNode;
  serre?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`nka-bezel scroll-mt-6 ${className}`}>
      <div className="nka-bezel__core nka-etape">
        <header className={`nka-etape__head ${serre ? "nka-etape__head--flush" : ""}`}>
          {numero !== undefined && (
            <span className="nka-etape__num" aria-hidden="true">
              {numero}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="nka-h2">{titre}</h2>
            {sousTitre && <p className="nka-etape__sub">{sousTitre}</p>}
          </div>
        </header>
        {children}
      </div>
    </section>
  );
}
