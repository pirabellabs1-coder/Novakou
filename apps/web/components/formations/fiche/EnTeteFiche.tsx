"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight, Star } from "lucide-react";
import { formaterNombre, initiales } from "./SectionsFiche";

export interface Miette {
  label: string;
  href?: string;
}

export interface BoutiqueEnTete {
  nom: string;
  href: string;
  logoUrl?: string | null;
}

/**
 * En-tête d'une fiche : fil d'Ariane discret, catégorie en petites capitales
 * vertes, titre (Sora, fluide), sous-titre, ligne de confiance (note, avis,
 * ventes ou élèves) et boutique avec avatar. Seul h1 de la page.
 *
 * Pas de révélation différée ici : le titre est un candidat LCP et la
 * première chose qu'un acheteur doit lire.
 */
export function EnTeteFiche({
  fil,
  onRetour,
  eyebrow,
  titre,
  sousTitre,
  note,
  nbAvis,
  ancreAvis = "#avis",
  compteur,
  infos = [],
  badges,
  boutique,
}: {
  fil: Miette[];
  onRetour: () => void;
  eyebrow: string;
  titre: string;
  sousTitre?: string | null;
  note?: number;
  nbAvis?: number;
  ancreAvis?: string;
  /** Ventes ou élèves : n'apparaît qu'au-dessus de zéro. */
  compteur?: { valeur: number; libelle: string } | null;
  /** Repères secondaires (leçons, durée, langue) : un nœud par entrée. */
  infos?: ReactNode[];
  badges?: ReactNode;
  boutique?: BoutiqueEnTete | null;
}) {
  const noteValide = typeof note === "number" && note > 0 ? note : null;
  const avis = nbAvis ?? 0;
  const compteurValide = compteur && compteur.valeur > 0 ? compteur : null;
  const aInfos = infos.length > 0;

  return (
    <header className="nkf-hero">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button type="button" onClick={onRetour} className="nkf-back">
          <ArrowLeft aria-hidden="true" />
          Retour
        </button>
        <ol className="nkf-crumb">
          {fil.map((m, i) => {
            const dernier = i === fil.length - 1;
            return (
              <li key={`${m.label}-${i}`}>
                {i > 0 && <ChevronRight className="nkf-crumb__sep" aria-hidden="true" />}
                {m.href && !dernier ? (
                  <Link href={m.href}>{m.label}</Link>
                ) : (
                  <span className={dernier ? "nkf-crumb__cur" : undefined} aria-current={dernier ? "page" : undefined}>
                    {m.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-7 max-w-3xl md:mt-9">
        <p className="nkf-eyebrow">{eyebrow}</p>
        <h1 className="nkf-h1 mt-3">{titre}</h1>
        {sousTitre && <p className="nkf-lead mt-4">{sousTitre}</p>}
        {badges && <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div>}

        {(noteValide !== null || compteurValide || aInfos) && (
          <ul className="nkf-trust mt-5">
            {noteValide !== null && (
              <li>
                <Star className="fill-amber-400 text-amber-400" aria-hidden="true" />
                <strong>{noteValide.toFixed(1)}</strong>
                <span className="sr-only">sur 5</span>
                {avis > 0 && (
                  <a href={ancreAvis}>
                    {formaterNombre(avis)} avis
                  </a>
                )}
              </li>
            )}
            {compteurValide && (
              <li>
                <strong>{formaterNombre(compteurValide.valeur)}</strong> {compteurValide.libelle}
              </li>
            )}
            {infos.map((info, i) => (
              <li key={i}>{info}</li>
            ))}
          </ul>
        )}

        {boutique && (
          <Link href={boutique.href} className="nkf-author mt-5">
            <span className="nkf-author__avatar" aria-hidden="true">
              {boutique.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={boutique.logoUrl} alt="" loading="lazy" decoding="async" />
              ) : (
                initiales(boutique.nom)
              )}
            </span>
            <span className="min-w-0">
              <span className="nkf-author__label">Boutique</span>
              <span className="nkf-author__name">{boutique.nom}</span>
            </span>
            <ChevronRight className="nkf-author__chev" aria-hidden="true" />
          </Link>
        )}
      </div>
    </header>
  );
}
