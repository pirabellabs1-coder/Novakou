"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Heart, ShoppingCart, Trash2, Star, BookOpen, Cloud } from "lucide-react";
import {
  getFormationFavorites,
  toggleFormationFavorite,
  syncFavoritesFromServer,
  removeFavoriteServer,
} from "@/lib/formations/favorites";

interface Formation {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  thumbnail: string | null;
  price: number;
  isFree: boolean;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  duration: number;
  level: string;
  instructeur: {
    user: { name: string };
  };
}

const LEVEL_LABELS_FR: Record<string, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
  TOUS_NIVEAUX: "Tous niveaux",
};

const LEVEL_LABELS_EN: Record<string, string> = {
  DEBUTANT: "Beginner",
  INTERMEDIAIRE: "Intermediate",
  AVANCE: "Advanced",
  TOUS_NIVEAUX: "All levels",
};

export default function FavorisPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";

  const [favorites, setFavorites] = useState<string[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    async function loadFavorites() {
      let favoriteIds: string[];

      if (isAuthenticated) {
        // Merge server + localStorage favorites
        favoriteIds = await syncFavoritesFromServer();
        setSynced(true);
      } else {
        favoriteIds = getFormationFavorites();
      }

      setFavorites(favoriteIds);

      if (favoriteIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch each favorite formation
      try {
        const results = await Promise.all(
          favoriteIds.map((id) =>
            fetch(`/api/formations/${id}`)
              .then((r) => r.json())
              .then((d) => d.formation ?? d)
              .catch(() => null)
          )
        );
        setFormations(results.filter(Boolean) as Formation[]);
      } catch {
        // silently fail
      }
      setLoading(false);
    }

    // Wait until auth status is resolved (not "loading")
    if (authStatus !== "loading") {
      loadFavorites();
    }
  }, [authStatus, isAuthenticated]);

  const removeFavorite = async (id: string) => {
    // Optimistic UI update
    toggleFormationFavorite(id);
    setFavorites((prev) => prev.filter((f) => f !== id));
    setFormations((prev) => prev.filter((f) => f.id !== id));

    // Also remove from server if authenticated
    if (isAuthenticated) {
      await removeFavoriteServer(id);
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? m : ""}` : `${m}min`;
  };

  const levelLabels = fr ? LEVEL_LABELS_FR : LEVEL_LABELS_EN;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {fr ? "Mes favoris" : "My Favorites"}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formations.length} {fr ? "formation(s)" : "course(s)"}
            </p>
            {synced && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                <Cloud className="w-3 h-3" />
                {fr ? "Synchronis\u00e9" : "Synchronized"}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-72 animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Heart className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <div>
            <p className="text-slate-900 dark:text-white font-medium">
              {fr ? "Aucune formation en favoris" : "No courses in favorites"}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {fr
                ? "Cliquez sur le coeur sur les pages de formations pour les ajouter ici."
                : "Click the heart on course pages to save them here."}
            </p>
          </div>
          <Link
            href="/formations/explorer"
            className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors mt-4"
          >
            {fr ? "Explorer les formations" : "Explore courses"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formations.map((formation) => {
            const title = fr ? formation.titleFr : (formation.titleEn || formation.titleFr);

            return (
              <div
                key={formation.id}
                className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                <Link href={`/formations/${formation.slug}`} className="relative block">
                  {formation.thumbnail ? (
                    <img
                      src={formation.thumbnail}
                      alt={title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <Link href={`/formations/${formation.slug}`}>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 hover:text-primary transition-colors">
                      {title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formation.instructeur?.user?.name}</p>

                  <div className="flex items-center gap-2 mt-2">
                    {formation.rating > 0 && (
                      <>
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{formation.rating.toFixed(1)}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({formation.reviewsCount} {fr ? "avis" : "reviews"})
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatDuration(formation.duration)}</span>
                    <span>·</span>
                    <span>{levelLabels[formation.level] ?? formation.level}</span>
                    <span>·</span>
                    <span>{formation.studentsCount} {fr ? "apprenants" : "students"}</span>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {formation.isFree ? (
                        <span className="text-green-600 dark:text-green-400">{fr ? "Gratuit" : "Free"}</span>
                      ) : (
                        `${formation.price.toFixed(0)}\u20AC`
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFavorite(formation.id)}
                        className="p-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title={fr ? "Retirer" : "Remove"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/formations/${formation.slug}`}
                        className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {fr ? "Ajouter au panier" : "Add to cart"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
