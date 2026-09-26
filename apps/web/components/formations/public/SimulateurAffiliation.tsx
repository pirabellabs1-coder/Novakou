"use client";

import { useId, useState } from "react";
import { formaterNombre } from "@/components/home/reveal-compteurs";

/**
 * Calculateur de gains de la page Affiliation : ventes par mois × prix
 * moyen × taux de commission. Seul îlot client de cette section.
 */
export function SimulateurAffiliation({ commissionPct }: { commissionPct: number }) {
  const [ventes, setVentes] = useState(10);
  const [prix, setPrix] = useState(45000);
  const id = useId();
  const gains = Math.round(ventes * prix * (commissionPct / 100));

  return (
    <div className="nkp-core nkp-core--pad">
      <div className="nkp-sim-row">
        <div className="top">
          <label htmlFor={`${id}-ventes`}>Ventes générées / mois</label>
          <span className="val">{ventes} ventes</span>
        </div>
        <input
          id={`${id}-ventes`}
          type="range"
          className="nkp-range"
          min={1}
          max={100}
          value={ventes}
          onChange={(e) => setVentes(Number(e.target.value))}
          aria-valuetext={`${ventes} ventes par mois`}
        />
        <div className="bounds">
          <span>1</span>
          <span>100</span>
        </div>
      </div>
      <div className="nkp-sim-row">
        <div className="top">
          <label htmlFor={`${id}-prix`}>Prix moyen des produits</label>
          <span className="val">{formaterNombre(prix)} FCFA</span>
        </div>
        <input
          id={`${id}-prix`}
          type="range"
          className="nkp-range"
          min={5000}
          max={200000}
          step={5000}
          value={prix}
          onChange={(e) => setPrix(Number(e.target.value))}
          aria-valuetext={`${formaterNombre(prix)} FCFA`}
        />
        <div className="bounds">
          <span>5 000</span>
          <span>200 000 FCFA</span>
        </div>
      </div>
      <div className="nkp-sim-out nkp-sim-out--dark" aria-live="polite">
        <div className="lbl">Vos gains estimés / mois</div>
        <div className="big">{formaterNombre(gains)} FCFA</div>
        <div className="net">
          {ventes} ventes × {formaterNombre(prix)} FCFA × {commissionPct} %
        </div>
      </div>
    </div>
  );
}
