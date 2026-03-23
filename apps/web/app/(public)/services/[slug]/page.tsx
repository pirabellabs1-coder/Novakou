"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useCurrencyStore } from "@/store/currency";
import { useEntityTracker } from "@/lib/tracking/useEntityTracker";
import { cn } from "@/lib/utils";

// ============================================================
// Types — aligned with API response
// ============================================================

interface ApiReview {
  id: string;
  clientName: string;
  clientAvatar: string;
  clientCountry: string;
  qualite: number;
  communication: number;
  delai: number;
  rating: number;
  comment: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface ApiVendor {
  name: string;
  avatar: string;
  username: string;
  country: string;
  badges: string[];
  rating: number;
  plan: string;
  title: string;
  bio: string;
  completedOrders: number;
}

interface ApiOtherService {
  id: string;
  slug: string;
  title: string;
  basePrice: number;
  rating: number;
  ratingCount: number;
  image: string;
}

interface ApiSimilarService extends ApiOtherService {
  vendorName: string;
}

interface PackageTier {
  name: string;
  price: number;
  deliveryDays: number;
  delivery?: number;
  revisions: number;
  description: string;
}

interface PackageFeature {
  id: string;
  label: string;
  includedInBasic: boolean;
  includedInStandard: boolean;
  includedInPremium: boolean;
}

interface ServiceData {
  id: string;
  slug: string;
  title: string;
  description: unknown;
  descriptionText: string;
  categoryId: string;
  categoryName: string;
  subCategoryName: string;
  tags: string[];
  basePrice: number;
  deliveryDays: number;
  revisions: number;
  packages: {
    basic: PackageTier;
    standard: PackageTier;
    premium: PackageTier;
    features?: PackageFeature[];
  };
  images: string[];
  mainImage: string;
  videoUrl: string;
  status: string;
  views: number;
  clicks: number;
  orderCount: number;
  rating: number;
  ratingCount: number;
  faq: { question: string; answer: string }[];
  extras: { label: string; price: number }[];
  reviews: ApiReview[];
  vendor: ApiVendor;
  otherServices: ApiOtherService[];
  similarServices: ApiSimilarService[];
}

// ============================================================
// Badge config
// ============================================================

const BADGE_CONFIG: Record<string, { labelKey: string; icon: string; color: string }> = {
  verified: { labelKey: "badge_verified", icon: "verified", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  top_rated: { labelKey: "badge_top_rated", icon: "bolt", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  pro: { labelKey: "badge_pro", icon: "workspace_premium", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

// ============================================================
// Helpers
// ============================================================

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClasses = size === "md" ? "text-lg" : "text-sm";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cn(
            "material-symbols-outlined",
            sizeClasses,
            star <= rating ? "text-accent" : "text-slate-600"
          )}
          style={star <= rating ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          star
        </span>
      ))}
    </div>
  );
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ============================================================
// Small service card component (used for vendor & similar services)
// ============================================================

function ServiceMiniCard({
  service,
  format,
  vendorName,
  fromLabel,
}: {
  service: ApiOtherService;
  format: (n: number) => string;
  vendorName?: string;
  fromLabel: string;
}) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group bg-white dark:bg-neutral-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
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
            <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {service.title}
        </h4>
        {vendorName && (
          <p className="text-xs text-slate-500 mb-1">{vendorName}</p>
        )}
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={service.rating} />
          <span className="text-xs text-slate-500">{service.rating} ({service.ratingCount})</span>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-border-dark">
          <span className="text-sm font-black text-primary">{fromLabel} {format(service.basePrice)}</span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================
// Loading skeleton
// ============================================================

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background-dark">
      <div className="border-b border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="h-4 w-64 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 space-y-6">
            <div className="h-8 w-3/4 bg-slate-700 rounded animate-pulse" />
            <div className="h-5 w-1/2 bg-slate-700 rounded animate-pulse" />
            <div className="aspect-video bg-slate-700 rounded-xl animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-6 space-y-4">
              <div className="h-6 w-1/2 bg-slate-700 rounded animate-pulse" />
              <div className="h-10 w-1/3 bg-slate-700 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="h-12 w-full bg-slate-700 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

const REVIEWS_PER_PAGE = 3;

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const format = useCurrencyStore((s) => s.format);
  const t = useTranslations("service_detail");
  const locale = useLocale();

  // API fetch state
  const [service, setService] = useState<ServiceData | null>(null);

  // Track service view (deduped per session) — APRES la declaration de service
  useEntityTracker("service", service?.id ?? null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // UI states
  const [selectedPackage, setSelectedPackage] = useState<"basic" | "standard" | "premium">("standard");
  const [currentImage, setCurrentImage] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch service data from API
  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function fetchService() {
      setLoading(true);
      setNotFound(false);

      try {
        const res = await fetch(`/api/public/services/${encodeURIComponent(slug)}`);

        if (!res.ok) {
          if (res.status === 404) {
            if (!cancelled) setNotFound(true);
          }
          if (!cancelled) setLoading(false);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setService(data.service);
        }
      } catch (err) {
        console.error("Failed to fetch service:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchService();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Derived data
  const reviews = service?.reviews ?? [];
  const vendor = service?.vendor ?? null;
  const otherServices = service?.otherServices ?? [];
  const similarServices = service?.similarServices ?? [];

  const totalReviewPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = reviews.slice(
    reviewPage * REVIEWS_PER_PAGE,
    (reviewPage + 1) * REVIEWS_PER_PAGE
  );

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return service?.rating?.toFixed(1) ?? "0.0";
    return (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews, service?.rating]);

  // Gallery images
  const galleryImages = useMemo(() => {
    if (!service) return [];
    if (service.images && service.images.length > 0) return service.images;
    if (service.mainImage) return [service.mainImage];
    return [];
  }, [service]);

  // Default features for package comparison
  const features = [
    { basic: true, standard: true, premium: true, label: t("feature_on_time_delivery") },
    { basic: true, standard: true, premium: true, label: t("feature_source_files") },
    { basic: false, standard: true, premium: true, label: t("feature_unlimited_revisions") },
    { basic: false, standard: true, premium: true, label: t("feature_priority_support") },
    { basic: false, standard: false, premium: true, label: t("feature_express_delivery") },
    { basic: false, standard: false, premium: true, label: t("feature_strategy_consultation") },
  ];

  // Use package-level features if available from API
  const packageFeatures = useMemo(() => {
    if (service?.packages?.features && service.packages.features.length > 0) {
      return service.packages.features.map((f) => ({
        basic: f.includedInBasic,
        standard: f.includedInStandard,
        premium: f.includedInPremium,
        label: f.label,
      }));
    }
    return features;
  }, [service]);

  // ============================================================
  // Loading state
  // ============================================================
  if (loading) {
    return <LoadingSkeleton />;
  }

  // ============================================================
  // 404 state
  // ============================================================
  if (notFound || !service) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-24">
        <div className="bg-neutral-dark border border-border-dark rounded-2xl p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-slate-500 mb-4">search_off</span>
          <h1 className="text-2xl font-bold text-white mb-3">{t("not_found_title")}</h1>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            {t("not_found_description")}
          </p>
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3 text-sm font-bold transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {t("back_to_services")}
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // Package data
  // ============================================================
  const pkg = service.packages[selectedPackage];
  const descriptionText =
    typeof service.description === "object" &&
    service.description !== null &&
    "text" in (service.description as Record<string, unknown>)
      ? (service.description as { text: string }).text
      : service.descriptionText || "";

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-background-dark">
      {/* Breadcrumbs */}
      <div className="border-b border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-primary transition-colors">{t("breadcrumb_home")}</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link href="/explorer" className="hover:text-primary transition-colors">{t("breadcrumb_services")}</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-500">{service.categoryName}</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-300 font-medium truncate max-w-[200px]">{service.title}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ============================================ */}
          {/* LEFT COLUMN — Main Content */}
          {/* ============================================ */}
          <div className="flex-1 min-w-0">
            {/* Title + favorite */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {service.categoryName}
                  </span>
                  {service.tags.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300">
                      {service.tags[0]}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {service.title}
                </h1>
              </div>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                  "p-3 rounded-xl border transition-all shrink-0",
                  isFavorite
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "bg-white/5 border-border-dark text-slate-400 hover:text-red-400 hover:border-red-500/30"
                )}
              >
                <span className="material-symbols-outlined" style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  favorite
                </span>
              </button>
            </div>

            {/* Rating + orders row */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <StarRating rating={parseFloat(avgRating)} size="md" />
                <span className="text-white font-bold">{avgRating}</span>
                <span className="text-slate-400 text-sm">({reviews.length || service.ratingCount} {t("reviews")})</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-sm text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">shopping_cart</span>
                {service.orderCount} {t("orders")}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-sm text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                {service.views.toLocaleString(locale === "en" ? "en-US" : "fr-FR")} {t("views")}
              </span>
            </div>

            {/* Freelancer mini card */}
            {vendor && (
              <div className="flex items-center gap-4 mb-6 bg-neutral-dark border border-border-dark rounded-xl p-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0 relative">
                  {vendor.avatar ? (
                    <img src={vendor.avatar} alt={vendor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {vendor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/freelances/${vendor.username}`} className="text-white font-bold text-sm hover:text-primary transition-colors">
                      {vendor.name}
                    </Link>
                    {vendor.badges.slice(0, 2).map((b) => {
                      const cfg = BADGE_CONFIG[b];
                      if (!cfg) return null;
                      return (
                        <span key={b} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", cfg.color)}>
                          <span className="material-symbols-outlined text-[10px] fill-icon">{cfg.icon}</span>
                          {t(cfg.labelKey)}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{vendor.title || t("freelance_default_title")} - {vendor.country}</p>
                </div>
                <Link
                  href={`/freelances/${vendor.username}`}
                  className="text-primary text-xs font-bold hover:underline shrink-0"
                >
                  {t("view_profile")}
                </Link>
              </div>
            )}

            {/* Image Gallery */}
            {galleryImages.length > 0 && (
              <div className="mb-8">
                <div className="relative rounded-xl overflow-hidden bg-neutral-dark border border-border-dark aspect-video">
                  <img
                    src={galleryImages[currentImage]}
                    alt={`${service.title} - Image ${currentImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage((prev) => prev === 0 ? galleryImages.length - 1 : prev - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all"
                      >
                        <span className="material-symbols-outlined text-xl">chevron_left</span>
                      </button>
                      <button
                        onClick={() => setCurrentImage((prev) => prev === galleryImages.length - 1 ? 0 : prev + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all"
                      >
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                      </button>
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                        {currentImage + 1} / {galleryImages.length}
                      </div>
                    </>
                  )}
                </div>
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 mt-3">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className={cn(
                          "w-20 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                          idx === currentImage ? "border-primary" : "border-border-dark hover:border-slate-500 opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-bold text-white mb-4">{t("description")}</h2>
                <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">{descriptionText}</p>
              </div>

              {/* Tags */}
              {service.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-3">{t("tags")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span key={tag} className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* Forfaits comparison (3 columns)             */}
            {/* ============================================ */}
            <div className="mt-8 pt-8 border-t border-border-dark">
              <h2 className="text-lg font-bold text-white mb-6">{t("compare_packages")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["basic", "standard", "premium"] as const).map((tier) => {
                  const p = service.packages[tier];
                  const isSelected = selectedPackage === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedPackage(tier)}
                      className={cn(
                        "bg-neutral-dark border rounded-xl p-6 text-left transition-all relative",
                        isSelected ? "border-primary ring-1 ring-primary/30" : "border-border-dark hover:border-slate-500"
                      )}
                    >
                      {tier === "standard" && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                          {t("popular")}
                        </div>
                      )}
                      <h3 className="text-white font-bold text-base mb-1">{p.name}</h3>
                      <p className="text-2xl font-extrabold text-primary mb-3">{format(p.price)}</p>
                      <p className="text-slate-400 text-xs leading-relaxed mb-4">{p.description}</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="material-symbols-outlined text-sm text-primary">timer</span>
                          {t("delivery_days", { count: p.deliveryDays ?? p.delivery })}
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="material-symbols-outlined text-sm text-primary">refresh</span>
                          {p.revisions === 0 ? t("no_revision") : t("revisions", { count: p.revisions })}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border-dark space-y-2">
                        {packageFeatures.map((f, i) => {
                          const included = f[tier];
                          return (
                            <div key={i} className={cn("flex items-center gap-2 text-xs", included ? "text-slate-300" : "text-slate-600 line-through")}>
                              <span className={cn("material-symbols-outlined text-sm", included ? "text-primary" : "text-slate-600")} style={included ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                {included ? "check_circle" : "cancel"}
                              </span>
                              {f.label}
                            </div>
                          );
                        })}
                      </div>
                      <Link
                        href="/connexion?redirect=/services&message=Connectez-vous+pour+commander+ce+service"
                        className={cn(
                          "mt-4 w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all",
                          isSelected
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-white/5 text-slate-300 border border-border-dark hover:border-primary/30 hover:text-primary"
                        )}
                      >
                        <span className="material-symbols-outlined text-sm">shopping_cart</span>
                        {t("order_button")}
                      </Link>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ============================================ */}
            {/* Extras (options supplementaires)             */}
            {/* ============================================ */}
            {service.extras.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border-dark">
                <h2 className="text-lg font-bold text-white mb-4">{t("available_extras")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.extras.map((extra, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-neutral-dark border border-border-dark rounded-xl px-5 py-4">
                      <span className="text-sm text-slate-300">{extra.label}</span>
                      <span className="text-sm font-bold text-primary">+{format(extra.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* Key Stats + FAQ                              */}
            {/* ============================================ */}
            <div className="mt-8 pt-8 border-t border-border-dark space-y-8">
              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: "timer", label: t("delivery_time"), value: t("delivery_days", { count: service.deliveryDays }) },
                  { icon: "refresh", label: t("revisions_included"), value: `${service.revisions}` },
                  { icon: "shopping_cart", label: t("orders"), value: `${service.orderCount}` },
                  { icon: "visibility", label: t("views"), value: service.views.toLocaleString(locale === "en" ? "en-US" : "fr-FR") },
                ].map((stat) => (
                  <div key={stat.label} className="bg-neutral-dark border border-border-dark rounded-xl p-4 text-center">
                    <span className="material-symbols-outlined text-primary text-xl mb-2 block">{stat.icon}</span>
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                    <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* FAQ */}
              {service.faq.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">{t("seller_faq")}</h2>
                  <div className="space-y-2">
                    {service.faq.map((item, idx) => (
                      <div key={idx} className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left"
                        >
                          <span className="text-sm font-bold text-white">{item.question}</span>
                          <span className={cn("material-symbols-outlined text-slate-400 transition-transform", expandedFaq === idx && "rotate-180")}>
                            expand_more
                          </span>
                        </button>
                        {expandedFaq === idx && (
                          <div className="px-5 pb-4 border-t border-border-dark pt-3">
                            <p className="text-slate-300 text-sm leading-relaxed">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* A propos du vendeur                          */}
            {/* ============================================ */}
            {vendor && (
              <div className="mt-12 pt-8 border-t border-border-dark">
                <h2 className="text-lg font-bold text-white mb-6">{t("about_seller")}</h2>
                <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
                  <div className="flex items-start gap-5">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/30">
                        {vendor.avatar ? (
                          <img src={vendor.avatar} alt={vendor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                            {vendor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-white font-bold text-lg">{vendor.name}</h3>
                        {vendor.badges.map((b) => {
                          const cfg = BADGE_CONFIG[b];
                          if (!cfg) return null;
                          return (
                            <span key={b} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", cfg.color)}>
                              <span className="material-symbols-outlined text-[10px] fill-icon">{cfg.icon}</span>
                              {t(cfg.labelKey)}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-primary font-medium text-sm">{vendor.title || t("freelance_default_title")}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-400 text-xs">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {vendor.country}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vendor stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border-dark">
                    {[
                      { value: vendor.completedOrders.toString(), label: t("completed_orders") },
                      { value: `${vendor.rating}/5`, label: t("average_rating") },
                      { value: vendor.plan, label: t("plan") },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-white font-bold text-lg">{s.value}</p>
                        <p className="text-slate-400 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Vendor bio */}
                  {vendor.bio && (
                    <div className="mt-4 pt-4 border-t border-border-dark">
                      <p className="text-xs font-bold text-slate-400 mb-2">{t("about")}</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{vendor.bio}</p>
                    </div>
                  )}

                  {/* Vendor action buttons */}
                  <div className="flex gap-3 mt-6">
                    <Link
                      href={`/freelances/${vendor.username}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-3 text-sm font-bold hover:bg-primary/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">person</span>
                      {t("view_full_profile")}
                    </Link>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-border-dark text-slate-300 hover:text-primary hover:border-primary/30 rounded-xl px-4 py-3 text-sm font-bold transition-all">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      {t("contact")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* Avis sur ce service                          */}
            {/* ============================================ */}
            <div className="mt-12 pt-8 border-t border-border-dark">
              <h2 className="text-lg font-bold text-white mb-6">{t("reviews")}</h2>

              {reviews.length === 0 ? (
                <div className="bg-neutral-dark border border-border-dark rounded-xl p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-500 mb-3">rate_review</span>
                  <p className="text-slate-400 text-sm">{t("no_reviews")}</p>
                </div>
              ) : (
                <>
                  {/* Rating summary */}
                  <div className="bg-neutral-dark border border-border-dark rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-center">
                        <p className="text-4xl font-extrabold text-white">{avgRating}</p>
                        <StarRating rating={parseFloat(avgRating)} size="md" />
                        <p className="text-slate-400 text-xs mt-1">{reviews.length} {t("reviews")}</p>
                      </div>
                      <div className="flex-1 min-w-[200px] space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
                          const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 w-3">{stars}</span>
                              <span className="material-symbols-outlined text-xs text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Individual reviews */}
                  <div className="space-y-4">
                    {paginatedReviews.map((review) => (
                      <div key={review.id} className="bg-neutral-dark border border-border-dark rounded-xl p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {review.clientAvatar ||
                              review.clientName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">{review.clientName}</span>
                                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{review.clientCountry}</span>
                              </div>
                              <span className="text-xs text-slate-500">{formatDate(review.createdAt, locale)}</span>
                            </div>
                            <StarRating rating={review.rating} />
                            <p className="text-slate-300 text-sm leading-relaxed mt-3">{review.comment}</p>
                            {review.reply && (
                              <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/20">
                                <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">reply</span>
                                  {t("seller_reply")}
                                </p>
                                <p className="text-sm text-slate-400">{review.reply}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Review pagination */}
                  {totalReviewPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setReviewPage(Math.max(0, reviewPage - 1))}
                        disabled={reviewPage === 0}
                        className="p-2 rounded-lg border border-border-dark disabled:opacity-30 hover:bg-white/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-slate-400">chevron_left</span>
                      </button>
                      {Array.from({ length: totalReviewPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setReviewPage(i)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                            i === reviewPage ? "bg-primary text-white" : "border border-border-dark text-slate-500 hover:bg-white/5"
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setReviewPage(Math.min(totalReviewPages - 1, reviewPage + 1))}
                        disabled={reviewPage === totalReviewPages - 1}
                        className="p-2 rounded-lg border border-border-dark disabled:opacity-30 hover:bg-white/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ============================================ */}
            {/* Autres services du vendeur                   */}
            {/* ============================================ */}
            {otherServices.length > 0 && vendor && (
              <div className="mt-12 pt-8 border-t border-border-dark">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">{t("other_services", { name: vendor.name })}</h2>
                  <Link
                    href={`/freelances/${vendor.username}`}
                    className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                  >
                    {t("view_all_services")}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherServices.slice(0, 4).map((s) => (
                    <ServiceMiniCard key={s.id} service={s} format={format} fromLabel={t("from")} />
                  ))}
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* Services similaires (autres vendeurs)        */}
            {/* ============================================ */}
            {similarServices.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border-dark">
                <h2 className="text-lg font-bold text-white mb-6">{t("similar_services")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {similarServices.map((s) => (
                    <ServiceMiniCard key={s.id} service={s} format={format} vendorName={s.vendorName} fromLabel={t("from")} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* RIGHT COLUMN — Sticky Sidebar */}
          {/* ============================================ */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden">
                {/* Package tabs */}
                <div className="flex border-b border-border-dark">
                  {(["basic", "standard", "premium"] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedPackage(tier)}
                      className={cn(
                        "flex-1 py-3.5 text-xs font-bold transition-all text-center",
                        selectedPackage === tier
                          ? "bg-primary/10 text-primary border-b-2 border-primary"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      )}
                    >
                      {service.packages[tier].name}
                    </button>
                  ))}
                </div>

                {/* Package details */}
                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-base">{pkg.name}</h3>
                      <p className="text-2xl font-extrabold text-primary">{format(pkg.price)}</p>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{pkg.description}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="material-symbols-outlined text-base text-primary">timer</span>
                      {t("delivery_days", { count: pkg.deliveryDays ?? pkg.delivery })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="material-symbols-outlined text-base text-primary">refresh</span>
                      {pkg.revisions === 0 ? t("no_revision") : t("revisions", { count: pkg.revisions })}
                    </div>
                  </div>

                  <div className="space-y-2.5 py-4 border-t border-b border-border-dark">
                    {packageFeatures.map((f, i) => {
                      const included = f[selectedPackage];
                      return (
                        <div key={i} className={cn("flex items-center gap-2 text-sm", included ? "text-slate-300" : "text-slate-600")}>
                          <span
                            className={cn("material-symbols-outlined text-base", included ? "text-primary" : "text-slate-600")}
                            style={included ? { fontVariationSettings: "'FILL' 1" } : {}}
                          >
                            {included ? "check_circle" : "cancel"}
                          </span>
                          <span className={cn(!included && "line-through")}>{f.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Extras */}
                  {service.extras.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t("available_extras")}</h4>
                      <div className="space-y-2">
                        {service.extras.map((extra, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-background-dark rounded-lg px-4 py-2.5 border border-border-dark">
                            <span className="text-sm text-slate-300">{extra.label}</span>
                            <span className="text-sm font-bold text-primary">+{format(extra.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="space-y-3 pt-2">
                    <Link
                      href="/connexion?redirect=/services&message=Connectez-vous+pour+commander+ce+service"
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3.5 text-sm font-bold shadow-lg shadow-primary/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">shopping_cart</span>
                      {t("order_this_package")}
                    </Link>
                    <button className="w-full flex items-center justify-center gap-2 bg-transparent border border-border-dark hover:border-primary/50 text-slate-300 hover:text-primary rounded-xl px-6 py-3.5 text-sm font-bold transition-all">
                      <span className="material-symbols-outlined text-base">mail</span>
                      {t("contact_seller")}
                    </button>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="border-t border-border-dark px-6 py-4">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                    <span>{t("trust_escrow")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                    <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                    <span>{t("trust_support")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                    <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>undo</span>
                    <span>{t("trust_satisfaction")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
