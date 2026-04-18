"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ARTICLES, CATEGORIES, searchArticles } from "@/lib/help/articles";

export default function AidePage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => (query.trim() ? searchArticles(query) : null), [query]);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#003d1a] via-[#006e2f] to-[#22c55e]">
        <div aria-hidden className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl" style={{ background: "white" }} />
        <div className="relative max-w-5xl mx-auto px-5 md:px-8 py-14 md:py-20 text-center">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-200 mb-3">
            Centre d&apos;aide Novakou
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Comment pouvons-nous vous aider&nbsp;?
          </h1>
          <p className="text-sm md:text-base text-emerald-50 mt-3 max-w-2xl mx-auto">
            {ARTICLES.length} articles pour tout maîtriser — création de compte, vente, paiement, retrait, mentorat, sécurité.
          </p>
          <div className="max-w-2xl mx-auto mt-8 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[22px] pointer-events-none">search</span>
            <input
              type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus
              placeholder="Rechercher un sujet, un problème, une question…"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-2xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-white/20"
            />
          </div>
          <p className="text-[11px] text-emerald-100 mt-3">
            Ou <Link href="/contact" className="underline font-bold">contactez directement notre support</Link> si vous ne trouvez pas votre réponse.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {results ? (
          <section>
            <p className="text-sm text-slate-500 mb-4">
              {results.length === 0 ? <>Aucun résultat pour «&nbsp;<strong>{query}</strong>&nbsp;».</> :
                <><strong className="tabular-nums text-slate-700">{results.length}</strong> résultat{results.length > 1 ? "s" : ""} pour «&nbsp;<strong>{query}</strong>&nbsp;»</>}
            </p>
            <div className="space-y-3">
              {results.map((a) => {
                const cat = CATEGORIES.find((c) => c.slug === a.category);
                return (
                  <Link key={a.slug} href={`/aide/${a.category}/${a.slug}`}
                    className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:shadow-lg hover:border-emerald-200 transition-all group">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white" style={{ background: cat?.color ?? "#006e2f" }}>
                      <span className="material-symbols-outlined text-[20px]">{cat?.icon ?? "help"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{cat?.title}</span>
                        <span className="text-[10px] text-slate-400">· {a.readingMin} min</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700">{a.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.excerpt}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <>
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Parcourir par catégorie</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map((cat) => {
                  const count = ARTICLES.filter((a) => a.category === cat.slug).length;
                  return (
                    <Link key={cat.slug} href={`/aide/${cat.slug}`}
                      className="group p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4" style={{ background: cat.color }}>
                        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700">{cat.title}</h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{cat.description}</p>
                      <p className="text-[11px] text-slate-400 mt-3 font-bold">{count} article{count > 1 ? "s" : ""} →</p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="mt-14">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Articles populaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ARTICLES.slice(0, 8).map((a) => {
                  const cat = CATEGORIES.find((c) => c.slug === a.category);
                  return (
                    <Link key={a.slug} href={`/aide/${a.category}/${a.slug}`}
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all">
                      <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white" style={{ background: cat?.color ?? "#006e2f" }}>
                        <span className="material-symbols-outlined text-[16px]">{cat?.icon ?? "help"}</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{a.title}</p>
                        <p className="text-[11px] text-slate-500">{cat?.title} · {a.readingMin} min</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 text-[18px]">arrow_forward</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="mt-14 p-8 md:p-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <div className="max-w-2xl">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pas trouvé votre réponse&nbsp;?</h2>
                <p className="text-sm text-slate-300 mt-2">
                  Notre équipe support répond en moins de 5 minutes en chat, sous 24h par email. Disponible Lun-Ven 8h-19h GMT.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                    Envoyer un message
                  </Link>
                  <a href="mailto:support@novakou.com" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/15">
                    <span className="material-symbols-outlined text-[18px]">alternate_email</span>
                    support@novakou.com
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
