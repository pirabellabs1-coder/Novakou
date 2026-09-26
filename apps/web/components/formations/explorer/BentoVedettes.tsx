"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EnTeteSection } from "./EnTeteSection";
import { LigneNote, PrixArticle, VignetteArticle } from "./CarteArticle";
import { hrefArticle, libelleType, sansHtml, trierVedettes, type Item } from "./types";

const NB_VEDETTES = 5;

/**
 * Mise en avant asymétrique (bento) : une grande carte éditoriale + jusqu'à
 * quatre petites. Sous trois articles, la section n'a pas lieu d'être.
 * Sur mobile, tout retombe en une colonne.
 */
export function BentoVedettes({ items }: { items: Item[] }) {
  const vedettes = trierVedettes(items).slice(0, NB_VEDETTES);
  if (vedettes.length < 3) return null;
  const [grande, ...petites] = vedettes;

  return (
    <section aria-labelledby="nkx-vedettes-titre" className="pb-14 md:pb-20">
      <EnTeteSection id="nkx-vedettes-titre" eyebrow="À la une" titre="Les produits qui se démarquent" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
        <CarteVedetteGrande item={grande} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-5 md:gap-5">
          {petites.map((it) => (
            <CarteVedettePetite key={`${it.kind}-${it.id}`} item={it} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CarteVedetteGrande({ item }: { item: Item }) {
  const description = sansHtml(item.shortDesc);
  return (
    <article className="nkx-card nkx-reveal group md:col-span-7" data-testid="carte-vedette">
      <div className="nkx-card__core grid h-full md:grid-cols-[1.05fr_1fr]">
        <VignetteArticle item={item} className="aspect-[4/3] md:aspect-auto md:min-h-[340px]" tailleImg={900} />
        <div className="flex flex-col p-6 md:p-8">
          <p className="mb-3 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#006E2F]">
            {item.category ?? libelleType(item.type)}
          </p>
          <h3 className="mb-3 line-clamp-3 text-xl font-extrabold leading-tight tracking-tight text-[#0E1512] transition-colors duration-300 group-hover:text-[#006E2F] md:text-[1.65rem]">
            {item.title}
          </h3>
          {description && <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-[#5C6B62]">{description}</p>}
          <LigneNote item={item} className="mb-5" />
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#E6ECE8] pt-5">
            <PrixArticle item={item} taille="lg" />
            <Link href={hrefArticle(item)} className="nkx-stretch" aria-label={`Voir ${item.title}`}>
              <span className="nkx-btn nkx-btn--primary">
                Découvrir
                <span className="nkx-btn__ico" aria-hidden="true">
                  <ArrowRight strokeWidth={2.2} />
                </span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function CarteVedettePetite({ item }: { item: Item }) {
  return (
    <article className="nkx-card nkx-reveal group" data-testid="carte-vedette">
      <div className="nkx-card__core flex h-full flex-col">
        <VignetteArticle item={item} className="aspect-[4/3]" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-[#0E1512] transition-colors duration-300 group-hover:text-[#006E2F]">
            {item.title}
          </h3>
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <PrixArticle item={item} taille="sm" />
            <Link href={hrefArticle(item)} className="nkx-stretch" aria-label={`Voir ${item.title}`}>
              <span className="nkx-disc">
                <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Squelette du bento, même gabarit, pour que la page ne saute pas à l'arrivée des données. */
export function BentoSquelette() {
  return (
    <div className="pb-14 md:pb-20" aria-hidden="true">
      <div className="mb-6 md:mb-8">
        <div className="nkx-skel mb-3 h-5 w-20 !rounded-full" />
        <div className="nkx-skel h-7 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
        <div className="nkx-card md:col-span-7">
          <div className="nkx-card__core grid h-full md:grid-cols-[1.05fr_1fr]">
            <div className="nkx-skel aspect-[4/3] !rounded-none md:aspect-auto md:min-h-[340px]" />
            <div className="flex flex-col gap-3 p-6 md:p-8">
              <div className="nkx-skel h-2.5 w-1/3" />
              <div className="nkx-skel h-6 w-full" />
              <div className="nkx-skel h-6 w-3/4" />
              <div className="nkx-skel h-3 w-full" />
              <div className="nkx-skel h-3 w-5/6" />
              <div className="mt-auto flex items-center justify-between border-t border-[#E6ECE8] pt-5">
                <div className="nkx-skel h-7 w-1/3" />
                <div className="nkx-skel h-[42px] w-36 !rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-5 md:gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="nkx-card">
              <div className="nkx-card__core flex flex-col">
                <div className="nkx-skel aspect-[4/3] !rounded-none" />
                <div className="flex flex-col gap-2 p-4">
                  <div className="nkx-skel h-4 w-11/12" />
                  <div className="nkx-skel h-4 w-2/3" />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="nkx-skel h-5 w-1/3" />
                    <div className="nkx-skel h-10 w-10 !rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
