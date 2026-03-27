"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useCurrencyStore } from "@/store/currency";
import { formatServiceTitle } from "@/lib/format-service-title";

// ============================================================
// Types
// ============================================================

interface AgencyService {
  id: string;
  slug: string;
  title: string;
  basePrice: number;
  rating: number;
  ratingCount: number;
  orderCount?: number;
  image: string;
  categoryName: string;
}

interface AgencyReview {
  id: string;
  clientName: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  freelanceUsername?: string;
}

interface CaseStudy {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  keyResult?: string;
}

interface WorkProcessStep {
  step: number;
  title: string;
  description: string;
}

interface AgencyData {
  id: string;
  name: string;
  plan: string;
  kyc: number;
  memberSince: string;
  isVerified: boolean;
  team?: TeamMember[];
  caseStudies?: CaseStudy[];
  workProcess?: WorkProcessStep[];
  profile: {
    title: string;
    bio: string;
    photo: string;
    coverPhoto: string;
    city: string;
    country: string;
    skills: { name: string; level: string; percent: number }[];
    languages: { name: string; level: string; flag: string }[];
    links: { linkedin?: string; website?: string };
    badges: string[];
  } | null;
  services: AgencyService[];
  reviews: AgencyReview[];
  stats: {
    completedOrders: number;
    avgRating: number;
    totalReviews: number;
    activeServices: number;
    teamSize: number;
  };
}

// ============================================================
// Badge config
// ============================================================

const BADGE_CONFIG: Record<string, { labelKey: string; icon: string; color: string }> = {
  verified: { labelKey: "badge_verified", icon: "verified", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  premium: { labelKey: "badge_premium", icon: "workspace_premium", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  top_agency: { labelKey: "badge_top_agency", icon: "diamond", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
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
  "DevOps & Cloud": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
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
// Circular Progress Ring
// ============================================================

function CircularProgress({
  value,
  max,
  size = 72,
  strokeWidth = 5,
  color,
  bgColor = "text-slate-700/40",
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className={bgColor}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

function AgencySkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center animate-pulse">
      <div className="w-full max-w-[1200px] px-4 md:px-6 py-8">
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-xl min-h-[260px]" />
        <div className="flex flex-col md:flex-row gap-6 px-6 -mt-16 relative z-10">
          <div className="w-36 h-36 rounded-2xl bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-slate-800" />
          <div className="flex-1 space-y-3 pt-20 md:pt-0 pb-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-96 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-xl h-24" />
          ))}
        </div>
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

function NotFound({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20">
      <div className="size-20 rounded-2xl bg-slate-100 dark:bg-neutral-dark flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">apartment</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t("not_found_title")}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t("not_found_description")}</p>
      <Link href="/explorer" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all">
        {t("explore_agencies")}
      </Link>
    </div>
  );
}

// ============================================================
// Page Component
// ============================================================

const REVIEWS_PER_PAGE = 3;

export default function AgencyProfileClient() {
  const params = useParams();
  const slug = params.slug as string;
  const { format } = useCurrencyStore();
  const t = useTranslations("agency_profile");
  const locale = useLocale();

  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [contactOpen, setContactOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "reviews">("about");
  const [reviewPage, setReviewPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/public/agences/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.agency) {
          setAgency(data.agency);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <AgencySkeleton />;
  if (notFound || !agency) return <NotFound t={t} />;

  const profile = agency.profile;
  const stats = agency.stats;
  const reviews = agency.reviews || [];
  const services = agency.services || [];
  const badges = profile?.badges || [];
  const skills = profile?.skills || [];
  const links = profile?.links || {};
  const bio = profile?.bio || "";
  const bioLines = bio ? bio.split("\n").filter((l) => l.trim()) : [];

  const memberDate = agency.memberSince
    ? new Date(agency.memberSince).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", { month: "long", year: "numeric" })
    : "";

  const totalReviewPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = reviews.slice(
    reviewPage * REVIEWS_PER_PAGE,
    (reviewPage + 1) * REVIEWS_PER_PAGE
  );

  const avgRating = stats.avgRating.toFixed(1);

  // Add verified badge if applicable
  const allBadges = [...badges];
  if (agency.isVerified && !allBadges.includes("verified")) {
    allBadges.unshift("verified");
  }

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-[1200px] px-4 md:px-6 py-8">
        {/* ============================================================ */}
        {/* Cover + Logo + Info Section                                   */}
        {/* ============================================================ */}
        <div className="relative w-full">
          {/* Cover Image */}
          <div
            className="w-full bg-center bg-no-repeat bg-cover rounded-2xl min-h-[280px] relative overflow-hidden shadow-2xl"
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
            {/* Logo */}
            <div className="relative shrink-0">
              <div
                className="rounded-2xl border-4 border-background-dark w-36 h-36 shadow-2xl overflow-hidden"
                style={{ backgroundColor: profile?.photo ? undefined : "#6C2BD9" }}
              >
                {profile?.photo ? (
                  <img
                    src={profile.photo}
                    alt={agency.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {(agency.name || "A").charAt(0)}
                  </div>
                )}
              </div>
              {agency.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-3 border-background-dark rounded-full flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              )}
            </div>

            {/* Name & Info */}
            <div className="flex flex-col justify-end pb-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-slate-900 dark:text-slate-100 text-2xl md:text-3xl font-extrabold tracking-tight">
                  {agency.name}
                </h1>
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
              <p className="text-primary text-lg font-semibold">{profile?.title || t("agency_fallback")}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                {(profile?.city || profile?.country) && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    {[profile?.city, profile?.country].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">group</span>
                  {t("team_members_count", { count: stats.teamSize })}
                </span>
                {memberDate && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    {t("member_since", { date: memberDate })}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2 pb-2 self-start md:self-end flex-wrap">
              <button
                onClick={() => setContactOpen(!contactOpen)}
                className="h-11 px-5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-bold hover:bg-primary/20 transition-all text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                {t("contact_agency")}
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("agency-services");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="h-11 px-5 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-sm">storefront</span>
                {t("view_our_services")}
              </button>
            </div>
          </div>
        </div>

        {/* Contact Quick Form */}
        {contactOpen && (
          <div className="mt-6 bg-primary/5 dark:bg-white/5 border border-primary/10 rounded-xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">mail</span>
              {t("contact_name", { name: agency.name })}
            </h3>
            <textarea
              className="w-full p-3 rounded-lg border border-primary/20 bg-white dark:bg-neutral-dark text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
              rows={3}
              placeholder={t("contact_placeholder")}
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
          {/* Projets complétés */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-white/[0.06] dark:to-white/[0.02] rounded-2xl border border-primary/10 p-5 flex flex-col items-center">
            <div className="relative">
              <CircularProgress value={stats.completedOrders} max={Math.max(stats.completedOrders, 50)} color="#6C2BD9" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{stats.completedOrders}</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-3 text-center">{t("completed_projects")}</p>
          </div>

          {/* Note moyenne */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-amber-500/10 dark:to-amber-500/[0.02] rounded-2xl border border-amber-500/10 p-5 flex flex-col items-center">
            <div className="relative">
              <CircularProgress value={parseFloat(avgRating)} max={5} color="#f59e0b" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{avgRating}</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-3 text-center">{t("average_rating")}</p>
          </div>

          {/* Avis clients */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/10 dark:to-emerald-500/[0.02] rounded-2xl border border-emerald-500/10 p-5 flex flex-col items-center">
            <div className="relative">
              <CircularProgress value={stats.totalReviews} max={Math.max(stats.totalReviews, 30)} color="#10b981" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{stats.totalReviews}</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-3 text-center">{t("client_reviews")}</p>
          </div>

          {/* Services actifs */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/10 dark:to-blue-500/[0.02] rounded-2xl border border-blue-500/10 p-5 flex flex-col items-center">
            <div className="relative">
              <CircularProgress value={stats.activeServices} max={Math.max(stats.activeServices, 15)} color="#3b82f6" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{stats.activeServices}</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-3 text-center">{t("active_services")}</p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Main Grid                                                     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* Tabs: About / Reviews */}
            <section>
              <div className="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl mb-6">
                {(["about", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === "reviews") setReviewPage(0);
                    }}
                    className={cn(
                      "flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all",
                      activeTab === tab
                        ? "bg-white dark:bg-neutral-dark text-primary shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    {tab === "about" && t("tab_about")}
                    {tab === "reviews" && t("tab_reviews_count", { count: reviews.length })}
                  </button>
                ))}
              </div>

              {/* About Tab */}
              {activeTab === "about" && (
                <div className="space-y-6">
                  {/* Description */}
                  {bioLines.length > 0 && (
                    <div className="bg-gradient-to-br from-primary/5 to-transparent dark:from-white/[0.04] dark:to-transparent p-6 rounded-2xl border border-primary/10">
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

                  {/* Specialties */}
                  {skills.length > 0 && (
                    <div>
                      <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">psychology</span>
                        {t("specialties")}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s) => (
                          <span
                            key={s.name}
                            className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extra stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/30 text-center">
                      <span className="material-symbols-outlined text-2xl text-emerald-600 dark:text-emerald-400 mb-1">task_alt</span>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.completedOrders}</p>
                      <p className="text-xs text-slate-500">{t("completed_projects")}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 text-center">
                      <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400 mb-1">star</span>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{avgRating}/5</p>
                      <p className="text-xs text-slate-500">{t("average_rating")}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-200 dark:border-purple-800/30 text-center">
                      <span className="material-symbols-outlined text-2xl text-purple-600 dark:text-purple-400 mb-1">groups</span>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.teamSize}</p>
                      <p className="text-xs text-slate-500">{t("team_members")}</p>
                    </div>
                  </div>

                  {/* Work Process */}
                  {agency.workProcess && agency.workProcess.length > 0 && (
                    <div>
                      <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">timeline</span>
                        {t("our_process")}
                      </h3>
                      {/* Horizontal timeline on desktop, vertical stack on mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {agency.workProcess.map((step, idx) => (
                          <div key={step.step} className="relative bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 text-center">
                            {/* Connector line between steps (hidden on last step and on mobile single-col) */}
                            {idx < agency.workProcess!.length - 1 && (
                              <div className="hidden lg:block absolute top-[28px] -right-4 w-4 h-0.5 bg-primary/30 z-10" />
                            )}
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-primary/20">
                              <span className="font-black text-lg">{step.step}</span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{step.title}</h4>
                            <p className="text-xs text-slate-500">{step.description}</p>
                          </div>
                        ))}
                      </div>
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
                          <StarRating rating={parseFloat(avgRating)} size="base" />
                          <p className="text-xs text-slate-500 mt-1">{t("reviews_count", { count: reviews.length })}</p>
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
                                <span className="material-symbols-outlined text-xs fill-icon text-amber-400">
                                  star
                                </span>
                                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-400 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
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
                                  {t("reply_from", { name: agency.name })}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {review.reply}
                                </p>
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
                            onClick={() =>
                              setReviewPage(Math.min(totalReviewPages - 1, reviewPage + 1))
                            }
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
                      <p className="text-sm">{t("no_reviews_yet")}</p>
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
            {/* Agency Info Card */}
            <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-2xl border border-primary/10 shadow-sm">
              <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">apartment</span>
                {t("information")}
              </h3>
              <div className="space-y-4">
                {profile?.title && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">category</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t("sector")}</p>
                      <p className="text-sm font-semibold">{profile.title}</p>
                    </div>
                  </div>
                )}
                {(profile?.city || profile?.country) && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t("location")}</p>
                      <p className="text-sm font-semibold">{[profile?.city, profile?.country].filter(Boolean).join(", ")}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">groups</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t("team_size")}</p>
                    <p className="text-sm font-semibold">{t("team_members_count", { count: stats.teamSize })}</p>
                  </div>
                </div>
                {memberDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t("member_since_label")}</p>
                      <p className="text-sm font-semibold">{memberDate}</p>
                    </div>
                  </div>
                )}
                {links.website && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">language</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t("website")}</p>
                      <a
                        href={links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {links.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{t("projects")}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-2xl font-black">{stats.totalReviews}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{t("reviews")}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-2xl font-black">{stats.teamSize}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{t("members")}</p>
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
                {t("contact_cta_description", { name: agency.name })}
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
                <a
                  className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-all"
                  href={links.linkedin}
                  aria-label="LinkedIn"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.493-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-2v-3.86c0-.881-.719-1.6-1.6-1.6s-1.6.719-1.6 1.6v3.86h-2v-6h2v1.135c.671-.647 1.62-1.135 2.6-1.135 1.989 0 3.6 1.611 3.6 3.6v2.399z" />
                  </svg>
                </a>
              )}
              {links.website && (
                <a
                  className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-all"
                  href={links.website}
                  aria-label="Website"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined text-xl">language</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Notre Equipe                                                   */}
      {/* Show team cards if members exist, otherwise show summary count  */}
      <div className="w-full max-w-[1200px] px-4 md:px-6 pb-8">
        <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-extrabold flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">groups</span>
          {t("our_team")}
          {agency.team && agency.team.length > 0 && (
            <span className="ml-1 text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {agency.team.length}
            </span>
          )}
        </h2>
        {agency.team && agency.team.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agency.team.map((member) => {
              const initials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
              const card = (
                <div className={cn(
                  "bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center",
                  member.freelanceUsername && "cursor-pointer"
                )}>
                  {member.avatar && (member.avatar.startsWith("http") || member.avatar.startsWith("/")) ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 text-primary font-bold text-lg">
                      {initials}
                    </div>
                  )}
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{member.name}</h4>
                  <p className="text-xs text-primary font-semibold mb-3">{member.role}</p>
                  {(member.skills ?? []).length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {(member.skills ?? []).slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-semibold rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
              if (member.freelanceUsername) {
                return (
                  <Link key={member.id} href={`/freelances/${member.freelanceUsername}`}>
                    {card}
                  </Link>
                );
              }
              return <div key={member.id}>{card}</div>;
            })}
          </div>
        ) : (
          <div className="bg-primary/5 dark:bg-white/5 p-6 rounded-xl border border-primary/10 text-center">
            <span className="material-symbols-outlined text-3xl text-primary mb-2">group</span>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
              {t("team_summary", { count: stats.teamSize })}
            </p>
          </div>
        )}
      </div>

      {/* Nos Realisations                                               */}
      {agency.caseStudies && agency.caseStudies.length > 0 && (
        <div className="w-full max-w-[1200px] px-4 md:px-6 pb-8">
          <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-extrabold flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary text-3xl">palette</span>
            {t("our_portfolio")}
            <span className="ml-1 text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {agency.caseStudies.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {agency.caseStudies.map((project) => (
              <div key={project.id} className="group bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-video bg-slate-100 dark:bg-background-dark relative overflow-hidden">
                  {project.image ? (
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary/90 text-white text-[11px] font-bold rounded-full backdrop-blur-sm">
                    {project.category}
                  </span>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{project.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{project.description}</p>
                  {project.keyResult && (
                    <div className="mt-3 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="material-symbols-outlined text-sm fill-icon">emoji_events</span>
                      <span className="text-xs font-semibold">{t("key_result")} : {project.keyResult}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nos services -- visible section for all visitors              */}
      {/* ============================================================ */}
      {services.length > 0 && (
        <div id="agency-services" className="w-full max-w-[1200px] px-4 md:px-6 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-extrabold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
              {t("our_services")}
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
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                      </div>
                    )}
                    {/* Category badge on image */}
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
                      {formatServiceTitle(service.title)}
                    </h4>

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <StarRating rating={service.rating} />
                        <span className="text-xs text-slate-500">
                          {service.rating} ({service.ratingCount})
                        </span>
                      </div>
                      {(service.orderCount ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="material-symbols-outlined text-sm text-emerald-500">shopping_bag</span>
                          <span className="font-semibold">{service.orderCount} {service.orderCount > 1 ? "ventes" : "vente"}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border-dark">
                      <span className="text-sm font-black text-primary">
                        {t("from_price", { price: format(service.basePrice) })}
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
                href={`/explorer?agence=${slug}`}
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
