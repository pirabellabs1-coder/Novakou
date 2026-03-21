"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface LearnerEnrollment {
  id: string;
  formationId: string;
  formationSlug: string;
  formationTitle: string;
  formationThumbnail: string | null;
  instructorName: string;
  completedAt: string;
  progress: number;
}

interface LearnerCertificate {
  id: string;
  code: string;
  formationTitle: string;
  instructorName: string;
  score: number;
  issuedAt: string;
}

interface LearnerData {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  memberSince: string;
  stats: {
    completedCourses: number;
    certificates: number;
    totalHours: number;
    avgScore: number;
  };
  badges: string[];
  enrollments: LearnerEnrollment[];
  certificates: LearnerCertificate[];
}

// ============================================================
// Badge config
// ============================================================

const BADGE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  premier_cours: { label: "Premier Cours", icon: "school", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  cinq_cours: { label: "5 Cours", icon: "trending_up", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  dix_cours: { label: "10 Cours", icon: "military_tech", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  expert_certifie: { label: "Expert Certifié", icon: "diamond", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

export default function ApprenantPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [apprenant, setApprenant] = useState<LearnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"formations" | "certificates">("formations");

  useEffect(() => {
    fetch(`/api/formations/apprenants/${id}`)
      .then((r) => r.json())
      .then((d) => { setApprenant(d.apprenant ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-background-dark flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-5xl px-4">
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!apprenant) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-background-dark flex items-center justify-center text-center p-4">
        <div>
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">person_off</span>
          <p className="text-slate-500 mb-4">Profil introuvable</p>
          <Link href="/formations" className="text-primary hover:underline text-sm font-semibold">
            Retour à l&apos;accueil formations
          </Link>
        </div>
      </div>
    );
  }

  const { stats, badges, enrollments, certificates } = apprenant;
  const memberDate = new Date(apprenant.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-background-dark flex flex-col items-center">
      {/* ============================================================ */}
      {/* Cover Banner                                                  */}
      {/* ============================================================ */}
      <div className="w-full h-48 relative overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-primary to-emerald-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* ============================================================ */}
      {/* Profile Header                                                */}
      {/* ============================================================ */}
      <div className="w-full max-w-[1100px] px-4 md:px-10 -mt-16 relative z-10">
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl border border-slate-200 dark:border-slate-700 dark:border-border-dark shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-neutral-dark shadow-lg overflow-hidden -mt-20 bg-primary/10 flex-shrink-0">
              {apprenant.avatar ? (
                <img src={apprenant.avatar} alt={apprenant.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-4xl">
                  {(apprenant.name || "?").charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{apprenant.name}</h1>
              <p className="text-sm text-primary font-semibold mb-1">Apprenant</p>
              {apprenant.bio && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-3">{apprenant.bio}</p>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {badges.map((badge) => {
                    const config = BADGE_CONFIG[badge];
                    if (!config) return null;
                    return (
                      <span key={badge} className={cn("inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full border", config.color)}>
                        <span className="material-symbols-outlined text-xs">{config.icon}</span>
                        {config.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  Membre depuis {memberDate}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">school</span>
                  {stats.completedCourses} formation{stats.completedCourses > 1 ? "s" : ""} complétée{stats.completedCourses > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Stats Grid                                                    */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: "school", label: "Formations complétées", value: stats.completedCourses.toString(), color: "text-primary" },
            { icon: "workspace_premium", label: "Certificats", value: stats.certificates.toString(), color: "text-emerald-500" },
            { icon: "schedule", label: "Heures d'apprentissage", value: `${stats.totalHours}h`, color: "text-blue-500" },
            { icon: "grade", label: "Note moyenne", value: stats.avgScore > 0 ? `${stats.avgScore}%` : "-", color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10 p-4 text-center">
              <span className={cn("material-symbols-outlined text-2xl mb-1", s.color)}>{s.icon}</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* Content Tabs                                                  */}
        {/* ============================================================ */}
        <div className="mt-10">
          <div className="flex border-b border-slate-200 dark:border-slate-700 dark:border-border-dark mb-6">
            {(["formations", "certificates"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px",
                  activeTab === tab
                    ? "text-primary border-primary"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                )}
              >
                {tab === "formations" && `Formations (${enrollments.length})`}
                {tab === "certificates" && `Certificats (${certificates.length})`}
              </button>
            ))}
          </div>

          {/* Formations Tab */}
          {activeTab === "formations" && (
            <div>
              {enrollments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block">school</span>
                  <p className="text-sm">Aucune formation complétée pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {enrollments.map((e) => (
                    <Link
                      key={e.id}
                      href={`/formations/${e.formationSlug}`}
                      className="group bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-slate-700 dark:border-border-dark overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 dark:bg-background-dark relative overflow-hidden">
                        {e.formationThumbnail ? (
                          <img src={e.formationThumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300">school</span>
                          </div>
                        )}
                        {e.progress >= 100 && (
                          <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/90 text-white text-[11px] font-bold rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check_circle</span>
                            Complété
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {e.formationTitle}
                        </h4>
                        <p className="text-xs text-slate-500 mb-2">par {e.instructorName}</p>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            Complété le {new Date(e.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === "certificates" && (
            <div>
              {certificates.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block">workspace_premium</span>
                  <p className="text-sm">Aucun certificat obtenu pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl p-5 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-2xl">workspace_premium</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm">{cert.formationTitle}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Instructeur : {cert.instructorName}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">calendar_today</span>
                              {new Date(cert.issuedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">grade</span>
                              Score : {cert.score}%
                            </span>
                          </div>
                        </div>
                        <a
                          href={`/formations/verification/${cert.code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">verified</span>
                          Vérifier
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-12" />
    </div>
  );
}
