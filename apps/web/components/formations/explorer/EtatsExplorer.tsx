"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Loader2, PlusCircle, RotateCcw, SearchX } from "lucide-react";
import { CarteArticleSquelette } from "./CarteArticle";

/** Grille de squelettes au gabarit des cartes (chargement initial). */
export function GrilleSquelette({ nb = 9 }: { nb?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3" aria-hidden="true" data-testid="grille-squelette">
      {Array.from({ length: nb }, (_, i) => (
        <CarteArticleSquelette key={i} />
      ))}
    </div>
  );
}

function CadreEtat({ role, children }: { role: "status" | "alert"; children: ReactNode }) {
  return (
    <div className="nkx-card mx-auto max-w-2xl" role={role}>
      <div className="nkx-card__core px-6 py-16 text-center md:py-20">{children}</div>
    </div>
  );
}

function Pictogramme({ children }: { children: ReactNode }) {
  return <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#F0F6F2] text-[#006E2F]">{children}</div>;
}

/** Aucun résultat — ou catalogue encore vide. Toujours une action pour repartir. */
export function EtatVide({
  catalogueVide,
  recherche,
  onEffacer,
}: {
  catalogueVide: boolean;
  recherche: string;
  onEffacer: () => void;
}) {
  return (
    <CadreEtat role="status">
      <Pictogramme>
        <SearchX size={30} strokeWidth={1.5} aria-hidden="true" />
      </Pictogramme>
      <h2 className="text-lg font-extrabold text-[#0E1512]">{catalogueVide ? "Le catalogue arrive" : "Aucun résultat"}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5C6B62]">
        {catalogueVide ? (
          "Les premiers produits sont en préparation. Soyez le premier créateur à publier."
        ) : recherche ? (
          <>
            Rien ne correspond à « <span className="font-semibold text-[#0E1512]">{recherche}</span> » avec ces filtres.
            Essayez un autre mot ou élargissez la recherche.
          </>
        ) : (
          "Aucun produit ne correspond à ces filtres. Élargissez la sélection pour retrouver le catalogue."
        )}
      </p>
      <div className="mt-6 flex justify-center">
        {catalogueVide ? (
          <Link href="/vendeur/produits/creer" className="nkx-btn nkx-btn--primary">
            <PlusCircle size={16} strokeWidth={2} aria-hidden="true" />
            Publier un produit
            <span className="nkx-btn__ico" aria-hidden="true">
              <ArrowRight strokeWidth={2.2} />
            </span>
          </Link>
        ) : (
          <button type="button" onClick={onEffacer} className="nkx-btn nkx-btn--primary">
            <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
            Effacer les filtres
          </button>
        )}
      </div>
    </CadreEtat>
  );
}

/** Le catalogue n'a pas pu être chargé : on le dit et on propose de réessayer. */
export function EtatErreur({ onReessayer, enCours }: { onReessayer: () => void; enCours: boolean }) {
  return (
    <CadreEtat role="alert">
      <Pictogramme>
        <AlertTriangle size={30} strokeWidth={1.5} aria-hidden="true" />
      </Pictogramme>
      <h2 className="text-lg font-extrabold text-[#0E1512]">Le catalogue n&apos;a pas pu être chargé</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5C6B62]">
        Vérifiez votre connexion, puis réessayez. Si le problème persiste, revenez dans quelques minutes.
      </p>
      <div className="mt-6 flex justify-center">
        <button type="button" onClick={onReessayer} disabled={enCours} className="nkx-btn nkx-btn--primary">
          {enCours ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
          )}
          {enCours ? "Nouvelle tentative…" : "Réessayer"}
        </button>
      </div>
    </CadreEtat>
  );
}
