"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Lien d'exemple à copier (page Affiliation). L'état « Copié » est annoncé
 * via aria-live et retombe après 2,5 s ; le minuteur est nettoyé au démontage.
 */
export function CopierLien({ lien }: { lien: string }) {
  const [copie, setCopie] = useState(false);
  const [echec, setEchec] = useState(false);
  const minuteur = useRef<number | null>(null);

  useEffect(() => () => {
    if (minuteur.current) window.clearTimeout(minuteur.current);
  }, []);

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setEchec(false);
    } catch {
      setEchec(true);
    }
    if (minuteur.current) window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => {
      setCopie(false);
      setEchec(false);
    }, 2500);
  }

  return (
    <div>
      <div className="nkp-copy">
        <code>{lien}</code>
        <button type="button" onClick={copier} className="nkp-btn nkp-btn--white nkp-btn--sm" aria-label={copie ? "Lien copié" : "Copier le lien d'exemple"}>
          {copie ? <Check size={15} strokeWidth={2.4} aria-hidden="true" /> : <Copy size={15} strokeWidth={2} aria-hidden="true" />}
          <span translate="no">{copie ? "Copié" : "Copier"}</span>
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {copie ? "Lien copié dans le presse-papiers." : echec ? "La copie a échoué, sélectionnez le lien manuellement." : ""}
      </p>
      {echec && <p className="mt-2 text-[.8rem] text-[#f5c6b0]">La copie automatique a échoué : sélectionnez le lien et copiez-le manuellement.</p>}
    </div>
  );
}
