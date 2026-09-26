"use client";

// Composant client : grille de guides filtrable par catégorie.
// Split du server page.tsx pour préserver l'export metadata + SEO content.
// Les guides sont passés en props depuis le server, donc le HTML initial
// (avant hydration) contient déjà TOUS les guides → SEO préservé.
// Une fois hydraté, useState gère le filtre activement côté client.

import { useState } from "react";
import { ArrowRight, Package } from "lucide-react";
import Link from "next/link";

export interface Guide {
  href: string;
  icon: string;
  time: string;
  level: string;
  chapters: string;
  title: string;
  desc: string;
  category: string;
}

interface Props {
  guides: Guide[];
  categories: string[];
}

/* Trois nuances de vert pour les couvertures, en rotation : un seul accent, sans monotonie. */
const COUVERTURES = ["", "nkp-gcov--b", "nkp-gcov--c"];

export default function GuidesFilteredGrid({ guides, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("Tous");

  const filtered = activeCategory === "Tous" ? guides : guides.filter((g) => g.category === activeCategory);

  return (
    <section id="guides" className="nkp-section nkp-section--tint !pt-10" aria-labelledby="guides-titre">
      <div className="nkp-wrap">
        <h2 id="guides-titre" className="sr-only">
          Tous les guides
        </h2>

        {/* ── Filtres par catégorie ── */}
        <div className="nkp-chips nkp-chips--scroll mb-10" role="group" aria-label="Filtrer par catégorie">
          {categories.map((cat) => {
            const n = cat === "Tous" ? guides.length : guides.filter((g) => g.category === cat).length;
            return (
              <button key={cat} type="button" onClick={() => setActiveCategory(cat)} aria-pressed={cat === activeCategory} className="nkp-chip">
                {cat}
                <span className="nkp-chip__n" aria-hidden="true">
                  {n}
                </span>
              </button>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {filtered.length} guide{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        </p>

        {/* ── Grille ── */}
        {filtered.length === 0 ? (
          <div className="nkp-card max-w-lg mx-auto">
            <div className="nkp-card__core items-center text-center">
              <span className="nkp-ic mb-3" aria-hidden="true">
                <Package strokeWidth={1.75} />
              </span>
              <h3 className="!text-[1.1rem]">Aucun guide dans cette catégorie pour l'instant</h3>
              <p className="nkp-card__desc">Nous publions régulièrement de nouveaux contenus. Restez à l'affût.</p>
              <button type="button" onClick={() => setActiveCategory("Tous")} className="nkp-btn nkp-btn--primary nkp-btn--sm mt-5">
                Voir tous les guides
              </button>
            </div>
          </div>
        ) : (
          <ul className="nkp-grid-3 list-none m-0 p-0">
            {filtered.map((guide, i) => (
              <li key={`${activeCategory}-${guide.href}`} className="nkp-apparait" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                <article className="nkp-card nkp-card--hover h-full" aria-labelledby={`guide-${i}`}>
                  <div className="nkp-card__core !p-0 overflow-hidden">
                    <div className={`nkp-gcov ${COUVERTURES[i % 3]}`} aria-hidden="true">
                      <span className="ico">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {guide.icon}
                        </span>
                      </span>
                      <span className="pill pill--tr nkp-num">{guide.time}</span>
                      <span className="pill pill--bl">{guide.category}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="nkp-eyebrow">{guide.level}</span>
                        <span className="text-[.72rem] text-[#5c6b62] nkp-num">{guide.chapters}</span>
                      </div>
                      <h3 id={`guide-${i}`} className="!text-[1.08rem] leading-snug">
                        <Link href={guide.href} className="nkp-stretch hover:text-[#006e2f] transition-colors">
                          {guide.title}
                        </Link>
                      </h3>
                      <p className="mt-2 flex-1 text-[.88rem] leading-relaxed text-[#5c6b62]">{guide.desc}</p>
                      <span className="nkp-link mt-4 text-[.9rem]" aria-hidden="true">
                        Lire le guide
                        <ArrowRight strokeWidth={2.2} />
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
