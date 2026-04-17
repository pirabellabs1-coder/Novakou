"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewModal } from "@/components/formations/ReviewModal";

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-2 bg-gray-100 rounded w-full mt-3" />
      </div>
    </div>
  );
}

const levelColors: Record<string, string> = {
  DEBUTANT: "bg-green-100 text-green-700",
  INTERMEDIAIRE: "bg-blue-100 text-blue-700",
  AVANCE: "bg-purple-100 text-purple-700",
};
const levelLabels: Record<string, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
};

const GRADIENTS = [
  ["#006e2f", "#22c55e"],
  ["#0f3460", "#533483"],
  ["#1a0536", "#3d1f6e"],
  ["#7c2d12", "#c2410c"],
  ["#164e63", "#0e7490"],
  ["#14532d", "#166534"],
];

export default function MesFormationsPage() {
  const qc = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [reviewTarget, setReviewTarget] = useState<{ id: string; title: string; existing?: { rating: number; comment: string } } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-enrollments"],
    queryFn: () => fetch("/api/formations/apprenant/enrollments").then((r) => r.json()),
    staleTime: 30_000,
  });

  const enrollments: Enrollment[] = data?.data ?? [];

  const byStatus = {
    all: enrollments,
    in_progress: enrollments.filter((e) => e.progress > 0 && e.progress < 100),
    completed:   enrollments.filter((e) => e.completedAt !== null || e.progress >= 100),
  };
  const filtered = byStatus[activeFilter];

  const filters: { label: string; value: Filter }[] = [
    { label: "Tout",      value: "all" },
    { label: "En cours",  value: "in_progress" },
    { label: "Terminé",   value: "completed" },
  ];

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mes Formations</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            {isLoading ? "Chargement…" : `${enrollments.length} formation${enrollments.length > 1 ? "s" : ""} acquise${enrollments.length > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setActiveFilter(f.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeFilter === f.value ? "text-white shadow-sm" : "bg-white border border-gray-200 text-[#5c647a] hover:border-[#006e2f]/30 hover:text-[#006e2f]"
            }`}
            style={activeFilter === f.value ? { background: "linear-gradient(to right, #006e2f, #22c55e)" } : {}}>
            {f.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeFilter === f.value ? "bg-white/20 text-white" : "bg-gray-100 text-[#5c647a]"
            }`}>
              {byStatus[f.value].length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0,1,2,3,4,5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#5c647a]">school</span>
          </div>
          <h3 className="font-bold text-[#191c1e] mb-1">Aucune formation trouvée</h3>
          <p className="text-sm text-[#5c647a] mb-4">
            {activeFilter === "all" ? "Explorez le catalogue pour trouver votre prochain cours." : "Aucune formation dans cette catégorie."}
          </p>
          <Link href="/explorer"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((e, idx) => {
            const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
            const isCompleted = e.completedAt !== null || e.progress >= 100;
            const notStarted  = e.progress === 0;
            const level = e.formation?.level?.toUpperCase() ?? "";
            const lastAccess = e.completedAt
              ? new Date(e.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
              : null;

            return (
              <Link key={e.id} href={`/apprenant/formation/${e.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group block">
                <div className="h-40 relative flex items-end p-4 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${gFrom} 0%, ${gTo} 100%)` }}>
                  <span className="material-symbols-outlined text-white/10 text-[90px] absolute right-2 top-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-300">
                    play_circle
                  </span>
                  <div className="relative z-10">
                    {level && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${levelColors[level] ?? "bg-gray-100 text-gray-700"}`}>
                        {levelLabels[level] ?? level}
                      </span>
                    )}
                    {e.formation?.customCategory && (
                      <p className="text-[10px] text-white/70 mt-1.5">{e.formation.customCategory}</p>
                    )}
                  </div>
                  {isCompleted && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-[#006e2f] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-[#191c1e] text-sm leading-snug mb-1 line-clamp-2">
                    {e.formation?.title ?? "Formation"}
                  </h3>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-[#5c647a]">
                        {`Progression`}
                      </span>
                      <span className={`text-[10px] font-bold ${isCompleted ? "text-[#006e2f]" : notStarted ? "text-[#5c647a]" : "text-[#191c1e]"}`}>
                        {notStarted ? "Non commencé" : `${e.progress}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${e.progress}%`, background: "linear-gradient(to right, #006e2f, #22c55e)", opacity: notStarted ? 0 : 1 }} />
                    </div>
                  </div>

                  {lastAccess && (
                    <p className="text-[10px] text-[#5c647a] mb-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {lastAccess}
                    </p>
                  )}

                  {e.certificate && (
                    <p className="text-[10px] text-[#006e2f] mb-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                      Certificat obtenu
                    </p>
                  )}

                  <div className={`w-full py-2.5 rounded-xl text-xs font-bold text-center transition-all duration-200 ${
                    isCompleted ? "bg-gray-100 text-[#5c647a] group-hover:bg-gray-200" : "text-white group-hover:opacity-90"
                  }`}
                    style={!isCompleted ? { background: "linear-gradient(to right, #006e2f, #22c55e)" } : {}}>
                    {isCompleted ? "Revoir le cours" : notStarted ? "Commencer" : "Continuer →"}
                  </div>

                  {/* Review button — separate from the main CTA */}
                  {(() => {
                    const existingReview = e.formation?.reviews?.[0];
                    return (
                      <button
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          if (!e.formation?.id) return;
                          setReviewTarget({
                            id: e.formation.id,
                            title: e.formation.title,
                            existing: existingReview ? { rating: existingReview.rating, comment: existingReview.comment } : undefined,
                          });
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: existingReview ? "'FILL' 1" : "'FILL' 0" }}>
                          {existingReview ? "star" : "rate_review"}
                        </span>
                        {existingReview ? `${existingReview.rating}/5 · Modifier mon avis` : "Donner mon avis"}
                      </button>
                    );
                  })()}
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
