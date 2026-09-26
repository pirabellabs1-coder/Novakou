"use client";

import { useId, useState } from "react";
import { formaterNombre } from "@/components/home/reveal-compteurs";

const TAUX = 0.1;

/**
 * Simulateur de la page Tarifs : un curseur (prix de vente), deux sorties
 * (part du vendeur à 90 %, commission plateforme à 10 %). Seul îlot client de
 * la page ; le formatage passe par formaterNombre (espaces fines identiques
 * serveur/navigateur, pas de décalage d'hydratation).
 */
export function SimulateurCommission() {
  const [prix, setPrix] = useState(50000);
  const id = useId();
  const commission = Math.round(prix * TAUX);
  const net = prix - commission;

  return (
    <div className="nkp-core nkp-core--pad">
      <div className="nkp-sim-row">
        <div className="top">
          <label htmlFor={`${id}-prix`}>Prix de vente</label>
          <span className="val" aria-live="off">
            {formaterNombre(prix)} FCFA
          </span>
        </div>
        <input
          id={`${id}-prix`}
          type="range"
          className="nkp-range"
          min={5000}
          max={500000}
          step={5000}
          value={prix}
          onChange={(e) => setPrix(Number(e.target.value))}
          aria-valuetext={`${formaterNombre(prix)} FCFA`}
        />
        <div className="bounds">
          <span>5 000 F</span>
          <span>500 000 F</span>
        </div>
      </div>
      <div className="nkp-sim-out" aria-live="polite">
        <div className="lbl">Votre revenu net par vente</div>
        <div className="big">{formaterNombre(net)} FCFA</div>
        <div className="net">
          Commission plateforme : <b>{formaterNombre(commission)} FCFA</b> · 10 % fixe, tout compris.
        </div>
      </div>
    </div>
  );
}
