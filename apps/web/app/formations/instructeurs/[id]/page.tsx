"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface Formation {
  id: string;
  slug: string;
  title: string;
  price: number;
  isFree: boolean;
  rating: number;
  studentsCount: number;
  reviewsCount: number;
  thumbnail: string | null;
  duration: number;
  level: string;
}

interface InstructeurPublic {
  id: string;
  bio: string | null;
  expertise: string[];
  linkedin: string | null;
  website: string | null;
  coverPhoto?: string | null;
  user: { name: string; avatar: string | null; image: string | null };
  formations: Formation[];
  _count: { formations: number };
  avgRating: number;
  totalStudents: number;
  reviews?: { id: string; studentName: string; rating: number; comment: string; createdAt: string }[];
  badges?: string[];
  completionRate?: number;
}

// ============================================================
// Badge config
// ============================================================

const BADGE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  verified: { label: "Vérifié", icon: "verified", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  top_instructor: { label: "Top Instructeur", icon: "bolt", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  new: { label: "Nouveau", icon: "fiber_new", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

// ============================================================
// Star Rating component
// ============================================================

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "base" }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "material-symbols-outlined fill-icon",
            size === "base" ? "text-base" : "text-xs",
            i <= full ? "text-amber-400" : i === full + 1 && half ? "text-amber-400/50" : "text-slate-300 dark:text-slate-600"
          )}
        >
          star
        </span>
      ))}
    </div>
  );
}

// ============================================================
// Level badge colors
// ============================================================

const LEVEL_COLORS: Record<string, string> = {
  DEBUTANT: "bg-emerald-500/10 text-emerald-600",
  INTERMEDIAIRE: "bg-blue-500/10 text-blue-600",
  AVANCE: "bg-purple-500/10 text-purple-600",
};

export default function InstructeurPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "fr";
  const [instructeur, setInstructeur] = useState<InstructeurPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "formations" | "reviews">("about");
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/formations/instructeurs/${id}`)
      .then((r) => r.json())
      .then((d) => { setInstructeur(d.instructeur ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);

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

  if (!instructeur) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-background-dark flex items-center justify-center text-center p-4">
        <div>
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">person_off</span>
          <p className="text-slate-500 mb-4">{t("Instructeur introuvable", "Instructor not found")}</p>
          <Link href="/formations/explorer" className="text-primary hover:underline text-sm font-semibold">
            {t("Explorer les formations", "Browse courses")}
          </Link>
        </div>
      </div>
    );
  }

  const avatar = instructeur.user.avatar || instructeur.user.image;
  const bio = instructeur.bio;
  const bioLines = (bio || "").split("\n").filter(Boolean);
  const reviews = instructeur.reviews || [];
  const badges = instructeur.badges || [];
  const avgRating = instructeur.avgRating.toFixed(1);
  const totalReviews = instructeur.formations.reduce((acc, f) => acc + f.reviewsCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-background-dark flex flex-col items-center">
      {/* ============================================================ */}
      {/* Cover Banner                                                  */}
      {/* ============================================================ */}
      <div className="w-full h-56 relative overflow-hidden">
        {instructeur.coverPhoto ? (
          <img src={instructeur.coverPhoto} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-blue-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* ============================================================ */}
      {/* Profile Header                                                */}
      {/* ============================================================ */}
      <div className="w-full max-w-[1100px] px-4 md:px-10 -mt-16 relative z-10">
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl border border-slate-200 dark:border-slate-700 dark:border-border-dark shadow-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-neutral-dark shadow-lg overflow-hidden -mt-20 md:-mt-20 bg-primary/10 flex-shrink-0">
              {avatar ? (
                <img src={avatar} alt={instructeur.user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-4xl">
                  {(instructeur.user?.name || "?").charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{instructeur.user.name}</h1>
                {badges.map((badge) => {
                  const config = BADGE_CONFIG[badge.toLowerCase()];
                  if (!config) return null;
                  return (
                    <span key={badge} className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border", config.color)}>
                      <span className="material-symbols-outlined text-xs">{config.icon}</span>
                      {config.label}
                    </span>
                  );
                })}
              </div>

              <p className="text-sm text-primary font-semibold mb-2">{t("Instructeur", "Instructor")}</p>

              {/* Expertise */}
              {instructeur.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {instructeur.expertise.slice(0, 6).map((e) => (
                    <span key={e} className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-semibold rounded-lg">{e}</span>
                  ))}
                </div>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">school</span>
                  {instructeur._count.formations} {t("formations", "courses")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">groups</span>
                  {instructeur.totalStudents.toLocaleString()} {t("apprenants", "students")}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={instructeur.avgRating} size="base" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{avgRating}</span>
                <span className="text-sm text-slate-500">({totalReviews} {t("avis", "reviews")})</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 self-start md:self-end flex-shrink-0">
              <button
                onClick={() => setContactOpen(!contactOpen)}
                className="h-11 px-5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                {t("Contacter", "Contact")}
              </button>
              <Link
                href="/formations/explorer"
                className="h-11 px-5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 text-sm justify-center"
              >
                <span className="material-symbols-outlined text-sm">school</span>
                {t("Voir les formations", "View courses")}
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Quick Form */}
        {contactOpen && (
          <div className="mt-6 bg-primary/5 dark:bg-white/5 border border-primary/10 rounded-xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">mail</span>
              {t("Envoyer un message", "Send a message")}
            </h3>
            <textarea
              className="w-full p-3 rounded-lg border border-primary/20 bg-white dark:bg-slate-900 dark:bg-neutral-dark text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
              rows={3}
              placeholder={t("Posez votre question...", "Ask your question...")}
            />
            <button className="mt-3 px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all">
              {t("Envoyer", "Send")}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* Stats Grid                                                    */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: "groups", label: t("Étudiants", "Students"), value: instructeur.totalStudents.toLocaleString(), color: "text-primary" },
            { icon: "school", label: t("Formations", "Courses"), value: instructeur._count.formations.toString(), color: "text-emerald-500" },
            { icon: "star", label: t("Note moyenne", "Avg rating"), value: avgRating, color: "text-blue-500" },
            { icon: "trending_up", label: t("Taux complétion", "Completion"), value: `${instructeur.completionRate ?? 0}%`, color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10 p-4 text-center">
              <span className={cn("material-symbols-outlined text-2xl mb-1", s.color)}>{s.icon}</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* Main Content — Tabs                                           */}
        {/* ============================================================ */}
        <div className="mt-10">
          <div className="flex border-b border-slate-200 dark:border-slate-700 dark:border-border-dark mb-6">
            {(["about", "formations", "reviews"] as const).map((tab) => (
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
                {tab === "about" && t("À propos", "About")}
                {tab === "formations" && `${t("Formations", "Courses")} (${instructeur._count.formations})`}
                {tab === "reviews" && `${t("Avis", "Reviews")} (${totalReviews})`}
              </button>
            ))}
          </div>

          {/* About Tab */}
          {activeTab === "about" && (
            <div className="space-y-8">
              {bioLines.length > 0 && (
                <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-xl border border-primary/10">
                  {bioLines.map((p, i) => (
                    <p key={i} className={cn("text-slate-700 dark:text-slate-300 leading-relaxed", i > 0 && "mt-4")}>
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {/* Expertise */}
              {instructeur.expertise.length > 0 && (
                <div>
                  <h3 className="text-slate-900 dark:text-white dark:text-slate-100 text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    {t("Domaines d'expertise", "Areas of expertise")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {instructeur.expertise.map((e) => (
                      <span key={e} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social links */}
              <div className="flex gap-4">
                {instructeur.linkedin && (
                  <a href={instructeur.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" aria-label="LinkedIn">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.493-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-2v-3.86c0-.881-.719-1.6-1.6-1.6s-1.6.719-1.6 1.6v3.86h-2v-6h2v1.135c.671-.647 1.62-1.135 2.6-1.135 1.989 0 3.6 1.611 3.6 3.6v2.399z" />
                    </svg>
                  </a>
                )}
                {instructeur.website && (
                  <a href={instructeur.website} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" aria-label="Website">
                    <span className="material-symbols-outlined text-xl">language</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Formations Tab */}
          {activeTab === "formations" && (
            <div>
              {instructeur.formations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block">school</span>
                  <p className="text-sm">{t("Aucune formation publiée", "No published courses")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {instructeur.formations.map((f) => (
                    <Link
                      key={f.id}
                      href={`/formations/${f.slug}`}
                      className="group bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-slate-700 dark:border-border-dark overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 dark:bg-background-dark relative overflow-hidden">
                        {f.thumbnail ? (
                          <img src={f.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300">school</span>
                          </div>
                        )}
                        <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm", LEVEL_COLORS[f.level] || "bg-slate-500/10 text-slate-600")}>
                          {f.level}
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {f.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <StarRating rating={f.rating} />
                          <span className="text-xs text-slate-500">{f.rating.toFixed(1)} ({f.reviewsCount})</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border-dark">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            {Math.round(f.duration / 60)}h
                          </span>
                          <span className="text-sm font-black text-primary">
                            {f.isFree ? t("Gratuit", "Free") : `${f.price.toFixed(0)} €`}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div>
              {reviews.length > 0 ? (
                <>
                  {/* Review Summary */}
                  <div className="flex items-center gap-4 mb-6 p-4 bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10">
                    <div className="text-center">
                      <p className="text-4xl font-black text-primary">{avgRating}</p>
                      <StarRating rating={instructeur.avgRating} size="base" />
                      <p className="text-xs text-slate-500 mt-1">{reviews.length} {t("avis", "reviews")}</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => Math.floor(r.rating) === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-slate-500">{star}</span>
                            <span className="material-symbols-outlined text-xs fill-icon text-amber-400">star</span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right text-slate-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review list */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark p-5 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-border-dark">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                              {review.studentName?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "?"}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{review.studentName}</p>
                              <p className="text-slate-500 text-xs">{t("Apprenant", "Student")}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <StarRating rating={review.rating} />
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(review.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-400 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 block">rate_review</span>
                  <p className="text-sm">{t("Aucun avis pour le moment", "No reviews yet")}</p>
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
