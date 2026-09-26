"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { BoutonVerre } from "../BoutonVerre";

/**
 * « Cet article vous a-t-il aidé ? » — retour immédiat à l'écran
 * (aria-pressed + message dans une région role="status"). Aucun envoi :
 * il n'existe pas d'API de collecte, on ne prétend donc pas enregistrer.
 * Un « Pas vraiment » oriente vers le support.
 */
export function AvisArticle() {
  const [avis, setAvis] = useState<"oui" | "non" | null>(null);
  const id = useId();

  return (
    <div className="nka-avis nkp-card">
      <div className="nkp-card__core">
        <p id={id} className="nka-avis__t">
          Cet article vous a-t-il aidé ?
        </p>
        <div className="nka-avis__btns" role="group" aria-labelledby={id}>
          <button type="button" className="nka-avis__b" aria-pressed={avis === "oui"} onClick={() => setAvis("oui")}>
            <ThumbsUp strokeWidth={1.9} aria-hidden="true" />
            Oui, merci
          </button>
          <button type="button" className="nka-avis__b" aria-pressed={avis === "non"} onClick={() => setAvis("non")}>
            <ThumbsDown strokeWidth={1.9} aria-hidden="true" />
            Pas vraiment
          </button>
          <BoutonVerre href="/contact" variante="primary" taille="sm">
            <MessageSquare size={16} strokeWidth={2} aria-hidden="true" />
            Contacter le support
          </BoutonVerre>
        </div>
        <p className="nka-avis__msg" role="status">
          {avis === "oui" && "Merci pour votre retour."}
          {avis === "non" && (
            <>
              Merci. Dites-nous ce qui manque : <Link href="/contact">notre support vous répond sous 24 h</Link>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
