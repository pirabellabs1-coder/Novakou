// Refonte style KAZA — apprenant mes-formations — 2026-06-07
"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";
import {
  KazaHero,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
import {
  BookOpen,
  Search,
  Play,
  Clock,
  Award,
  Star,
  GraduationCap,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from "lucide-react";

type Enrollment = {
  id: string;
  progress: number;
  completedAt: string | null;
  paidAmount: number;
  formation?: {
    id: string;
    title: string;
    slug: string | null;
    thumbnail: string | null;
    customCategory: string | null;
    level: string | null;
    rating: number | null;
    reviewsCount?: number | null;
    instructeurId: string | null;
    reviews?: { id: string; rating: number; comment: string }[];
  };
  certificate?: { id: string; code: string; issuedAt: string } | null;
};

type Filter = "all" | "in_progress" | "completed";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-40 bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-2 bg-slate-100 rounded w-full mt-3" />
      </div>
    </div>
  );
}

const levelVariant: Record<string, "green" | "blue" | "violet" | "slate"> = {
  DEBUTANT: "green",
  INTERMEDIAIRE: "blue",
  AVANCE: "violet",
};
const levelLabels: Record<string, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
};

export default function MesFormationsPage() {
  const qc = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    title: string;
    existing?: { rating: number; comment: string };
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-enrollments"],
    queryFn: () => fetch("/api/formations/apprenant/enrollments").then((r) => r.json()),
    staleTime: 30_000,
  });

  const enrollments: Enrollment[] = data?.data ?? [];

  const byStatus = {
    all: enrollments,
    in_progress: enrollments.filter((e) => e.progress > 0 && e.progress < 100),
    completed: enrollments.filter((e) => e.completedAt !== null || e.progress >= 100),
  };
  const filtered = byStatus[activeFilter];

  const filters: { label: string; value: Filter }[] = [
    { label: "Tout", value: "all" },
    { label: "En cours", value: "in_progress" },
    { label: "Terminé", value: "completed" },
  ];

  // KPIs
  const totalEnrolled = enrollments.length;
  const inProgressCount = byStatus.in_progress.length;
  const completedCount = byStatus.completed.length;
  const certCount = enrollments.filter((e) => e.certificate).length;
  const avgProgress =
    inProgressCount > 0
      ? Math.round(
          byStatus.in_progress.reduce((s, e) => s + (e.progress || 0), 0) / inProgressCount,
        )
      : 0;

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={BookOpen}
        title="Mes formations"
        subtitle={
          isLoading
            ? "Chargement…"
            : `${totalEnrolled} formation${totalEnrolled > 1 ? "s" : ""} acquise${totalEnrolled > 1 ? "s" : ""}`
        }
        actions={
          <>
            <KazaButton variant="secondary" href="/apprenant/dashboard" icon={GraduationCap}>
              Tableau de bord
            </KazaButton>
            <KazaButton variant="primary" href="/explorer" icon={Search}>
              Explorer le catalogue
            </KazaButton>
          </>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KazaKpiCard
          label="Formations acquises"
          value={isLoading ? "…" : totalEnrolled}
          icon={BookOpen}
          iconColor="navy"
        />
        <KazaKpiCard
          label="En cours"
          value={isLoading ? "…" : inProgressCount}
          delta={inProgressCount > 0 ? `${avgProgress}%` : undefined}
          deltaTrend="up"
          icon={TrendingUp}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="Terminées"
          value={isLoading ? "…" : completedCount}
          icon={CheckCircle2}
          iconColor="sky"
        />
        <KazaKpiCard
          label="Certificats"
          value={isLoading ? "…" : certCount}
          icon={Award}
          iconColor="orange"
        />
      </section>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => {
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#0b2540] text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-[#0b2540]/30 hover:text-[#0b2540]"
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {byStatus[f.value].length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <KazaEmpty
          icon={GraduationCap}
          title="Aucune formation trouvée"
          description={
            activeFilter === "all"
              ? "Explorez le catalogue pour trouver votre prochain cours."
              : "Aucune formation dans cette catégorie."
          }
          action={{ label: "Explorer le catalogue", href: "/explorer" }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((e) => {
            const isCompleted = e.completedAt !== null || e.progress >= 100;
            const notStarted = e.progress === 0;
            const level = e.formation?.level?.toUpperCase() ?? "";
            const lastAccess = e.completedAt
              ? new Date(e.completedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;
            const existingReview = e.formation?.reviews?.[0];

            return (
              <Link
                key={e.id}
                href={`/apprenant/formation/${e.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group block"
              >
                <div className="h-40 relative overflow-hidden bg-slate-100">
                  {e.formation?.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.formation.thumbnail}
                      alt={e.formation?.title ?? "Formation"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)",
                      }}
                    >
                      <Play className="w-16 h-16 text-white/20" strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Top-left badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {level && (
                      <KazaBadge variant={levelVariant[level] ?? "slate"} size="sm">
                        {levelLabels[level] ?? level}
                      </KazaBadge>
                    )}
                  </div>

                  {/* Completed checkmark */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" fill="currentColor" />
                    </div>
                  )}

                  {e.formation?.customCategory && (
                    <span className="absolute bottom-3 left-3 inline-block text-[10px] font-bold bg-white/95 backdrop-blur text-[#0b2540] px-2 py-0.5 rounded-full shadow-sm">
                      {e.formation.customCategory}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-[#0b2540] text-sm leading-snug mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {e.formation?.title ?? "Formation"}
                  </h3>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-medium text-slate-500">Progression</span>
                      <span
                        className={`text-[10px] font-extrabold ${
                          isCompleted
                            ? "text-emerald-600"
                            : notStarted
                              ? "text-slate-500"
                              : "text-[#0b2540]"
                        }`}
                      >
                        {notStarted ? "Non commencé" : `${e.progress}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${e.progress}%`, opacity: notStarted ? 0 : 1 }}
                      />
                    </div>
                  </div>

                  {lastAccess && (
                    <p className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lastAccess}
                    </p>
                  )}

                  {e.certificate && (
                    <p className="text-[10px] text-emerald-600 mb-2 flex items-center gap-1 font-semibold">
                      <Award className="w-3 h-3" />
                      Certificat obtenu
                    </p>
                  )}

                  <div
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all duration-200 ${
                      isCompleted
                        ? "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        : "bg-emerald-500 text-white group-hover:bg-emerald-600 shadow-sm"
                    }`}
                  >
                    {isCompleted ? "Revoir le cours" : notStarted ? "Commencer" : "Continuer →"}
                  </div>

                  <button
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      if (!e.formation?.id) return;
                      setReviewTarget({
                        id: e.formation.id,
                        title: e.formation.title,
                        existing: existingReview
                          ? { rating: existingReview.rating, comment: existingReview.comment }
                          : undefined,
                      });
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    {existingReview ? (
                      <Star className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {existingReview
                      ? `${existingReview.rating}/5 · Modifier mon avis`
                      : "Donner mon avis"}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["apprenant-enrollments"] })}
          kind="formation"
          itemId={reviewTarget.id}
          itemTitle={reviewTarget.title}
          initialRating={reviewTarget.existing?.rating}
          initialComment={reviewTarget.existing?.comment}
        />
      )}
    </div>
  );
}
