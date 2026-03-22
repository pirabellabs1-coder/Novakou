"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { searchApi, type ApiSearchResult } from "@/lib/api-client";
import { EmptyState } from "@/components/client/EmptyState";

export default function RechercheIAPage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiSearchResult[]>([]);
  const [entities, setEntities] = useState<{ skills: string[]; budget: number | null; type: string | null }>({ skills: [], budget: null, type: null });

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchApi.search({ q });
      setResults(data.results || []);
      setEntities(data.entities || { skills: [], budget: null, type: null });
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const extractedEntities: { icon: string; label: string; isPrimary: boolean }[] = [];
  if (entities.budget) extractedEntities.push({ icon: "payments", label: `Budget: ${entities.budget.toLocaleString("fr-FR")} €`, isPrimary: true });
  if (entities.type) extractedEntities.push({ icon: "person", label: entities.type === "agence" ? "Agence" : "Freelance", isPrimary: true });
  entities.skills.forEach(skill => extractedEntities.push({ icon: "code", label: skill, isPrimary: false }));

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="flex-1 flex flex-col items-center">
        {/* V3 Banner */}
        <div className="w-full max-w-4xl px-6 pt-6">
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="material-symbols-outlined text-amber-400">info</span>
            <p className="text-sm text-amber-300">
              <span className="font-bold">Version actuelle :</span> recherche par mots-clés et compétences. La recherche sémantique par IA (langage naturel) sera disponible en V3.
            </p>
          </div>
        </div>

        {/* Hero Search Section */}
        <section className="w-full max-w-4xl px-6 pt-8 pb-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            <span className="material-symbols-outlined text-sm">search</span>
            Recherche Avancée
          </div>

          <h1 className="text-slate-900 dark:text-white tracking-tight text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Trouvez le freelance idéal
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mb-10">
            Recherchez par compétences, budget ou type de prestataire. Décrivez votre besoin et nous trouverons les profils les plus pertinents.
          </p>

          {/* Search Bar */}
          <div className="w-full relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
            <div className="relative flex flex-col w-full bg-white dark:bg-neutral-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-2xl p-2">
              <div className="flex items-center gap-3 px-4 h-14">
                <span className="material-symbols-outlined text-primary">search</span>
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-900 dark:text-white text-lg placeholder:text-slate-400"
                  placeholder="Ex: développeur React, design logo, marketing digital..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-primary text-white p-2 rounded-lg flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">{loading ? "hourglass_empty" : "arrow_forward"}</span>
                </button>
              </div>

              {/* Extracted entities */}
              {searched && extractedEntities.length > 0 && (
                <div className="flex gap-2 p-3 border-t border-slate-100 dark:border-border-dark overflow-x-auto">
                  {extractedEntities.map((entity) => (
                    <div
                      key={entity.label}
                      className={cn(
                        "flex h-8 shrink-0 items-center gap-2 rounded-lg px-3",
                        entity.isPrimary
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-slate-100 dark:bg-border-dark"
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-sm",
                          entity.isPrimary ? "text-primary" : ""
                        )}
                      >
                        {entity.icon}
                      </span>
                      <p
                        className={cn(
                          "text-xs font-bold",
                          entity.isPrimary
                            ? "text-primary"
                            : "text-slate-600 dark:text-slate-300"
                        )}
                      >
                        {entity.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Section */}
        {searched && (
          <section className="w-full max-w-6xl px-6 py-12">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-neutral-dark rounded-xl border border-border-dark p-6 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-border-dark" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-border-dark rounded w-2/3" />
                        <div className="h-3 bg-border-dark rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-3 bg-border-dark rounded w-full mb-2" />
                    <div className="h-3 bg-border-dark rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon="search_off"
                title="Aucun résultat trouvé"
                description="Essayez avec d'autres mots-clés ou élargissez vos critères de recherche."
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person_search</span>
                    {results.length} résultat{results.length > 1 ? "s" : ""} trouvés
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((result) => {
                    const initials = result.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <div
                        key={result.id}
                        className={cn(
                          "group relative bg-white dark:bg-neutral-dark border rounded-xl overflow-hidden transition-all shadow-md hover:shadow-lg",
                          result.matchScore >= 80
                            ? "border-primary/40 hover:border-primary shadow-lg hover:shadow-primary/5"
                            : "border-slate-200 dark:border-border-dark hover:border-primary/50"
                        )}
                      >
                        {/* Match badge */}
                        {result.matchScore >= 80 && (
                          <div className="absolute top-3 right-3 z-10">
                            <div className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded flex items-center gap-1 uppercase tracking-tighter">
                              <span className="material-symbols-outlined text-[12px] font-bold">verified</span>
                              {result.matchScore}% match
                            </div>
                          </div>
                        )}

                        <div className="p-6">
                          {/* Freelancer info */}
                          <div className="flex items-center gap-4 mb-4">
                            <div
                              className={cn(
                                "size-14 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden",
                                result.matchScore >= 80
                                  ? "bg-primary/20 text-primary border-2 border-primary"
                                  : "bg-slate-200 dark:bg-border-dark text-slate-600 dark:text-slate-300"
                              )}
                            >
                              {result.avatar ? (
                                <img src={result.avatar} alt={result.name} className="w-full h-full object-cover" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{result.name}</h4>
                              <p className="text-primary text-sm font-medium">{result.title}</p>
                            </div>
                          </div>

                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                            {result.bio}
                          </p>

                          {/* Skills */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {result.skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 bg-slate-100 dark:bg-border-dark rounded text-[10px] font-bold uppercase tracking-wide"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              {result.rating.toFixed(1)} ({result.reviews})
                            </span>
                            <span>{result.completionRate}% complété</span>
                            <span>{result.responseTime}</span>
                          </div>

                          {/* Rate & Location */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-border-dark">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Localisation</p>
                              <p className="text-sm font-medium text-slate-300">{result.location}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Tarif horaire</p>
                              <p className="text-sm font-bold text-primary">{result.hourlyRate} €/h</p>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <Link
                          href={`/freelances/${result.id}`}
                          className={cn(
                            "w-full py-3 font-bold text-sm transition-colors flex items-center justify-center",
                            result.matchScore >= 80
                              ? "bg-primary/10 hover:bg-primary text-primary hover:text-white"
                              : "bg-slate-50 dark:bg-border-dark/30 hover:bg-primary text-slate-700 dark:text-slate-300 hover:text-white border-t border-slate-100 dark:border-border-dark"
                          )}
                        >
                          Voir le profil
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
