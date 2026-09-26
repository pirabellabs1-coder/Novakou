import { Check, X } from "lucide-react";

export interface EtapeAchat {
  libelle: string;
  detail?: string;
}

/**
 * Indicateur d'étapes du parcours d'achat. Purement visuel : la page dit
 * quelle étape est en cours, le composant ne décide de rien.
 *
 * `courante` = index de l'étape en cours ; au-delà du dernier index, toutes
 * les étapes sont terminées. `echec` marque l'étape en cours comme ratée.
 * Styles dans achat.css (préfixe nka-steps).
 */
export function EtapesAchat({
  etapes,
  courante,
  vertical = false,
  echec = false,
  libelle = "Étapes de la commande",
  className = "",
}: {
  etapes: EtapeAchat[];
  courante: number;
  vertical?: boolean;
  echec?: boolean;
  libelle?: string;
  className?: string;
}) {
  return (
    <ol className={`nka-steps ${vertical ? "nka-steps--v" : ""} ${className}`} aria-label={libelle}>
      {etapes.map((e, i) => {
        const etat = i < courante ? "done" : i === courante ? (echec ? "fail" : "current") : "todo";
        return (
          <li key={e.libelle} className="nka-steps__item" data-etat={etat} aria-current={i === courante ? "step" : undefined}>
            <span className="nka-steps__dot" aria-hidden="true">
              {etat === "done" ? <Check strokeWidth={3} /> : etat === "fail" ? <X strokeWidth={3} /> : i + 1}
            </span>
            <span className="nka-steps__txt">
              <span className="nka-steps__label">
                {e.libelle}
                <span className="sr-only">
                  {etat === "done" ? " — terminée" : etat === "current" ? " — en cours" : etat === "fail" ? " — non aboutie" : ""}
                </span>
              </span>
              {e.detail && <span className="nka-steps__detail">{e.detail}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
