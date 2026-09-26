"use client";

import { useState, type CSSProperties } from "react";
import { ArrowLeft, ChevronDown, Search, X } from "lucide-react";
import { AIBuyerSearch } from "@/components/formations/AIBuyerSearch";
import type { CategoryMeta } from "./types";

/** Rang dans la cascade d'entrée de l'en-tête (explorer.css, [data-monte]). */
function monte(i: number) {
  return { "data-monte": "", style: { "--i": i } as CSSProperties };
}

/** Au-delà, la rangée de chips défile et propose un bouton pour tout déplier. */
const SEUIL_DEPLIAGE = 8;

type Props = {
  nomCategorie: string | null;
  sousTitre: string;
  recherche: string;
  onRecherche: (valeur: string) => void;
  onMotsClesIA: (motsCles: string) => void;
  categories: CategoryMeta[];
  categorieActive: string | null;
  onCategorie: (slug: string | null) => void;
};

export function EnTeteExplorer({
  nomCategorie,
  sousTitre,
  recherche,
  onRecherche,
  onMotsClesIA,
  categories,
  categorieActive,
  onCategorie,
}: Props) {
  const [depliees, setDepliees] = useState(false);

  return (
    <header className="nkx-hero bg-white pb-8 pt-12 md:pb-10 md:pt-20">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {nomCategorie ? (
            <>
              <button
                {...monte(0)}
                type="button"
                onClick={() => onCategorie(null)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#006E2F] transition-colors hover:bg-[#F0F6F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006E2F]"
              >
                <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
                Toutes les catégories
              </button>
              <h1 {...monte(1)} className="nkx-h1">
                {nomCategorie}
              </h1>
            </>
          ) : (
            <>
              <p {...monte(0)} className="nkx-eyebrow">
                Marketplace Novakou
              </p>
              <h1 {...monte(1)} className="nkx-h1">
                Explorez nos formations <span className="text-[#006E2F]">&amp; produits digitaux</span>
              </h1>
            </>
          )}
          <p {...monte(2)} className="mx-auto mt-4 max-w-xl text-base text-[#5C6B62] tabular-nums md:text-lg">
            {sousTitre}
          </p>

          <form
            {...monte(3)}
            role="search"
            className="relative mx-auto mt-8 max-w-2xl"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="nkx-recherche" className="sr-only">
              Rechercher une formation ou un produit
            </label>
            {/* z-[1] : le champ (backdrop-filter) se peint au-dessus des éléments
                absolus antérieurs et flouterait l'icône sans cela. */}
            <Search
              size={20}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-5 top-1/2 z-[1] -translate-y-1/2 text-[#5C6B62]"
              aria-hidden="true"
            />
            <input
              id="nkx-recherche"
              type="search"
              value={recherche}
              onChange={(e) => onRecherche(e.target.value)}
              placeholder="Rechercher une formation, un e-book, un template…"
              autoComplete="off"
              enterKeyHint="search"
              className="nkx-recherche"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => onRecherche("")}
                aria-label="Effacer la recherche"
                className="nkx-disc nkx-disc--sm absolute right-3 top-1/2 z-[1] -translate-y-1/2"
              >
                <X size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )}
          </form>

          {/* Assistant d'achat IA — recherche en langage naturel, inchangé. */}
          <div {...monte(4)} className="mx-auto mt-4 max-w-2xl">
            <AIBuyerSearch onKeywords={onMotsClesIA} />
          </div>
        </div>

        {categories.length > 0 && (
          <nav {...monte(5)} aria-label="Catégories" className="mt-8 md:mt-10">
            <div className={`nkx-chips ${depliees ? "is-open" : ""}`}>
              <button type="button" className="nkx-chip" aria-pressed={!categorieActive} onClick={() => onCategorie(null)}>
                <span>Tout</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  className="nkx-chip"
                  aria-pressed={categorieActive === c.slug}
                  onClick={() => onCategorie(categorieActive === c.slug ? null : c.slug)}
                  title={c.name}
                >
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
            {categories.length > SEUIL_DEPLIAGE && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  aria-expanded={depliees}
                  onClick={() => setDepliees((v) => !v)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-bold text-[#006E2F] transition-colors hover:bg-[#F0F6F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006E2F]"
                >
                  {depliees ? "Réduire" : `Toutes les catégories (${categories.length})`}
                  <ChevronDown
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={`transition-transform duration-300 ${depliees ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
