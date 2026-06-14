"use client";

// Composant client : grille de guides filtrable par catégorie.
// Split du server page.tsx pour préserver l'export metadata + SEO content.
// Les guides sont passés en props depuis le server, donc le HTML initial
// (avant hydration) contient déjà TOUS les guides → SEO préservé.
// Une fois hydraté, useState gère le filtre activement côté client.

import { useState } from "react";
import {
  ArrowRight,
  Package,
} from "lucide-react";
import Link from "next/link";

const satoshi = {
  fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

const COLORS = {
  primary: "#006e2f",
  accent: "#22c55e",
  dark: "#191c1e",
  muted: "#5c647a",
  surface: "#f6fbf2",
} as const;

export interface Guide {
  href: string;
  gradient: string;
  icon: string;
  time: string;
  level: string;
  levelColor: string;
  chapters: string;
  title: string;
  desc: string;
  category: string;
}

interface Props {
  guides: Guide[];
  categories: string[];
}

export default function GuidesFilteredGrid({ guides, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("Tous");

  const filtered = activeCategory === "Tous"
    ? guides
    : guides.filter((g) => g.category === activeCategory);

  return (
    <>
      {/* ── FILTRES PAR CATÉGORIE ───────────────────────────────── */}
      <section className="w-full py-6 px-4 sm:px-6 border-b border-gray-100 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-2">
          {categories.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-pressed={isActive}
                className="px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-all hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006e2f] focus-visible:ring-offset-2"
                style={
                  isActive
                    ? { backgroundColor: COLORS.primary, color: "#fff", ...satoshi }
                    : { backgroundColor: "#f3f4f6", color: COLORS.dark, ...satoshi }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── GRILLE DES GUIDES ───────────────────────────────────── */}
      <section className="w-full py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="text-6xl text-gray-300 mb-4 inline-block" />
              <p className="text-lg font-bold text-[#191c1e] mb-2">
                Aucun guide dans cette catégorie pour l'instant
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Nous publions régulièrement de nouveaux contenus. Restez à l'affût !
              </p>
              <button
                type="button"
                onClick={() => setActiveCategory("Tous")}
                className="px-5 py-2.5 rounded-xl bg-[#006e2f] text-white font-bold hover:bg-[#005a26] transition-colors"
                style={satoshi}
              >
                Voir tous les guides
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {filtered.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Bannière */}
                  <div className="h-48 relative overflow-hidden" style={{ background: guide.gradient }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                        <span
                          className="material-symbols-outlined text-white text-[48px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {guide.icon}
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                      {guide.time}
                    </div>
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                      {guide.category}
                    </div>
                  </div>

                  {/* Corps */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${guide.levelColor}10`, color: guide.levelColor }}
                      >
                        {guide.level}
                      </span>
                      <span className="text-[10px] text-gray-600">{guide.chapters}</span>
                    </div>
                    <h2
                      className="text-lg font-extrabold mb-2 transition-colors"
                      style={{ ...satoshi, color: COLORS.dark }}
                    >
                      {guide.title}
                    </h2>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                      {guide.desc}
                    </p>
                    <span
                      className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                      style={{ color: guide.levelColor }}
                    >
                      Lire le guide{" "}
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
