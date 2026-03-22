"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/store/client";
import { EmptyState } from "@/components/client/EmptyState";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "tous", label: "Tous", icon: "all_inclusive" },
  { key: "freelance", label: "Freelances", icon: "person" },
  { key: "service", label: "Services", icon: "work" },
  { key: "agence", label: "Agences", icon: "apartment" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function FavoriteCardSkeleton() {
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

export default function ClientFavorites() {
  const [tab, setTab] = useState<TabKey>("tous");

  const { favorites, syncFavorites, toggleFavorite, loading } = useClientStore();

  // Sync favorites on mount
  useEffect(() => {
    syncFavorites();
  }, [syncFavorites]);

  // Filter favorites based on active tab
  const filteredFavorites = useMemo(() => {
    if (tab === "tous") return favorites;
    return favorites.filter(f => f.type === tab);
  }, [favorites, tab]);

  // Count per type
  const counts = useMemo(() => ({
    tous: favorites.length,
    freelance: favorites.filter(f => f.type === "freelance").length,
    service: favorites.filter(f => f.type === "service").length,
    agence: favorites.filter(f => f.type === "agence").length,
  }), [favorites]);

  // Get initials from name
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "freelance": return "person";
      case "service": return "work";
      case "agence": return "apartment";
      default: return "star";
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "freelance": return "Freelance";
      case "service": return "Service";
      case "agence": return "Agence";
      default: return type;
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  const isLoading = loading.favorites;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Favoris</h1>
        <p className="text-slate-400 text-sm mt-1">Gérez vos prestataires et services sauvegardés pour vos futurs projets.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-dark">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors -mb-px",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300"
            )}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              tab === t.key ? "bg-primary/20 text-primary" : "bg-border-dark text-slate-500"
            )}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <FavoriteCardSkeleton key={i} />)}
        </div>
      ) : filteredFavorites.length === 0 ? (
        <EmptyState
          icon={tab === "tous" ? "favorite_border" : getTypeIcon(tab)}
          title={tab === "tous" ? "Aucun favori" : `Aucun ${getTypeLabel(tab).toLowerCase()} en favoris`}
          description="Explorez la marketplace et ajoutez des éléments à vos favoris pour les retrouver ici."
          actionLabel="Explorer"
          actionHref="/client/explorer"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFavorites.map(fav => (
            <div key={`${fav.type}-${fav.id}`} className="bg-neutral-dark rounded-xl border border-border-dark p-5 hover:border-primary/40 transition-all group relative">
              {/* Type badge */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  fav.type === "freelance" ? "bg-blue-500/10 text-blue-400" :
                  fav.type === "service" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-purple-500/10 text-purple-400"
                )}>
                  {getTypeLabel(fav.type)}
                </span>
              </div>

              {/* Avatar / Image */}
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0 overflow-hidden",
                  fav.type === "agence" ? "rounded-xl" : "rounded-full",
                  "bg-primary/20"
                )}>
                  {fav.avatar ? (
                    <img src={fav.avatar} alt={fav.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(fav.name)
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-primary transition-colors">{fav.name}</h3>
                  {fav.specialty && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{fav.specialty}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-sm font-bold text-white">{fav.rating.toFixed(1)}</span>
                  </div>
                  {fav.addedAt && (
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      Ajouté le {formatDate(fav.addedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-dark">
                <button
                  onClick={() => toggleFavorite(fav.type, fav.targetId, fav.name, fav.avatar, fav.rating, fav.specialty)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Retirer
                </button>
                <Link
                  href={
                    fav.type === "service" ? `/services/${fav.targetId}` :
                    fav.type === "agence" ? `/agences/${fav.targetId}` :
                    `/freelances/${fav.targetId}`
                  }
                  className="px-3 py-1.5 bg-border-dark text-slate-300 text-xs font-semibold rounded-lg hover:bg-primary hover:text-background-dark transition-colors"
                >
                  {fav.type === "service" ? "Voir service" : fav.type === "agence" ? "Voir agence" : "Voir profil"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
