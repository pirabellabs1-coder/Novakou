"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, Users, Clock, ChevronRight } from "lucide-react";
import DynamicIcon from "@/components/ui/DynamicIcon";

interface CohortCard {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  enrollmentDeadline: string;
  durationDays: number;
  maxParticipants: number;
  currentCount: number;
  price: number;
  originalPrice: number | null;
  status: string;
  formation: {
    id: string;
    slug: string;
    title: string;
    thumbnail: string | null;
    duration: number;
    level: string;
    category: { name: string; slug: string };
    instructeur: {
      id: string;
      user: { name: string; avatar: string | null; image: string | null };
    };
  };
}

export default function CohortsMarketplacePage() {
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const fr = locale === "fr";

  const [cohorts, setCohorts] = useState<CohortCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("date");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/formations/cohorts?page=${page}&limit=12&sort=${sort}`)
      .then((r) => r.json())
      .then((data) => {
        setCohorts(data.cohorts ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, sort]);

  const handleCheckout = async (cohortId: string) => {
    if (!session?.user) { router.push("/formations/connexion"); return; }
    const res = await fetch(`/api/formations/cohorts/${cohortId}/checkout`, { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else if (data.error) alert(data.error);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/formations" className="hover:text-primary">{fr ? "Formations" : "Courses"}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 dark:text-white font-medium">{fr ? "Formations en groupe" : "Group Courses"}</span>
        </nav>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{fr ? "Formations en groupe" : "Group Courses"}</h1>
        <p className="text-slate-500">{fr ? "Apprenez ensemble avec un instructeur et un groupe motivé" : "Learn together with an instructor and a motivated group"}</p>
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">{total} {fr ? "cohortes disponibles" : "cohorts available"}</p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="date">{fr ? "Date de début" : "Start date"}</option>
          <option value="price_asc">{fr ? "Prix croissant" : "Price low to high"}</option>
          <option value="price_desc">{fr ? "Prix décroissant" : "Price high to low"}</option>
          <option value="places">{fr ? "Places restantes" : "Places remaining"}</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark animate-pulse">
              <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : cohorts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-500 mb-4">{fr ? "Aucune cohorte disponible pour le moment" : "No cohorts available at the moment"}</p>
          <Link href="/formations" className="text-primary hover:underline text-sm">
            {fr ? "Explorer les formations auto-rythmées" : "Browse self-paced courses"} →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map((c) => {
            const cohortTitle = c.title;
            const formationTitle = c.formation.title;
            const catName = c.formation.category.name;
            const placesLeft = c.maxParticipants - c.currentCount;
            const instrAvatar = c.formation.instructeur.user.avatar || c.formation.instructeur.user.image;

            return (
              <div key={c.id} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark hover:shadow-md transition-shadow overflow-hidden group">
                {/* Thumbnail */}
                <Link href={`/formations/${c.formation.slug}`} className="block relative">
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-blue-100 overflow-hidden">
                    {c.formation.thumbnail ? (
                      <img src={c.formation.thumbnail} alt={formationTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><DynamicIcon name="school" className="w-12 h-12 opacity-30" /></div>
                    )}
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-lg">
                      {fr ? "Groupe" : "Group"}
                    </span>
                  </div>
                  {placesLeft <= 5 && placesLeft > 0 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        {placesLeft} {fr ? "place(s)" : "spot(s)"}!
                      </span>
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  <p className="text-xs text-primary font-medium mb-1">{catName}</p>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 line-clamp-2">{cohortTitle}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-1">{formationTitle}</p>

                  {/* Instructor */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                      {instrAvatar ? (
                        <img src={instrAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary text-[10px] font-bold">
                          {(c.formation?.instructeur?.user?.name || "?").charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-600">{c.formation.instructeur.user.name}</span>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.startDate).toLocaleDateString(fr ? "fr-FR" : "en-US", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {c.durationDays}{fr ? "j" : "d"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {placesLeft}/{c.maxParticipants}
                    </span>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{c.price}€</span>
                      {c.originalPrice && c.originalPrice > c.price && (
                        <span className="ml-2 text-sm text-slate-400 line-through">{c.originalPrice}€</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCheckout(c.id)}
                      disabled={placesLeft === 0}
                      className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {placesLeft === 0 ? (fr ? "Complet" : "Full") : (fr ? "S'inscrire" : "Enroll")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.ceil(total / 12) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === p ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
