"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { searchApi, type ApiSearchResult } from "@/lib/api-client";

export default function FreelanceRechercheIAPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchApi.search({ q: query.trim() });
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Recherche IA</h1>
        <p className="text-sm text-slate-400 mt-1">Trouvez des services, freelances et projets en decrivant votre besoin.</p>
      </div>

      {/* Search bar */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Decrivez ce que vous cherchez..."
              className="w-full pl-10 pr-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined">auto_awesome</span>
            )}
            Rechercher
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm text-slate-400 mt-3">Recherche en cours...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 bg-neutral-dark rounded-xl border border-border-dark">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">search_off</span>
          <p className="text-slate-400 font-semibold">Aucun resultat trouve</p>
          <p className="text-sm text-slate-500 mt-1">Essayez avec d&apos;autres termes.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">{results.length} resultat(s) trouve(s)</p>
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/freelances/${r.id}`}
              className="block bg-neutral-dark rounded-xl border border-border-dark p-5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {r.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white">{r.name}</p>
                  <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{r.description || r.type}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-semibold",
                      r.type === "freelance" ? "bg-primary/10 text-primary" :
                      r.type === "service" ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-blue-500/10 text-blue-400"
                    )}>
                      {r.type}
                    </span>
                    {r.rating > 0 && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {r.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
