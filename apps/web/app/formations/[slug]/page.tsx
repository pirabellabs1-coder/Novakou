"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Star, Clock, Users, Award, Play, FileText, BookOpen, Calendar,
  CheckCircle, ChevronDown, ChevronRight, Share2, Heart,
  Globe, BarChart, ShoppingCart, Zap, Smartphone, Download,
  AlertCircle, ChevronUp,
} from "lucide-react";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import { CountdownTimer } from "@/components/formations/CountdownTimer";
import { useEntityTracker } from "@/lib/tracking/useEntityTracker";
import { StockCounter } from "@/components/formations/StockCounter";
import { firePixelEvent } from "@/components/formations/PixelTracker";
import DynamicIcon from "@/components/ui/DynamicIcon";
import FormationCard from "@/components/formations/FormationCard";
import type { FormationCardData } from "@/components/formations/FormationCard";
import FreeLessonPreviewModal from "@/components/formations/FreeLessonPreviewModal";
import {
  getFormationFavorites,
  toggleFormationFavorite,
  addFavoriteServer,
  removeFavoriteServer,
} from "@/lib/formations/favorites";

// ── Types ──────────────────────────────────────────────────────

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  response: string | null;
  user: { name: string; avatar: string | null; image: string | null };
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  isFree: boolean;
  order: number;
  quiz: { id: string } | null;
  resources: { id: string; title: string }[];
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Formation {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  description: string | null;
  learnPoints: string[];
  requirements: string[];
  targetAudience: string | null;
  thumbnail: string | null;
  previewVideo: string | null;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  duration: number;
  level: string;
  language: string[];
  hasCertificate: boolean;
  minScore: number;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  category: { name: string; slug: string; color: string | null };
  sections: Section[];
  reviews: Review[];
  instructeur: {
    id: string;
    bioFr: string | null;
    bioEn: string | null;
    expertise: string[];
    linkedin: string | null;
    website: string | null;
    user: {
      name: string;
      avatar: string | null;
      image: string | null;
      _count?: { formations: number };
    };
    _count?: { formations: number };
  };
  _count?: { enrollments: number };
  maxStudents?: number | null;
  isGroupFormation?: boolean;
  flashPromo?: {
    id: string;
    discountPct: number;
    endsAt: string;
    maxUsage: number | null;
    usageCount: number;
  } | null;
  cohorts?: FormationCohortPublic[];
}

interface FormationCohortPublic {
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
}

// ── Helpers ────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${cls} ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
    </span>
  );
}

function LessonTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "VIDEO": return <Play className="w-3.5 h-3.5 text-blue-500" />;
    case "PDF": return <FileText className="w-3.5 h-3.5 text-red-500" />;
    case "TEXTE": return <BookOpen className="w-3.5 h-3.5 text-green-500" />;
    case "QUIZ": return <AlertCircle className="w-3.5 h-3.5 text-purple-500" />;
    default: return <BookOpen className="w-3.5 h-3.5 text-slate-400" />;
  }
}

// ── Main page ──────────────────────────────────────────────────

export default function FormationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations("formations");
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  const [formation, setFormation] = useState<Formation | null>(null);
  const [similarFormations, setSimilarFormations] = useState<FormationCardData[]>([]);

  // Track formation view — APRES la declaration de formation
  useEntityTracker("formation", formation?.id ?? null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "instructor" | "reviews" | "cohorts">("overview");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ discount: number; code: string } | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllLearnPoints, setShowAllLearnPoints] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/formations/${slug}`)
      .then((r) => {
        if (r.status === 404) { router.replace("/formations"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setFormation(data);
          // Open first section by default
          if (data.sections?.length > 0) {
            setExpandedSections(new Set([data.sections[0].id]));
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, router]);

  useEffect(() => {
    if (!session?.user || !formation) return;
    fetch(`/api/formations/${formation.id}/progress`)
      .then((r) => {
        if (r.status === 404) { setIsEnrolled(false); return; }
        if (!r.ok) return;
        return r.json();
      })
      .then((d) => {
        if (d && d.id) setIsEnrolled(true);
      })
      .catch(() => {});
  }, [session, formation]);

  // Init favorite status from localStorage
  useEffect(() => {
    if (!formation) return;
    const favs = getFormationFavorites();
    setIsFavorite(favs.includes(formation.id));
  }, [formation]);

  // Toggle favorite handler
  const handleToggleFavorite = () => {
    if (!formation) return;
    const nowFavorite = toggleFormationFavorite(formation.id);
    setIsFavorite(nowFavorite);
    // Sync to server if authenticated
    if (session?.user) {
      if (nowFavorite) {
        addFavoriteServer(formation.id);
      } else {
        removeFavoriteServer(formation.id);
      }
    }
  };

  // Fetch similar formations
  useEffect(() => {
    if (!formation?.category?.slug) return;
    fetch(`/api/formations?category=${formation.category.slug}&limit=4&sort=populaire`)
      .then((r) => r.json())
      .then((data) => {
        const items = (data.formations ?? []).filter((f: FormationCardData) => f.id !== formation.id).slice(0, 4);
        setSimilarFormations(items);
      })
      .catch(() => {});
  }, [formation]);

  const addToCart = async () => {
    if (!session?.user) { router.push("/formations/connexion"); return; }
    if (!formation) return;
    setAddingToCart(true);
    try {
      const res = await fetch("/api/formations/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId: formation.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        showToast(err.error || (locale === "fr" ? "Erreur lors de l'ajout" : "Error adding to cart"), "error");
        return;
      }
      firePixelEvent("AddToCart", {
        value: formation.price,
        currency: "EUR",
        content_id: formation.id,
        content_name: formation.title,
      });
      showToast(locale === "fr" ? "Formation ajoutée au panier !" : "Course added to cart!");
      setTimeout(() => router.push("/formations/panier"), 800);
    } catch {
      showToast(locale === "fr" ? "Erreur réseau" : "Network error", "error");
    }
    finally { setAddingToCart(false); }
  };

  const buyNow = async () => {
    if (!session?.user) { router.push("/formations/connexion"); return; }
    if (!formation) return;
    setAddingToCart(true);
    try {
      const cartRes = await fetch("/api/formations/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId: formation.id }),
      });
      if (!cartRes.ok) {
        const err = await cartRes.json().catch(() => ({ error: "Erreur" }));
        showToast(err.error || (locale === "fr" ? "Erreur lors de l'ajout" : "Error adding to cart"), "error");
        return;
      }
      const res = await fetch("/api/formations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: promoApplied?.code, locale }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur" }));
        showToast(err.error || (locale === "fr" ? "Erreur lors du paiement" : "Payment error"), "error");
        return;
      }
      const data = await res.json();
      if (data.mock) {
        router.push(`/formations/succes?session_id=${data.sessionId}`);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      showToast(locale === "fr" ? "Erreur réseau" : "Network error", "error");
    }
    finally { setAddingToCart(false); }
  };

  const applyPromo = async () => {
    if (!promoCode.trim() || !formation) return;
    try {
      const res = await fetch(`/api/formations/cart/promo?code=${encodeURIComponent(promoCode)}&formationId=${formation.id}`);
      const data = await res.json();
      if (data.valid) {
        setPromoApplied({ discount: data.discountAmount, code: promoCode });
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 dark:bg-neutral-dark">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded w-1/2" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300">Formation introuvable</h2>
        <Link href="/formations" className="mt-4 inline-block text-primary hover:underline font-semibold">
          Retour aux formations
        </Link>
      </div>
    );
  }

  const title = formation.title;
  const desc = formation.description;
  const shortDesc = formation.shortDesc;
  const learnPoints = formation.learnPoints ?? [];
  const requirements = formation.requirements ?? [];
  const targetAudience = formation.targetAudience;
  const catName = formation.category.name;
  const instrBio = locale === "fr" ? formation.instructeur.bioFr : (formation.instructeur.bioEn || formation.instructeur.bioFr);
  const instrAvatar = formation.instructeur.user.avatar || formation.instructeur.user.image;

  const sections = formation.sections ?? [];
  const totalLessons = sections.reduce((s, sec) => s + (sec.lessons ?? []).length, 0);
  const freeLessons = sections.reduce((s, sec) => s + (sec.lessons ?? []).filter((l) => l.isFree).length, 0);
  const totalResources = sections.reduce((s, sec) => s + (sec.lessons ?? []).reduce((ls, l) => ls + (l.resources ?? []).length, 0), 0);

  // Flash promo price
  const flashDiscountedPrice = formation.flashPromo
    ? formation.price * (1 - formation.flashPromo.discountPct / 100)
    : null;
  // Promo code or flash promo — use the better deal
  const codeDiscountedPrice = promoApplied ? Math.max(0, formation.price - promoApplied.discount) : null;
  const finalPrice = Math.min(
    flashDiscountedPrice ?? formation.price,
    codeDiscountedPrice ?? formation.price
  );
  const discount = formation.originalPrice && formation.originalPrice > formation.price
    ? Math.round((1 - formation.price / formation.originalPrice) * 100)
    : null;

  const levelLabel = {
    DEBUTANT: locale === "fr" ? "Débutant" : "Beginner",
    INTERMEDIAIRE: locale === "fr" ? "Intermédiaire" : "Intermediate",
    AVANCE: locale === "fr" ? "Avancé" : "Advanced",
    TOUS_NIVEAUX: locale === "fr" ? "Tous niveaux" : "All Levels",
  }[formation.level] ?? formation.level;

  const displayedReviews = showAllReviews ? formation.reviews : formation.reviews.slice(0, 4);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 dark:bg-neutral-dark">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in slide-in-from-top-2 ${
          toast.type === "success"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-4">
            <Link href="/formations" className="hover:text-white transition-colors">{locale === "fr" ? "Formations" : "Courses"}</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/formations/categories/${formation.category.slug}`} className="hover:text-white transition-colors">{catName}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300 truncate max-w-xs">{title}</span>
          </nav>

          <div className="lg:max-w-[65%]">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">{title}</h1>
            {shortDesc && <p className="text-slate-300 text-base mb-4 leading-relaxed">{shortDesc}</p>}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {/* Rating */}
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-amber-400">{formation.rating.toFixed(1)}</span>
                <StarRating rating={formation.rating} />
                <span className="text-slate-400">({(formation.reviewsCount ?? 0).toLocaleString()} {t("reviews")})</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-4 h-4" />
                {formation.studentsCount.toLocaleString()} {t("students")}
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <BarChart className="w-4 h-4" />
                {levelLabel}
              </span>
            </div>

            {/* Instructor + meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span>
                {locale === "fr" ? "Par" : "By"}{" "}
                <Link href={`/formations/instructeurs/${formation.instructeur.id}`} className="text-blue-400 hover:underline">
                  {formation.instructeur.user.name}
                </Link>
              </span>
              {formation.updatedAt && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {t("last_updated")} {new Date(formation.updatedAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}
                </span>
              )}
              {(formation.language ?? []).length > 0 && (
                <span>{(formation.language ?? []).map((l) => l === "fr" ? "🇫🇷 Français" : "🇬🇧 English").join(", ")}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 relative">
          {/* Left column (65%) */}
          <div className="flex-1 min-w-0 lg:max-w-[65%]">
            {/* Tabs */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 dark:bg-neutral-dark z-10 border-b dark:border-border-dark mb-6">
              <div className="flex gap-6">
                {(["overview", "curriculum", "instructor", "reviews", ...(formation.isGroupFormation && formation.cohorts?.length ? ["cohorts" as const] : [])] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab === "overview" && t("tab_overview")}
                    {tab === "curriculum" && t("tab_curriculum")}
                    {tab === "instructor" && t("tab_instructor")}
                    {tab === "reviews" && t("tab_reviews")}
                    {tab === "cohorts" && (locale === "fr" ? "Cohortes" : "Cohorts")}
                  </button>
                ))}
              </div>
            </div>

            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Preview video */}
                {formation.previewVideo && (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video">
                    <iframe
                      src={formation.previewVideo.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* What you'll learn */}
                {learnPoints.length > 0 && (
                  <div className="border border-green-200 dark:border-green-900 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t("what_you_learn")}</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {learnPoints.slice(0, showAllLearnPoints ? learnPoints.length : 6).map((point, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{point}</span>
                        </div>
                      ))}
                    </div>
                    {learnPoints.length > 6 && (
                      <button onClick={() => setShowAllLearnPoints(!showAllLearnPoints)} className="mt-3 text-sm text-primary font-medium hover:underline">
                        {showAllLearnPoints ? (locale === "fr" ? "Voir moins" : "Show less") : (locale === "fr" ? `Voir tout (${learnPoints.length})` : `Show all (${learnPoints.length})`)}
                      </button>
                    )}
                  </div>
                )}

                {/* Requirements */}
                {requirements.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t("requirements")}</h2>
                    <ul className="space-y-2">
                      {requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                          {req}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                      <BarChart className="w-3.5 h-3.5" />
                      {levelLabel}
                    </div>
                  </div>
                )}

                {/* Target audience */}
                {targetAudience && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t("target_audience")}</h2>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{targetAudience}</p>
                  </div>
                )}

                {/* Description */}
                {desc && (
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{locale === "fr" ? "Description" : "Description"}</h2>
                    <TiptapRenderer content={desc} className="text-slate-700 dark:text-slate-300" />
                  </div>
                )}
              </div>
            )}

            {/* Curriculum */}
            {activeTab === "curriculum" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {(formation.sections ?? []).length} {t("sections")} · {totalLessons} {t("lessons")} · {formatDuration(formation.duration)}
                    {freeLessons > 0 && (
                      <span className="ml-2 text-primary">({freeLessons} {locale === "fr" ? "gratuites" : "free"})</span>
                    )}
                  </p>
                  <button
                    onClick={() => {
                      if (expandedSections.size === (formation.sections ?? []).length) {
                        setExpandedSections(new Set());
                      } else {
                        setExpandedSections(new Set((formation.sections ?? []).map((s) => s.id)));
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {expandedSections.size === (formation.sections ?? []).length
                      ? (locale === "fr" ? "Tout réduire" : "Collapse all")
                      : (locale === "fr" ? "Tout développer" : "Expand all")}
                  </button>
                </div>

                <div className="space-y-2">
                  {(formation.sections ?? []).sort((a, b) => a.order - b.order).map((section) => {
                    const sectionTitle = section.title;
                    const sectionDuration = section.lessons.reduce((s, l) => s + (l.duration ?? 0), 0);
                    const isExpanded = expandedSections.has(section.id);

                    return (
                      <div key={section.id} className="border rounded-xl overflow-hidden">
                        <button
                          onClick={() => {
                            const next = new Set(expandedSections);
                            if (isExpanded) next.delete(section.id); else next.add(section.id);
                            setExpandedSections(next);
                          }}
                          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                            <span className="font-medium text-slate-900 dark:text-white text-sm">{sectionTitle}</span>
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {section.lessons.length} {locale === "fr" ? "leçons" : "lessons"} · {formatDuration(sectionDuration)}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="divide-y">
                            {section.lessons.sort((a, b) => a.order - b.order).map((lesson) => {
                              const lessonTitle = lesson.title;
                              return (
                                <div
                                  key={lesson.id}
                                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                    lesson.isFree && !isEnrolled ? "cursor-pointer" : ""
                                  }`}
                                  onClick={() => {
                                    if (lesson.isFree && !isEnrolled && formation) {
                                      setPreviewLessonId(lesson.id);
                                    }
                                  }}
                                >
                                  {lesson.isFree && !isEnrolled ? (
                                    <Play className="w-3.5 h-3.5 text-green-500" />
                                  ) : !isEnrolled ? (
                                    <span className="material-symbols-outlined text-sm text-slate-300">lock</span>
                                  ) : (
                                    <LessonTypeIcon type={lesson.type} />
                                  )}
                                  <span className={`flex-1 text-sm ${lesson.isFree && !isEnrolled ? "text-slate-900 dark:text-white font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                                    {lessonTitle}
                                  </span>
                                  {lesson.isFree && !isEnrolled && (
                                    <span className="text-xs text-green-600 font-semibold px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded flex items-center gap-1">
                                      <Play className="w-3 h-3" />
                                      {locale === "fr" ? "Aperçu" : "Preview"}
                                    </span>
                                  )}
                                  {lesson.duration && (
                                    <span className="text-xs text-slate-400">{formatDuration(lesson.duration)}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instructor */}
            {activeTab === "instructor" && (
              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                    {instrAvatar ? (
                      <img src={instrAvatar} alt={formation.instructeur.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-2xl text-primary font-bold">
                        {(formation.instructeur?.user?.name || "?").charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{formation.instructeur.user.name}</h2>
                    {formation.instructeur.expertise.length > 0 && (
                      <p className="text-sm text-slate-500 mt-0.5">{formation.instructeur.expertise.join(", ")}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        {formation.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {formation.studentsCount.toLocaleString()} {t("students")}
                      </span>
                    </div>
                  </div>
                </div>

                {instrBio && (
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{locale === "fr" ? "À propos" : "About"}</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{instrBio}</p>
                  </div>
                )}

                {/* Social links */}
                {(formation.instructeur.linkedin || formation.instructeur.website) && (
                  <div className="flex items-center gap-3">
                    {formation.instructeur.linkedin && (
                      <a href={formation.instructeur.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors">
                        💼 LinkedIn
                      </a>
                    )}
                    {formation.instructeur.website && (
                      <a href={formation.instructeur.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        🌐 {locale === "fr" ? "Site web" : "Website"}
                      </a>
                    )}
                  </div>
                )}

                <Link
                  href={`/formations/instructeurs/${formation.instructeur.id}`}
                  className="inline-flex items-center gap-2 border border-primary text-primary text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  {t("instructor_profile")}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Global rating */}
                <div className="flex items-center gap-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-slate-900 dark:text-white">{formation.rating.toFixed(1)}</p>
                    <StarRating rating={formation.rating} size="lg" />
                    <p className="text-xs text-slate-500 mt-1">{t("tab_reviews")} ({(formation.reviewsCount ?? 0).toLocaleString()})</p>
                  </div>
                  {/* Bars with counts */}
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = (formation.reviews ?? []).filter((r) => r.rating === star).length;
                      const pct = (formation.reviews ?? []).length ? (count / (formation.reviews ?? []).length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:opacity-80 transition-opacity">
                          <span className="w-3 text-right font-medium">{star}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-12 text-right tabular-nums">{count} <span className="text-slate-400">({Math.round(pct)}%)</span></span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-2">{formation.studentsCount.toLocaleString()} {t("students")}</p>
                </div>

                {/* Review list */}
                <div className="space-y-4">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden">
                          {review.user.avatar || review.user.image ? (
                            <img src={review.user.avatar || review.user.image!} alt={review.user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-primary font-bold">
                              {(review.user?.name || "?").charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-slate-900 dark:text-white">{review.user.name}</span>
                            <StarRating rating={review.rating} />
                            <span className="text-xs text-slate-400">
                              {new Date(review.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>
                          {review.response && (
                            <div className="mt-3 pl-4 border-l-2 border-primary/30">
                              <p className="text-xs text-primary font-medium mb-1">{locale === "fr" ? "Réponse de l'instructeur" : "Instructor reply"}</p>
                              <p className="text-sm text-slate-600">{review.response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {(formation.reviews ?? []).length > 4 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="text-primary text-sm hover:underline"
                    >
                      {showAllReviews
                        ? (locale === "fr" ? "Voir moins" : "Show less")
                        : (locale === "fr" ? `Voir tous les ${(formation.reviews ?? []).length} avis` : `See all ${(formation.reviews ?? []).length} reviews`)}
                    </button>
                  )}

                  {(formation.reviews ?? []).length === 0 && (
                    <p className="text-slate-500 text-sm">{locale === "fr" ? "Aucun avis pour l'instant." : "No reviews yet."}</p>
                  )}
                </div>
              </div>
            )}

            {/* Cohorts */}
            {activeTab === "cohorts" && formation.cohorts && formation.cohorts.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-2">
                  {formation.cohorts.length} {locale === "fr" ? "session(s) de groupe disponible(s)" : "group session(s) available"}
                </p>
                {formation.cohorts.map((c) => {
                  const cTitle = c.title;
                  const placesLeft = c.maxParticipants - c.currentCount;
                  const deadlinePassed = new Date(c.enrollmentDeadline) < new Date();

                  return (
                    <div key={c.id} className="border rounded-xl p-5 hover:border-primary/20 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{cTitle}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(c.startDate).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" })} — {new Date(c.endDate).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {placesLeft}/{c.maxParticipants} {locale === "fr" ? "places" : "spots"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {c.durationDays}{locale === "fr" ? "j" : "d"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{c.price}€</p>
                          {c.originalPrice && c.originalPrice > c.price && (
                            <p className="text-xs text-slate-400 line-through">{c.originalPrice}€</p>
                          )}
                        </div>
                      </div>

                      {placesLeft <= 5 && placesLeft > 0 && (
                        <p className="text-xs text-red-600 font-medium mb-3">
                          {placesLeft} {locale === "fr" ? "place(s) restante(s) !" : "spot(s) left!"}
                        </p>
                      )}

                      <button
                        onClick={async () => {
                          if (!session?.user) { router.push("/formations/connexion"); return; }
                          const res = await fetch(`/api/formations/cohorts/${c.id}/checkout`, { method: "POST" });
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                          else if (data.error) alert(data.error);
                        }}
                        disabled={placesLeft === 0 || deadlinePassed || c.status !== "OUVERT"}
                        className="w-full bg-primary text-white font-medium py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {placesLeft === 0
                          ? (locale === "fr" ? "Complet" : "Full")
                          : deadlinePassed
                            ? (locale === "fr" ? "Inscriptions closes" : "Enrollment closed")
                            : (locale === "fr" ? "S'inscrire à cette session" : "Enroll in this session")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right column — Sticky purchase card */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-2xl shadow-xl overflow-hidden">
                {/* Preview thumbnail / video */}
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative">
                  {formation.thumbnail ? (
                    <img src={formation.thumbnail} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-blue-100">
                      <DynamicIcon name="school" className="w-12 h-12 opacity-40" />
                    </div>
                  )}
                  {formation.previewVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 text-primary ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Flash promo banner */}
                  {formation.flashPromo && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold text-red-600 uppercase">Promo Flash -{formation.flashPromo.discountPct}%</span>
                      </div>
                      <CountdownTimer endsAt={formation.flashPromo.endsAt} />
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-end gap-3 mb-4">
                    {formation.isFree ? (
                      <span className="text-2xl font-bold text-green-600">{t("free")}</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">
                          {finalPrice.toFixed(0)}€
                        </span>
                        {(flashDiscountedPrice || formation.originalPrice) && finalPrice < formation.price && (
                          <span className="text-lg text-slate-400 line-through">{formation.price.toFixed(0)}€</span>
                        )}
                        {formation.flashPromo && (
                          <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">-{formation.flashPromo.discountPct}%</span>
                        )}
                        {!formation.flashPromo && discount && (
                          <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">-{discount}%</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Stock counter */}
                  {formation.maxStudents && (
                    <div className="mb-4">
                      <StockCounter current={formation.studentsCount} max={formation.maxStudents} />
                    </div>
                  )}

                  {/* Actions */}
                  {isEnrolled ? (
                    <Link
                      href={`/formations/apprendre/${formation.id}`}
                      className="block w-full bg-green-500 hover:bg-green-600 text-white text-center font-bold py-3 rounded-xl transition-colors"
                    >
                      {locale === "fr" ? "Continuer ma formation" : "Continue Learning"}
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={buyNow}
                        disabled={addingToCart}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        {addingToCart ? "..." : t("buy_now")}
                      </button>
                      <button
                        onClick={addToCart}
                        disabled={addingToCart}
                        className="w-full border border-slate-300 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {t("add_to_cart")}
                      </button>
                      <button
                        onClick={handleToggleFavorite}
                        className={`w-full border py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors ${
                          isFavorite ? "border-red-300 text-red-500 bg-red-50" : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/50"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                        {t("add_to_wishlist")}
                      </button>
                    </div>
                  )}

                  <p className="text-center text-xs text-slate-400 mt-2">{t("money_back")}</p>

                  {/* Includes */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{t("includes")}</h3>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatDuration(formation.duration)} {locale === "fr" ? "de contenu" : "of content"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        {t("mobile_access")}
                      </div>
                      {totalResources > 0 && (
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-slate-400" />
                          {totalResources} {t("resources")}
                        </div>
                      )}
                      {formation.hasCertificate && (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-green-500" />
                          {t("certificate")}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        {t("lifetime_access")}
                      </div>
                    </div>
                  </div>

                  {/* Promo code */}
                  {!formation.isFree && !isEnrolled && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-slate-700 mb-2">{t("promo_code")}</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="CODE"
                          className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          onClick={applyPromo}
                          className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-lg transition-colors"
                        >
                          {t("promo_apply")}
                        </button>
                      </div>
                      {promoApplied && (
                        <p className="text-xs text-green-600 mt-1.5">
                          -{promoApplied.discount}€ {locale === "fr" ? "appliqués" : "discount applied"}!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Share popover */}
                  <div className="mt-4 relative">
                    <button
                      onClick={() => setShowSharePopover(!showSharePopover)}
                      className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {t("share")}
                    </button>
                    {showSharePopover && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 flex gap-2 z-50">
                        <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setShowSharePopover(false); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs text-slate-600 dark:text-slate-300" title="Copy">📋</button>
                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs" title="Twitter/X">𝕏</a>
                        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs" title="LinkedIn">💼</a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs" title="Facebook">📘</a>
                        <a href={`https://wa.me/?text=${encodeURIComponent(title + " " + (typeof window !== "undefined" ? window.location.href : ""))}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs" title="WhatsApp">💬</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar formations */}
        {similarFormations.length > 0 && (
          <div className="mt-12 mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {locale === "fr" ? "Formations similaires" : "Similar courses"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similarFormations.map((f) => (
                <FormationCard key={f.id} formation={f} lang={locale === "en" ? "en" : "fr"} compact />
              ))}
            </div>
          </div>
        )}

        {/* Mobile purchase bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 dark:bg-neutral-dark border-t dark:border-border-dark p-4 flex items-center gap-3 shadow-lg z-30">
          <div className="flex-1">
            {formation.isFree ? (
              <span className="font-bold text-green-600">{t("free")}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900 dark:text-white">{finalPrice.toFixed(0)}€</span>
                {formation.originalPrice && <span className="text-sm text-slate-400 line-through">{formation.originalPrice.toFixed(0)}€</span>}
              </div>
            )}
          </div>
          {isEnrolled ? (
            <Link href={`/formations/apprendre/${formation.id}`} className="flex-1 bg-green-500 text-white text-center font-bold py-3 rounded-xl">
              {locale === "fr" ? "Continuer" : "Continue"}
            </Link>
          ) : (
            <>
              <button onClick={addToCart} disabled={addingToCart} className="flex-1 border border-primary text-primary font-medium py-3 rounded-xl">
                {t("add_to_cart")}
              </button>
              <button onClick={buyNow} disabled={addingToCart} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl">
                {t("buy_now")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Free Lesson Preview Modal */}
      {previewLessonId && formation && (
        <FreeLessonPreviewModal
          formationId={formation.id}
          lessonId={previewLessonId}
          onClose={() => setPreviewLessonId(null)}
          onBuy={() => {
            setPreviewLessonId(null);
            buyNow();
          }}
          locale={locale}
        />
      )}
    </div>
  );
}
