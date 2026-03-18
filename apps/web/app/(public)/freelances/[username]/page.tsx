"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useCurrencyStore } from "@/store/currency";
import { analytics } from "@/lib/analytics";

// ============================================================
// Types
// ============================================================

interface Skill {
  name: string;
  level: string;
  percent: number;
}

interface ServiceCard {
  id: string;
  slug: string;
  title: string;
  basePrice: number;
  rating: number;
  ratingCount: number;
  image: string;
  categoryName: string;
}

interface Education {
  title: string;
  school: string;
  year: string;
  type: "diploma" | "certification";
}

interface Language {
  name: string;
  level: string;
  flag: string;
}

interface Review {
  id: string;
  clientName: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
}

interface Certificate {
  id: string;
  code: string;
  formationTitle: string;
  instructorName: string;
  score: number;
  issuedAt: string;
}

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  skills: string[];
  featured: boolean;
}

interface FreelancerData {
  id: string;
  name: string;
  role: string;
  status: string;
  memberSince: string;
  portfolio?: PortfolioProject[];
  profile: {
    title: string;
    bio: string;
    photo: string;
    coverPhoto: string;
    city: string;
    country: string;
    hourlyRate: number;
    skills: Skill[];
    languages: Language[];
    education: Education[];
    links: { linkedin?: string; github?: string; portfolio?: string };
    completionPercent: number;
    badges: string[];
    availability: { availableNow: boolean; calendar: Record<string, unknown> };
    vacationMode: boolean;
  } | null;
  badge: string;
  services: ServiceCard[];
  reviews: Review[];
  certificates?: Certificate[];
  stats: {
    completedOrders: number;
    totalOrders: number;
    completionRate: number;
    avgRating: number;
    totalReviews: number;
    activeServices: number;
  };
}

// ============================================================
// Badge config
// ============================================================

const BADGE_CONFIG: Record<string, { labelKey: string; icon: string; color: string }> = {
  verified: { labelKey: "badge_verified", icon: "verified", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  top_rated: { labelKey: "badge_top_rated", icon: "bolt", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  pro: { labelKey: "badge_pro", icon: "workspace_premium", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  elite: { labelKey: "badge_elite", icon: "diamond", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  rising_talent: { labelKey: "badge_rising_talent", icon: "trending_up", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  ELITE: { labelKey: "badge_elite", icon: "diamond", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  "TOP RATED": { labelKey: "badge_top_rated", icon: "bolt", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  "RISING TALENT": { labelKey: "badge_rising_talent", icon: "trending_up", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
};

// ============================================================
// Category colors
// ============================================================

const CATEGORY_COLORS: Record<string, string> = {
  "Developpement Web": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Développement Web": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Développement": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Design UI/UX": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Design": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Backend & API": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Mobile": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "E-commerce": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "Marketing Digital": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "Marketing": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "Consulting": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Data & Analytics": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  "Rédaction": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "Traduction": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

// ============================================================
// Star Rating Component
// ============================================================

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "base" }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <span key={i} className={cn("material-symbols-outlined fill-icon text-primary", size === "sm" ? "text-sm" : "text-base")}>star</span>
      );
    } else if (i - 0.5 <= rating) {
      stars.push(
        <span key={i} className={cn("material-symbols-outlined fill-icon text-primary", size === "sm" ? "text-sm" : "text-base")}>star_half</span>
      );
    } else {
      stars.push(
        <span key={i} className={cn("material-symbols-outlined text-slate-400", size === "sm" ? "text-sm" : "text-base")}>star</span>
      );
    }
  }
  return <div className="flex">{stars}</div>;
}

// ============================================================
// Loading Skeleton
// ============================================================

function ProfileSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center animate-pulse">
      <div className="w-full max-w-[1100px] px-4 md:px-10 py-8">
        {/* Cover */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-xl min-h-[260px]" />
        {/* Avatar + info */}
        <div className="flex flex-col md:flex-row gap-6 px-6 -mt-16 relative z-10">
          <div className="w-40 h-40 rounded-2xl bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-slate-800" />
          <div className="flex-1 space-y-3 pt-20 md:pt-0 pb-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-96 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl h-24" />
          ))}
        </div>
        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 404 Component
// ============================================================

function NotFound() {
  const t = useTranslations("freelance_profile");
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20">
      <div className="size-20 rounded-2xl bg-slate-100 dark:bg-neutral-dark flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">person_off</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t("not_found_title")}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t("not_found_description")}</p>
      <Link href="/explorer" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all">
        {t("back_home")}
      </Link>
    </div>
  );
}

// ============================================================
// Page Component
// ============================================================

const REVIEWS_PER_PAGE = 3;

export default function FreelanceProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { format } = useCurrencyStore();
  const t = useTranslations("freelance_profile");
  const locale = useLocale();

  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [contactOpen, setContactOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "portfolio" | "reviews" | "certifications">("about");
  const [reviewPage, setReviewPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/public/freelances/${encodeURIComponent(username)}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.freelance) {
          setFreelancer(data.freelance);
          analytics.profileViewed(data.freelance.id || username);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [username]);

  if (loading) return <ProfileSkeleton />;
  if (notFound || !freelancer) return <NotFound />;

  const profile = freelancer.profile;
  const stats = freelancer.stats;
  const reviews = freelancer.reviews || [];
  const certificates = freelancer.certificates || [];
  const services = freelancer.services || [];
  const skills = profile?.skills || [];
  const badges = profile?.badges || [];
  const languages = profile?.languages || [];
  const education = profile?.education || [];
  const links = profile?.links || {};
  const available = profile?.availability?.availableNow ?? false;
  const bio = profile?.bio || "";
  const bioLines = bio ? bio.split("\n").filter((l) => l.trim()) : [];

  const memberDate = freelancer.memberSince
    ? new Date(freelancer.memberSince).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", { month: "long", year: "numeric" })
    : "";

  const totalReviewPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = reviews.slice(
    reviewPage * REVIEWS_PER_PAGE,
    (reviewPage + 1) * REVIEWS_PER_PAGE
  );

  const avgRating = stats.avgRating.toFixed(1);

  // Derive badge from API response
  const allBadges = [...badges];
  if (freelancer.badge && !allBadges.includes(freelancer.badge)) {
    allBadges.unshift(freelancer.badge);
  }

  // Extract tags from skills (lower-level skills)
  const tags = skills.slice(3).map((s) => s.name);

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-[1100px] px-4 md:px-10 py-8">
        {/* ============================================================ */}
        {/* Hero / Header                                                 */}
        {/* ============================================================ */}
        <div className="relative w-full">
          {/* Cover Image */}
          <div
            className="w-full bg-center bg-no-repeat bg-cover rounded-xl min-h-[260px] relative overflow-hidden shadow-xl"
            style={{
              backgroundImage: profile?.coverPhoto
                ? `url("${profile.coverPhoto}")`
                : "linear-gradient(135deg, #6C2BD9 0%, #0EA5E9 100%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent" />
          </div>

          {/* Profile Info Row */}
          <div className="flex flex-col md:flex-row gap-6 px-6 -mt-16 relative z-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl border-4 border-background-dark w-40 h-40 shadow-2xl"
                style={{
                  backgroundImage: profile?.photo
                    ? `url("${profile.photo}")`
                    : undefined,
                  backgroundColor: profile?.photo ? undefined : "#6C2BD9",
                }}
              >
                {!profile?.photo && (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {freelancer.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Online indicator */}
              {available && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-3 border-background-dark rounded-full" />
              )}
            </div>

            {/* Name & Info */}
            <div className="flex flex-col justify-end pb-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-slate-900 dark:text-slate-100 text-2xl md:text-3xl font-extrabold tracking-tight">
                  {freelancer.name}
                </h1>
                {profile?.vacationMode ? (
                  <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-amber-500/20 px-3 border border-amber-500/30">
                    <span className="material-symbols-outlined text-amber-500 text-sm">
                      beach_access
                    </span>
                    <p className="text-amber-500 text-xs font-bold uppercase tracking-wider">
                      En vacances
                    </p>
                  </div>
                ) : available ? (
                  <div className="flex h-7 items-center justify-center gap-x-1.5 rounded-full bg-primary/20 px-3 border border-primary/30">
                    <span className="material-symbols-outlined text-primary text-sm fill-icon">
                      check_circle
                    </span>
                    <p className="text-primary text-xs font-bold uppercase tracking-wider">
                      {t("available")}
                    </p>
                  </div>
                ) : null}
                {/* Badges */}
                {allBadges.map((b) => {
                  const cfg = BADGE_CONFIG[b];
                  if (!cfg) return null;
                  return (
                    <span
                      key={b}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        cfg.color
                      )}
                    >
                      <span className="material-symbols-outlined text-xs fill-icon">{cfg.icon}</span>
                      {t(cfg.labelKey)}
                    </span>
                  );
                })}
              </div>
              <p className="text-primary text-lg font-semibold">{profile?.title || t("freelance")}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                {(profile?.city || profile?.country) && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    {[profile?.city, profile?.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {stats.completedOrders > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">work_history</span>
                    {stats.completedOrders} {t("completed_orders")}
                  </span>
                )}
                {memberDate && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    {t("member_since")} {memberDate}
                  </span>
                )}
                {profile?.hourlyRate ? (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">payments</span>
                    {format(profile.hourlyRate)}/h
                  </span>
                ) : null}
              </div>
              {/* Rating row */}
              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={parseFloat(avgRating)} size="base" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{avgRating}</span>
                <span className="text-sm text-slate-500">({stats.totalReviews} {t("reviews")})</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pb-2 self-start md:self-end">
              <button
                onClick={() => setContactOpen(!contactOpen)}
                className="h-11 px-5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                {t("send_message")}
              </button>
              <Link
                href="/inscription"
                className="h-11 px-5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 text-sm justify-center"
              >
                <span className="material-symbols-outlined text-sm">storefront</span>
                {t("order_service")}
              </Link>
              <button className="h-11 px-5 rounded-lg border border-slate-200 dark:border-border-dark text-slate-500 font-bold hover:border-primary/30 hover:text-primary transition-all text-sm flex items-center gap-2 justify-center">
                <span className="material-symbols-outlined text-sm">favorite_border</span>
                {t("favorites")}
              </button>
            </div>
          </div>
        </div>

        {/* Contact Quick Form (toggle) */}
        {contactOpen && (
          <div className="mt-6 bg-primary/5 dark:bg-white/5 border border-primary/10 rounded-xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">mail</span>
              {t("send_message_to", { name: freelancer.name })}
            </h3>
            <textarea
              className="w-full p-3 rounded-lg border border-primary/20 bg-white dark:bg-neutral-dark text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
              rows={3}
              placeholder={t("describe_project")}
            />
            <button className="mt-3 px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all">
              {t("send")}
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* Stats Row                                                     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: "task_alt", label: t("completed_orders"), value: stats.completedOrders.toString(), color: "text-primary" },
            { icon: "thumb_up", label: t("completion_rate"), value: `${stats.completionRate}%`, color: "text-emerald-500" },
            { icon: "star", label: t("average_rating"), value: avgRating, color: "text-blue-500" },
            { icon: "storefront", label: t("active_services"), value: stats.activeServices.toString(), color: "text-amber-500" },
          ].map((s) => (
            <div key={s.label} className="bg-primary/5 dark:bg-white/5 rounded-xl border border-primary/10 p-4 text-center">
              <span className={cn("material-symbols-outlined text-2xl mb-1", s.color)}>{s.icon}</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* Main Grid                                                     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* Tabs: About / Portfolio / Reviews */}
            <section>
              <div className="flex border-b border-slate-200 dark:border-border-dark mb-6">
                {(["about", "reviews", "certifications"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === "reviews") setReviewPage(0);
                    }}
                    className={cn(
                      "px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px",
                      activeTab === tab
                        ? "text-primary border-primary"
                        : "text-slate-500 border-transparent hover:text-slate-700"
                    )}
                  >
                    {tab === "about" && t("tab_about")}
                    {tab === "reviews" && `${t("tab_reviews")} (${reviews.length})`}
                    {tab === "certifications" && `Certifications${certificates.length > 0 ? ` (${certificates.length})` : ""}`}
                  </button>
                ))}
              </div>

              {/* About Tab */}
              {activeTab === "about" && (
                <div className="space-y-8">
                  {/* Bio */}
                  {bioLines.length > 0 && (
                    <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-xl border border-primary/10">
                      {bioLines.map((p, i) => (
                        <p
                          key={i}
                          className={cn(
                            "text-slate-700 dark:text-slate-300 leading-relaxed",
                            i > 0 && "mt-4"
                          )}
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Formation & Certifications */}
                  {education.length > 0 && (
                    <div>
                      <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">school</span>
                        {t("education")}
                      </h3>
                      <div className="space-y-3">
                        {education.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-4 bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-4"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                              f.type === "diploma" ? "bg-blue-500/10" : "bg-amber-500/10"
                            )}>
                              <span className={cn(
                                "material-symbols-outlined text-lg",
                                f.type === "diploma" ? "text-blue-500" : "text-amber-500"
                              )}>
                                {f.type === "diploma" ? "school" : "verified"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 dark:text-white">{f.title}</p>
                              <p className="text-xs text-slate-500">{f.school} - {f.year}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {languages.length > 0 && (
                    <div>
                      <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">translate</span>
                        {t("languages")}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {languages.map((lang) => (
                          <div
                            key={lang.name}
                            className="flex items-center gap-2 bg-white dark:bg-neutral-dark border border-slate-200 dark:border-border-dark rounded-lg px-4 py-2.5"
                          >
                            {lang.flag && <span className="text-lg">{lang.flag}</span>}
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{lang.name}</span>
                            <span className="text-xs text-slate-500">({lang.level})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extra stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/30 text-center">
                      <span className="material-symbols-outlined text-2xl text-emerald-600 dark:text-emerald-400 mb-1">task_alt</span>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.completedOrders}</p>
                      <p className="text-xs text-slate-500">{t("completed_orders")}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 text-center">
                      <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400 mb-1">percent</span>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.completionRate}%</p>
                      <p className="text-xs text-slate-500">{t("completion_rate")}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-200 dark:border-purple-800/30 text-center">
                      <span className="material-symbols-outlined text-2xl text-purple-600 dark:text-purple-400 mb-1">star</span>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{avgRating}/5</p>
                      <p className="text-xs text-slate-500">{t("average_rating")}</p>
                    </div>
                  </div>
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
                          <StarRating rating={parseFloat(avgRating)} size="base" />
                          <p className="text-xs text-slate-500 mt-1">{reviews.length} {t("reviews")}</p>
                        </div>
                        <div className="flex-1 space-y-1">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviews.filter(
                              (r) => Math.floor(r.rating) === star
                            ).length;
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

                      {/* Review List */}
                      <div className="space-y-4">
                        {paginatedReviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-white dark:bg-neutral-dark p-5 rounded-xl border border-slate-200 dark:border-border-dark"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                  {review.clientName?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "?"}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{review.clientName}</p>
                                  <p className="text-slate-500 text-xs">{t("client")}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <StarRating rating={review.rating} />
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(review.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-400 text-sm">{review.comment}</p>
                            {review.reply && (
                              <div className="mt-3 ml-6 pl-4 border-l-2 border-primary/20">
                                <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">reply</span>
                                  {t("reply_from", { name: freelancer.name })}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{review.reply}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalReviewPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <button
                            onClick={() => setReviewPage(Math.max(0, reviewPage - 1))}
                            disabled={reviewPage === 0}
                            className="p-2 rounded-lg border border-slate-200 dark:border-border-dark disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-border-dark transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                          </button>
                          {Array.from({ length: totalReviewPages }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setReviewPage(i)}
                              className={cn(
                                "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                                i === reviewPage
                                  ? "bg-primary text-white"
                                  : "border border-slate-200 dark:border-border-dark text-slate-500 hover:bg-slate-100 dark:hover:bg-border-dark"
                              )}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setReviewPage(Math.min(totalReviewPages - 1, reviewPage + 1))}
                            disabled={reviewPage === totalReviewPages - 1}
                            className="p-2 rounded-lg border border-slate-200 dark:border-border-dark disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-border-dark transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-2 block">rate_review</span>
                      <p className="text-sm">{t("no_reviews")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Certifications Tab */}
              {activeTab === "certifications" && (
                <div>
                  {certificates.length > 0 ? (
                    <div className="space-y-4">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="bg-white dark:bg-neutral-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:shadow-sm transition-shadow">
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
                              Verifier
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-2 block">school</span>
                      <p className="text-sm">Aucune certification pour le moment</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ============================================================ */}
          {/* Right Column: Sidebar                                        */}
          {/* ============================================================ */}
          <div className="space-y-6">
            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-2xl border border-primary/10 shadow-sm">
                <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  {t("skills")}
                </h3>
                <div className="space-y-5">
                  {skills.slice(0, 5).map((skill) => {
                    const levelColor =
                      skill.level === "Expert" ? "bg-emerald-500" :
                      skill.level === "Avance" || skill.level === "Avancé" ? "bg-blue-500" :
                      skill.level === "Intermediaire" || skill.level === "Intermédiaire" ? "bg-amber-500" :
                      "bg-slate-400";
                    const levelTextColor =
                      skill.level === "Expert" ? "text-emerald-500" :
                      skill.level === "Avance" || skill.level === "Avancé" ? "text-blue-500" :
                      skill.level === "Intermediaire" || skill.level === "Intermédiaire" ? "text-amber-500" :
                      "text-slate-400";
                    return (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">{skill.name}</span>
                          <span className={cn("font-bold", levelTextColor)}>{skill.level}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", levelColor)}
                            style={{ width: `${skill.percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-primary/10 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-primary p-6 rounded-2xl text-white shadow-xl shadow-primary/10">
              <h4 className="font-bold mb-4 opacity-90 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">bar_chart</span>
                {t("in_numbers")}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-2xl font-black">{avgRating}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{t("average_rating")}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-2xl font-black">{stats.completedOrders}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{t("orders")}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-2xl font-black">{stats.completionRate}%</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{t("completion")}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-2xl font-black">{stats.activeServices}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{t("services")}</p>
                </div>
              </div>
            </div>

            {/* CTA Contact Card */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/30">
              <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">handshake</span>
                {t("have_a_project")}
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-300/70 mb-4">
                {t("contact_for_quote", { name: freelancer.name })}
              </p>
              <button
                onClick={() => setContactOpen(true)}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
              >
                {t("request_quote")}
              </button>
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-4 py-2">
              {links.linkedin && (
                <a className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" href={links.linkedin} aria-label="LinkedIn">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.493-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-2v-3.86c0-.881-.719-1.6-1.6-1.6s-1.6.719-1.6 1.6v3.86h-2v-6h2v1.135c.671-.647 1.62-1.135 2.6-1.135 1.989 0 3.6 1.611 3.6 3.6v2.399z" />
                  </svg>
                </a>
              )}
              {links.github && (
                <a className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" href={links.github} aria-label="GitHub">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              )}
              {links.portfolio && (
                <a className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" href={links.portfolio} aria-label="Portfolio">
                  <span className="material-symbols-outlined text-xl">language</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Portfolio                                                      */}
      {/* ============================================================ */}
      {freelancer.portfolio && freelancer.portfolio.length > 0 && (
        <div className="w-full max-w-[1100px] px-4 md:px-10 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-extrabold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">palette</span>
              Portfolio
              <span className="ml-1 text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                {freelancer.portfolio.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[...freelancer.portfolio]
              .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
              .map((project) => (
                <div
                  key={project.id}
                  className="group bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
                >
                  {/* Featured badge */}
                  {project.featured && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-amber-500/90 text-white text-[11px] font-bold rounded-full backdrop-blur-sm">
                      <span className="material-symbols-outlined text-xs">star</span>
                      Coup de coeur
                    </div>
                  )}

                  {/* Image */}
                  <div className="aspect-video bg-slate-100 dark:bg-background-dark relative overflow-hidden">
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description}</p>

                    {/* Skills tags */}
                    {project.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-semibold rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Link */}
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        Voir le projet
                      </a>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Mes services -- visible section for ALL visitors              */}
      {/* ============================================================ */}
      {services.length > 0 && (
        <div className="w-full max-w-[1100px] px-4 md:px-10 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-extrabold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
              {t("my_services")}
              <span className="ml-1 text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                {services.length}
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.slice(0, 6).map((service) => {
              const catColor =
                CATEGORY_COLORS[service.categoryName] ||
                "bg-slate-500/10 text-slate-600 dark:text-slate-400";

              return (
                <Link
                  key={service.id}
                  href={`/services/${service.slug || service.id}`}
                  className="group bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-slate-100 dark:bg-background-dark relative overflow-hidden">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                      </div>
                    )}
                    {/* Category badge */}
                    <span
                      className={cn(
                        "absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm",
                        catColor
                      )}
                    >
                      {service.categoryName}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h4>

                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={service.rating} />
                      <span className="text-xs text-slate-500">
                        {service.rating} ({service.ratingCount} {t("reviews")})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border-dark">
                      <span className="text-sm font-black text-primary">
                        {t("from")} {format(service.basePrice)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Show all button if more than 6 services */}
          {services.length > 6 && (
            <div className="flex justify-center mt-8">
              <Link
                href={`/explorer?freelance=${username}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors border border-primary/20"
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
                {t("view_all_services", { count: services.length })}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
