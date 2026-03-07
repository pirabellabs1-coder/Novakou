"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  HELP_CATEGORIES,
  HELP_ARTICLES,
  getArticlesByCategory,
} from "@/lib/help-articles";

export default function AidePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Search results
  const filteredArticles = useMemo(() => {
    const q = search.toLowerCase().trim();
    let articles = HELP_ARTICLES;

    if (activeCategory) {
      articles = articles.filter((a) => a.category === activeCategory);
    }

    if (q) {
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
      );
    }

    return articles;
  }, [search, activeCategory]);

  // Articles to show in the "Questions frequentes" section (when no filter active)
  const frequentArticles = useMemo(() => {
    if (activeCategory || search.trim()) return filteredArticles;
    return HELP_ARTICLES.slice(0, 8);
  }, [activeCategory, search, filteredArticles]);

  const activeCategoryData = activeCategory
    ? HELP_CATEGORIES.find((c) => c.id === activeCategory)
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
          <span className="material-symbols-outlined text-primary text-3xl">
            help
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Centre d&apos;aide
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Trouvez des reponses a vos questions sur le fonctionnement de
          FreelanceHigh, vos services, paiements, commandes et bien plus.
        </p>
      </header>

      {/* Search bar */}
      <div className="relative max-w-2xl mx-auto">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un article, une question..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-200 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Active category breadcrumb / clear filter */}
      {activeCategory && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setActiveCategory(null)}
            className="text-primary hover:underline font-medium flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Toutes les categories
          </button>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-semibold">
            {activeCategoryData?.name}
          </span>
          <span className="text-slate-500 text-xs ml-1">
            ({filteredArticles.length}{" "}
            {filteredArticles.length > 1 ? "articles" : "article"})
          </span>
        </div>
      )}

      {/* Categories grid */}
      {!activeCategory && !search.trim() && (
        <section>
          <h2 className="text-lg font-bold text-slate-200 mb-4">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HELP_CATEGORIES.map((cat) => {
              const count = getArticlesByCategory(cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="group text-left p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/30 hover:bg-primary/[0.04] transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-xl">
                      {cat.icon}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-200 text-sm mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                  <p className="text-primary/70 text-xs font-semibold mt-2">
                    {count} {count > 1 ? "articles" : "article"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Search results message */}
      {search.trim() && (
        <p className="text-sm text-slate-400">
          {filteredArticles.length > 0 ? (
            <>
              <span className="font-semibold text-slate-300">
                {filteredArticles.length}
              </span>{" "}
              {filteredArticles.length > 1
                ? "resultats trouves"
                : "resultat trouve"}{" "}
              pour &laquo;{" "}
              <span className="text-slate-200">{search}</span> &raquo;
            </>
          ) : (
            <>
              Aucun resultat pour &laquo;{" "}
              <span className="text-slate-200">{search}</span> &raquo;.
              Essayez avec d&apos;autres mots-cles.
            </>
          )}
        </p>
      )}

      {/* Articles list */}
      <section>
        {!activeCategory && !search.trim() && (
          <h2 className="text-lg font-bold text-slate-200 mb-4">
            Questions frequentes
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {frequentArticles.map((article) => {
            const cat = HELP_CATEGORIES.find(
              (c) => c.id === article.category
            );
            return (
              <Link
                key={article.id}
                href={`/dashboard/aide/${article.slug}`}
                className="group flex gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/30 hover:bg-primary/[0.04] transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-xl">
                    {cat?.icon ?? "article"}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-primary transition-colors mb-1 truncate">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-500 capitalize">
                    {cat?.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Mis a jour le{" "}
                    {new Date(article.updatedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="ml-auto flex items-center text-slate-600 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">
                    chevron_right
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Show "all articles" prompt when viewing frequent only */}
        {!activeCategory && !search.trim() && HELP_ARTICLES.length > 8 && (
          <p className="text-center mt-6 text-sm text-slate-500">
            Utilisez la recherche ou selectionnez une categorie pour voir tous
            les{" "}
            <span className="text-slate-300 font-semibold">
              {HELP_ARTICLES.length}
            </span>{" "}
            articles disponibles.
          </p>
        )}
      </section>

      {/* Contact support CTA */}
      <section className="text-center p-8 rounded-xl bg-white/[0.03] border border-white/10">
        <span className="material-symbols-outlined text-primary text-4xl mb-3 block">
          support_agent
        </span>
        <h3 className="text-lg font-bold text-slate-200 mb-2">
          Vous ne trouvez pas de reponse ?
        </h3>
        <p className="text-slate-400 text-sm mb-4 max-w-md mx-auto">
          Notre equipe de support est disponible pour vous aider. Contactez-nous
          et nous vous repondrons dans les plus brefs delais.
        </p>
        <Link
          href="/dashboard/messages"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">
            chat
          </span>
          Contacter le support
        </Link>
      </section>
    </div>
  );
}
