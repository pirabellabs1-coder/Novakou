"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { feedApi, type ApiService } from "@/lib/api-client";
import { useClientStore } from "@/store/client";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { key: "", label: "Tous", icon: "apps" },
  { key: "cat-dev-web", label: "Développement", icon: "code" },
  { key: "cat-design", label: "Design", icon: "palette" },
  { key: "cat-marketing", label: "Marketing", icon: "campaign" },
  { key: "cat-redaction", label: "Rédaction", icon: "edit_note" },
  { key: "cat-video", label: "Vidéo", icon: "videocam" },
  { key: "cat-formation", label: "Formation", icon: "school" },
];

type ViewType = "services" | "freelances" | "agences";

/* ------------------------------------------------------------------ */
/* Skeleton Cards                                                      */
/* ------------------------------------------------------------------ */

function ServiceCardSkeleton() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden animate-pulse">
      <div className="h-32 bg-border-dark" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-border-dark rounded w-3/4" />
        <div className="h-3 bg-border-dark rounded w-1/2" />
        <div className="flex gap-1">
          <div className="h-5 bg-border-dark rounded-full w-14" />
          <div className="h-5 bg-border-dark rounded-full w-14" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border-dark">
          <div className="h-6 bg-border-dark rounded w-16" />
          <div className="h-8 bg-border-dark rounded w-24" />
        </div>
      </div>
    </div>
  );
}

function FreelanceCardSkeleton() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-border-dark flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-border-dark rounded w-1/3" />
          <div className="h-3 bg-border-dark rounded w-1/2" />
          <div className="h-3 bg-border-dark rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ClientExplorer() {
  const [view, setView] = useState<ViewType>("services");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("pertinence");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [contactModal, setContactModal] = useState<string | null>(null);
  const [proposalModal, setProposalModal] = useState<string | null>(null);
  const [proposalForm, setProposalForm] = useState({ title: "", description: "", budget: "", deadline: "" });

  // API state
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favorites from client store
  const { favorites, toggleFavorite } = useClientStore();

  // Fetch services from API
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { q?: string; category?: string; sort?: string } = {};
      if (search) params.q = search;
      if (category) params.category = category;
      if (sortBy !== "pertinence") params.sort = sortBy;
      const { services: result } = await feedApi.list(params);
      setServices(result);
    } catch {
      setError("Impossible de charger les services. Veuillez réessayer.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Client-side sort for services (API handles it, but also sort locally for instant feedback)
  const sortedServices = useMemo(() => {
    const list = [...services];
    if (sortBy === "prix-asc") list.sort((a, b) => a.basePrice - b.basePrice);
    if (sortBy === "prix-desc") list.sort((a, b) => b.basePrice - a.basePrice);
    if (sortBy === "note") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [services, sortBy]);

  // Derive freelances from services (group by vendor)
  const freelances = useMemo(() => {
    const vendorMap = new Map<string, {
      id: string; name: string; avatar: string; country: string;
      rating: number; ratingCount: number; serviceCount: number;
      skills: string[]; badges: string[];
    }>();
    for (const s of services) {
      const key = s.vendorUsername || s.vendorName;
      const existing = vendorMap.get(key);
      if (existing) {
        existing.serviceCount++;
        existing.rating = Math.max(existing.rating, s.rating);
        existing.ratingCount += s.ratingCount;
        for (const tag of s.tags.slice(0, 3)) {
          if (!existing.skills.includes(tag)) existing.skills.push(tag);
        }
      } else {
        vendorMap.set(key, {
          id: s.userId,
          name: s.vendorName,
          avatar: s.vendorAvatar,
          country: s.vendorCountry,
          rating: s.rating,
          ratingCount: s.ratingCount,
          serviceCount: 1,
          skills: s.tags.slice(0, 4),
          badges: s.vendorBadges || [],
        });
      }
    }
    let result = Array.from(vendorMap.values());
    if (searchInput) {
      const q = searchInput.toLowerCase();
      result = result.filter(f =>
        (f.name || "").toLowerCase().includes(q) || f.skills.some(s => (s || "").toLowerCase().includes(q))
      );
    }
    return result;
  }, [services, searchInput]);

  // Derive agences (filter vendors that look like agencies, or show all for now)
  const agences = useMemo(() => {
    const vendorMap = new Map<string, {
      id: string; name: string; avatar: string; country: string;
      rating: number; ratingCount: number; serviceCount: number;
      specialities: string[]; badges: string[];
    }>();
    for (const s of services) {
      const key = s.vendorUsername || s.vendorName;
      const nameLower = (s.vendorName || "").toLowerCase();
      const isAgency = s.vendorPlan === "agence" || nameLower.includes("agency") || nameLower.includes("agence") || nameLower.includes("studio");
      if (!isAgency) continue;
      const catName = s.categoryName || "";
      const existing = vendorMap.get(key);
      if (existing) {
        existing.serviceCount++;
        existing.rating = Math.max(existing.rating, s.rating);
        existing.ratingCount += s.ratingCount;
        if (catName && !existing.specialities.includes(catName)) existing.specialities.push(catName);
      } else {
        vendorMap.set(key, {
          id: s.userId,
          name: s.vendorName || "",
          avatar: s.vendorAvatar || "",
          country: s.vendorCountry || "",
          rating: s.rating,
          ratingCount: s.ratingCount,
          serviceCount: 1,
          specialities: catName ? [catName] : [],
          badges: s.vendorBadges || [],
        });
      }
    }
    let result = Array.from(vendorMap.values());
    if (searchInput) {
      const q = searchInput.toLowerCase();
      result = result.filter(a =>
        (a.name || "").toLowerCase().includes(q) || a.specialities.some(s => (s || "").toLowerCase().includes(q))
      );
    }
    return result;
  }, [services, searchInput]);

  // Check if a service is favorited
  const isFavorited = (serviceId: string) => {
    return favorites.some(f => f.id === serviceId && f.type === "service");
  };

  const isFreelanceFavorited = (vendorId: string) => {
    return favorites.some(f => f.id === vendorId && f.type === "freelance");
  };

  const isAgenceFavorited = (vendorId: string) => {
    return favorites.some(f => f.id === vendorId && f.type === "agence");
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Explorer</h1>
        <p className="text-slate-400 text-sm mt-1">Trouvez les meilleurs services, freelances et agences pour vos projets.</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">search</span>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Rechercher un service, freelance..."
          className="w-full pl-12 pr-4 py-3.5 bg-neutral-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 transition-colors"
        />
        {searchInput && (
          <button onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* View Tabs + Sort + View Mode */}
      <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <div className="flex gap-0.5 sm:gap-1 bg-neutral-dark border border-border-dark rounded-xl p-0.5 sm:p-1">
          {([
            { key: "services" as ViewType, label: "Services", icon: "work", count: sortedServices.length },
            { key: "freelances" as ViewType, label: "Freelances", icon: "person", count: freelances.length },
            { key: "agences" as ViewType, label: "Agences", icon: "apartment", count: agences.length },
          ]).map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                view === v.key ? "bg-primary text-background-dark" : "text-slate-400 hover:text-white"
              )}
            >
              <span className="material-symbols-outlined text-base sm:text-lg">{v.icon}</span>
              <span className="hidden sm:inline">{v.label}</span>
              <span className={cn("text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-bold", view === v.key ? "bg-background-dark/20 text-background-dark" : "bg-border-dark text-slate-500")}>{v.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex gap-0.5 bg-neutral-dark border border-border-dark rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-primary/20 text-primary" : "text-slate-500 hover:text-white")}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-primary/20 text-primary" : "text-slate-500 hover:text-white")}
            >
              <span className="material-symbols-outlined text-lg">view_list</span>
            </button>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm text-white outline-none"
          >
            <option value="pertinence">Pertinence</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
            <option value="note">Meilleure note</option>
            <option value="popularite">Plus populaire</option>
          </select>
        </div>
      </div>

      {/* Category filter (services view only) */}
      {view === "services" && (
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                category === c.key ? "bg-primary/10 text-primary border border-primary/30" : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
              )}
            >
              <span className="material-symbols-outlined text-sm sm:text-base">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-3">error</span>
          <p className="text-slate-400 mb-4">{error}</p>
          <button onClick={fetchServices} className="px-4 py-2 bg-primary text-background-dark text-sm font-bold rounded-lg hover:brightness-110 transition-all">
            Réessayer
          </button>
        </div>
      )}

      {/* ===== SERVICES VIEW ===== */}
      {view === "services" && !error && (
        <>
          {loading ? (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "flex flex-col gap-4"
            )}>
              {Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">search_off</span>
              <p className="text-white font-semibold mb-1">Aucun service trouvé</p>
              <p className="text-slate-400 text-sm">Essayez de modifier vos critères de recherche ou de changer de catégorie.</p>
            </div>
          ) : (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            )}>
              {sortedServices.map(s => (
                viewMode === "grid" ? (
                  /* Grid Card */
                  <div key={s.id} className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden hover:border-primary/40 transition-all group">
                    {/* Service image / header */}
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                      {s.mainImage ? (
                        <img src={s.mainImage} alt={s.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-5xl text-primary/30">design_services</span>
                      )}
                      {s.isBoosted && (
                        <span className="absolute top-3 left-3 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">star</span> Vedette
                        </span>
                      )}
                      {/* Favorite button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite("service", s.id, s.title, s.mainImage || "", s.rating, s.categoryName); }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                      >
                        <span
                          className={cn("material-symbols-outlined text-lg", isFavorited(s.id) ? "text-red-400" : "text-white/70")}
                          style={{ fontVariationSettings: isFavorited(s.id) ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          favorite
                        </span>
                      </button>
                    </div>
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2">{s.title}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold overflow-hidden flex-shrink-0">
                          {s.vendorAvatar ? (
                            <img src={s.vendorAvatar} alt={s.vendorName} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(s.vendorName)
                          )}
                        </div>
                        <span className="text-xs text-slate-400 truncate">{s.vendorName}</span>
                        {s.vendorCountry && (
                          <span className="text-[10px] text-slate-500">{s.vendorCountry}</span>
                        )}
                        <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                          <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-xs font-bold text-white">{s.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-500">({s.ratingCount})</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {s.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] bg-border-dark text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border-dark">
                        <div>
                          <p className="text-[10px] text-slate-500">À partir de</p>
                          <p className="text-lg font-black text-primary">{(s.basePrice ?? 0).toLocaleString("fr-FR")}&nbsp;EUR</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {s.deliveryDays}j
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* List Card */
                  <div key={s.id} className="bg-neutral-dark rounded-xl border border-border-dark p-4 hover:border-primary/40 transition-all flex gap-4 group">
                    <div className="w-24 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {s.mainImage ? (
                        <img src={s.mainImage} alt={s.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl text-primary/30">design_services</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-sm group-hover:text-primary transition-colors line-clamp-1">{s.title}</h3>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite("service", s.id, s.title, s.mainImage || "", s.rating, s.categoryName); }}
                          className="flex-shrink-0"
                        >
                          <span
                            className={cn("material-symbols-outlined text-lg", isFavorited(s.id) ? "text-red-400" : "text-slate-600 hover:text-white")}
                            style={{ fontVariationSettings: isFavorited(s.id) ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            favorite
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[8px] font-bold">
                            {getInitials(s.vendorName)}
                          </div>
                          {s.vendorName}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-amber-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-bold text-white">{s.rating.toFixed(1)}</span>
                          <span className="text-slate-500">({s.ratingCount})</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {s.deliveryDays}j
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1">
                          {s.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[10px] bg-border-dark text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                        <p className="text-base font-black text-primary">{(s.basePrice ?? 0).toLocaleString("fr-FR")}&nbsp;EUR</p>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== FREELANCES VIEW ===== */}
      {view === "freelances" && !error && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <FreelanceCardSkeleton key={i} />)}
            </div>
          ) : freelances.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">person_off</span>
              <p className="text-white font-semibold mb-1">Aucun freelance trouvé</p>
              <p className="text-slate-400 text-sm">Essayez de modifier votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freelances.map(f => (
                <div key={f.id} className="bg-neutral-dark rounded-xl border border-border-dark p-5 hover:border-primary/40 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0 overflow-hidden">
                      {f.avatar ? (
                        <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(f.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{f.name}</h3>
                        {f.badges.includes("verified") && <span className="material-symbols-outlined text-blue-400 text-base">verified</span>}
                        {f.badges.includes("top_rated") && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs">star</span> Top Rated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">{f.serviceCount} service(s) actif(s)</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        {f.country && <span>{f.country}</span>}
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-amber-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-bold text-white">{f.rating.toFixed(1)}</span> ({f.ratingCount})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {f.skills.slice(0, 5).map(s => (
                          <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-dark gap-2">
                    <button
                      onClick={() => toggleFavorite("freelance", f.id, f.name, f.avatar, f.rating, f.skills[0] || "")}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <span
                        className={cn("material-symbols-outlined text-base", isFreelanceFavorited(f.id) ? "text-red-400" : "")}
                        style={{ fontVariationSettings: isFreelanceFavorited(f.id) ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                      <span className="hidden sm:inline">{isFreelanceFavorited(f.id) ? "Retiré" : "Favoris"}</span>
                    </button>
                    <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setContactModal(f.name)}
                        className="px-2 sm:px-3 py-1.5 bg-border-dark text-slate-300 text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        Contacter
                      </button>
                      <button
                        onClick={() => setProposalModal(f.name)}
                        className="px-2 sm:px-3 py-1.5 bg-primary/10 text-primary text-[10px] sm:text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        Proposition
                      </button>
                      <button className="px-2 sm:px-3 py-1.5 bg-primary text-background-dark text-[10px] sm:text-xs font-bold rounded-lg hover:brightness-110 transition-all">
                        Voir profil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== AGENCIES VIEW ===== */}
      {view === "agences" && !error && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <FreelanceCardSkeleton key={i} />)}
            </div>
          ) : agences.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">domain_disabled</span>
              <p className="text-white font-semibold mb-1">Aucune agence trouvée</p>
              <p className="text-slate-400 text-sm">Essayez de modifier votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agences.map(a => (
                <div key={a.id} className="bg-neutral-dark rounded-xl border border-border-dark p-5 hover:border-primary/40 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0 overflow-hidden">
                      {a.avatar ? (
                        <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(a.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{a.name}</h3>
                        {a.badges.includes("verified") && <span className="material-symbols-outlined text-blue-400 text-base">verified</span>}
                        {a.badges.includes("premium") && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold">Premium</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">{a.serviceCount} service(s)</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        {a.country && <span>{a.country}</span>}
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-amber-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-bold text-white">{a.rating.toFixed(1)}</span> ({a.ratingCount})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {a.specialities.map(s => (
                          <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-dark gap-2">
                    <button
                      onClick={() => toggleFavorite("agence", a.id, a.name, a.avatar, a.rating, a.specialities[0] || "")}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <span
                        className={cn("material-symbols-outlined text-base", isAgenceFavorited(a.id) ? "text-red-400" : "")}
                        style={{ fontVariationSettings: isAgenceFavorited(a.id) ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                      <span className="hidden sm:inline">{isAgenceFavorited(a.id) ? "Retiré" : "Favoris"}</span>
                    </button>
                    <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setContactModal(a.name)}
                        className="px-2 sm:px-3 py-1.5 bg-border-dark text-slate-300 text-[10px] sm:text-xs font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        Contacter
                      </button>
                      <button
                        onClick={() => setProposalModal(a.name)}
                        className="px-2 sm:px-3 py-1.5 bg-primary/10 text-primary text-[10px] sm:text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        Devis
                      </button>
                      <button className="px-2 sm:px-3 py-1.5 bg-primary text-background-dark text-[10px] sm:text-xs font-bold rounded-lg hover:brightness-110 transition-all">
                        Voir agence
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== CONTACT MODAL ===== */}
      {contactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setContactModal(null)}>
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 sm:p-6 w-full max-w-[min(90vw,512px)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base sm:text-lg">Contacter {contactModal}</h3>
              <button onClick={() => setContactModal(null)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <textarea
              rows={4}
              placeholder="Bonjour, je suis intéressé par vos services. Pouvez-vous me donner plus de détails sur..."
              className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setContactModal(null)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white">Annuler</button>
              <button onClick={() => setContactModal(null)} className="px-5 py-2 bg-primary text-background-dark text-sm font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">send</span>
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PROPOSAL MODAL ===== */}
      {proposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setProposalModal(null)}>
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 sm:p-6 w-full max-w-[min(90vw,512px)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base sm:text-lg">Proposition à {proposalModal}</h3>
              <button onClick={() => setProposalModal(null)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Titre du projet</label>
                <input
                  value={proposalForm.title}
                  onChange={e => setProposalForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ex: Refonte de notre site e-commerce"
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-1.5">Description du besoin</label>
                <textarea
                  value={proposalForm.description}
                  onChange={e => setProposalForm(p => ({ ...p, description: e.target.value }))}
                  rows={4}
                  placeholder="Décrivez précisément ce que vous recherchez, les fonctionnalités attendues, le contexte..."
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Budget estimé</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">EUR</span>
                    <input
                      type="number"
                      value={proposalForm.budget}
                      onChange={e => setProposalForm(p => ({ ...p, budget: e.target.value }))}
                      placeholder="1500"
                      className="w-full pl-12 pr-4 py-2.5 bg-background-dark border border-border-dark rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">Deadline</label>
                  <input
                    type="date"
                    value={proposalForm.deadline}
                    onChange={e => setProposalForm(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-lg text-sm text-white outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setProposalModal(null)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white">Annuler</button>
              <button onClick={() => { setProposalModal(null); setProposalForm({ title: "", description: "", budget: "", deadline: "" }); }} className="px-5 py-2 bg-primary text-background-dark text-sm font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">send</span>
                Envoyer la proposition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
