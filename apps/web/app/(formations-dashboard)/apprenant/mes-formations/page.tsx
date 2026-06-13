// Refonte design "Stitch" — apprenant mes-formations — vert Novakou — 2026-06-13
"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StKpiCompact,
  StTabs,
  StProgressBar,
  ST,
} from "@/components/stitch";
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
    <div className="rounded-[18px] overflow-hidden animate-pulse bg-white" style={{ border: `1px solid ${ST.cardBorder}` }}>
      <div className="h-40" style={{ background: "#f3f6f4" }} />
      <div className="p-4 space-y-2">
        <div className="h-4 rounded w-3/4" style={{ background: "#f3f6f4" }} />
        <div className="h-3 rounded w-1/2" style={{ background: "#f3f6f4" }} />
        <div className="h-2 rounded w-full mt-3" style={{ background: "#f3f6f4" }} />
      </div>
    </div>
  );
}

const levelTone: Record<string, "green" | "blue" | "amber" | "neutral"> = {
  DEBUTANT: "green",
  INTERMEDIAIRE: "blue",
  AVANCE: "amber",
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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes formations"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${totalEnrolled} formation${totalEnrolled > 1 ? "s" : ""} acquise${totalEnrolled > 1 ? "s" : ""}`
          }
          actions={
            <>
              <StButton variant="secondary" href="/apprenant/dashboard" icon={GraduationCap}>
                Tableau de bord
              </StButton>
              <StButton href="/explorer" icon={Search}>
                Explorer le catalogue
              </StButton>
            </>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <StKpiCompact label="Formations acquises" value={isLoading ? "…" : totalEnrolled} icon={BookOpen} tone="green" />
          <StKpiCompact label="En cours" value={isLoading ? "…" : inProgressCount} icon={TrendingUp} tone="green" />
          <StKpiCompact label="Terminées" value={isLoading ? "…" : completedCount} icon={CheckCircle2} tone="blue" />
          <StKpiCompact label="Certificats" value={isLoading ? "…" : certCount} icon={Award} tone="amber" />
        </div>

        {/* Filter tabs */}
        <div className="mb-4">
          <StTabs
            tabs={[
              { key: "all", label: "Tout", count: byStatus.all.length },
              { key: "in_progress", label: "En cours", count: byStatus.in_progress.length },
              { key: "completed", label: "Terminé", count: byStatus.completed.length },
            ]}
            active={activeFilter}
            onChange={(k) => setActiveFilter(k as Filter)}
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <GraduationCap size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucune formation trouvée</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              {activeFilter === "all"
                ? "Explorez le catalogue pour trouver votre prochain cours."
                : "Aucune formation dans cette catégorie."}
            </p>
            <StButton href="/explorer" icon={Search}>Explorer le catalogue</StButton>
          </StCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  className="rounded-[18px] overflow-hidden hover:-translate-y-0.5 transition-all duration-300 group block bg-white"
                  style={{ border: `1px solid ${ST.cardBorder}`, boxShadow: "0 1px 3px rgba(16,52,32,.05)" }}
                >
                  <div className="h-40 relative overflow-hidden" style={{ background: "#eef2ef" }}>
                    {e.formation?.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.formation.thumbnail}
                        alt={e.formation?.title ?? "Formation"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: ST.gradient }}>
                        <Play className="w-16 h-16 text-white/25" strokeWidth={1.5} />
                      </div>
                    )}

                    {/* Top-left badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {level && (
                        <StChip tone={levelTone[level] ?? "neutral"}>{levelLabels[level] ?? level}</StChip>
                      )}
                    </div>

                    {/* Completed checkmark */}
                    {isCompleted && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-4 h-4" style={{ color: ST.green }} fill="currentColor" />
                      </div>
                    )}

                    {e.formation?.customCategory && (
                      <span className="absolute bottom-3 left-3 inline-block text-[10px] font-extrabold bg-white/95 backdrop-blur px-2 py-0.5 rounded-full shadow-sm" style={{ color: ST.green }}>
                        {e.formation.customCategory}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-extrabold text-[13.5px] leading-snug mb-2 line-clamp-2 transition-colors" style={{ color: ST.text }}>
                      {e.formation?.title ?? "Formation"}
                    </h3>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold" style={{ color: ST.textSecondary }}>Progression</span>
                        <span
                          className="text-[10px] font-extrabold"
                          style={{ color: isCompleted ? ST.green : notStarted ? ST.textMuted : ST.text }}
                        >
                          {notStarted ? "Non commencé" : `${e.progress}%`}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#e9efeb" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${e.progress}%`, opacity: notStarted ? 0 : 1, background: ST.gradientH }}
                        />
                      </div>
                    </div>

                    {lastAccess && (
                      <p className="text-[10px] font-semibold mb-2 flex items-center gap-1" style={{ color: ST.textMuted }}>
                        <Clock className="w-3 h-3" />
                        {lastAccess}
                      </p>
                    )}

                    {e.certificate && (
                      <p className="text-[10px] mb-2 flex items-center gap-1 font-extrabold" style={{ color: ST.green }}>
                        <Award className="w-3 h-3" />
                        Certificat obtenu
                      </p>
                    )}

                    <div
                      className="w-full py-2.5 rounded-[12px] text-[12px] font-extrabold text-center transition-all duration-200"
                      style={
                        isCompleted
                          ? { background: ST.greenSoft, color: ST.green }
                          : { background: ST.gradient, color: "#fff" }
                      }
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
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-[12px] text-[11px] font-extrabold transition-colors hover:opacity-90"
                      style={{ background: ST.amberSoft, color: ST.amberText }}
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
      </main>
    </div>
  );
}
