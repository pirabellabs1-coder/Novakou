"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Award,
  Flame,
  Users,
  PlayCircle,
  Clock,
  Globe,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lock,
  MessageSquare,
  BadgeCheck,
  Play,
  Zap,
  Loader2,
  Check,
  ShoppingCart,
  Infinity as InfinityIcon,
  MonitorSmartphone,
  CalendarCheck,
} from "lucide-react";
import { PixelInjector } from "@/components/formations/PixelInjector";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import { RelatedProducts } from "@/components/formations/RelatedProducts";
import { InquiryWidget } from "@/components/formations/InquiryWidget";
import AISupportWidget from "@/components/formations/AISupportWidget";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lesson {
  id: string;
  title: string;
  duration: number | null;
  isFree: boolean;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  lessonCount: number;
  duration: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface Instructeur {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  verified?: boolean;
  bio: string | null;
  expertise: string[];
  yearsExp: number;
  marketingPixels?: Array<{ type: "FACEBOOK" | "GOOGLE" | "TIKTOK"; pixelId: string }>;
}

interface Formation {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  description: string | null;
  descriptionFormat: string;
  learnPoints: string[];
  requirements: string[];
  targetAudience: string | null;
  locale: string;
  thumbnail: string | null;
  previewVideo: string | null;
  level: string;
  languages: string[];
  duration: number;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  hasCertificate: boolean;
  maxStudents: number | null;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  viewsCount: number;
  totalLessons: number;
  category: { id: string; slug: string; name: string } | null;
  instructeur: Instructeur;
  sections: Section[];
  reviews: Review[];
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "Aujourd'hui";
  if (d < 30) return `Il y a ${d}j`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  return `Il y a ${Math.floor(d / 365)} an(s)`;
}

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  DEBUTANT: { label: "Débutant", color: "bg-green-100 text-green-700" },
  INTERMEDIAIRE: { label: "Intermédiaire", color: "bg-amber-100 text-amber-700" },
  AVANCE: { label: "Avancé", color: "bg-red-100 text-red-700" },
  TOUS_NIVEAUX: { label: "Tous niveaux", color: "bg-blue-100 text-blue-700" },
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? "fill-amber-500 text-amber-500" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

// ─── Section item ─────────────────────────────────────────────────────────────
function SectionAccordion({ section, index }: { section: Section; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-extrabold text-[#006e2f]">{index + 1}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#191c1e] truncate">{section.title}</p>
            <p className="text-[11px] text-[#5c647a]">
              {section.lessonCount} leçon{section.lessonCount > 1 ? "s" : ""}
              {section.duration > 0 && ` · ${fmtDuration(section.duration)}`}
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className="text-[#5c647a] flex-shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-[#f7f9fb]/50">
          {section.lessons.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 last:border-0"
            >
              {l.isFree ? (
                <PlayCircle size={16} className="fill-[#006e2f] text-white" />
              ) : (
                <Lock size={16} className="text-[#9ca3af]" />
              )}
              <p className="text-xs text-[#191c1e] flex-1 min-w-0 truncate">{l.title}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {l.isFree && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                    Aperçu
                  </span>
                )}
                {l.duration && (
                  <span className="text-[10px] text-[#5c647a]">{fmtDuration(l.duration)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FormationPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/public/formation/${slug}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setFormation(json.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  function handleBuyNow() {
    if (!formation) return;
    router.push(`/checkout?fids=${formation.id}`);
  }

  async function handleAddToCart() {
    if (!formation || addingToCart) return;
    setAddingToCart(true);
    try {
      const res = await fetch("/api/formations/apprenant/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId: formation.id }),
      });
      if (res.ok) {
        // Reste « Ajouté au panier » (coloré) : on ne réinitialise plus.
        setAddedToCart(true);
        // Notify the navbar cart badge to refresh
        try {
          window.dispatchEvent(new CustomEvent("nk:cart-change"));
        } catch { /* ignore */ }
      }
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] animate-pulse">
        <div className="h-72 bg-gray-200" />
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-4">
          <div className="h-10 w-2/3 bg-gray-200 rounded-xl" />
          <div className="h-60 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
          <GraduationCap size={48} className="text-gray-300 mx-auto" />
          <h2 className="text-lg font-bold text-[#191c1e] mt-3">Formation introuvable</h2>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Cette formation n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/explorer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <ArrowLeft size={16} />
            Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  const levelInfo = LEVEL_LABELS[formation.level] ?? { label: formation.level, color: "bg-gray-100 text-gray-700" };
  const discount = formation.originalPrice && formation.originalPrice > formation.price
    ? Math.round(((formation.originalPrice - formation.price) / formation.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Pixels vendeur (FB, Google, TikTok) — event ViewContent avec valeur */}
      <PixelInjector
        pixels={formation.instructeur.marketingPixels ?? []}
        event={{ name: "ViewContent", value: formation.price, currency: "XOF" }}
      />

      {/* Widget IA Support Client (si vendeur actif) */}
      <AISupportWidget
        instructeurId={formation.instructeur.id}
        pageContext={`Le visiteur consulte la formation "${formation.title}" à ${formation.price} F CFA.`}
      />

      {/* Breadcrumb minimal + back button — no hero cover */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            // Retour à la page précédente si on a un historique interne,
            // sinon fallback vers le catalogue (cas d'arrivée directe depuis Google).
            if (typeof window !== "undefined" && window.history.length > 1) router.back();
            else router.push("/explorer");
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-[#5c647a] text-xs font-semibold hover:bg-gray-50 hover:text-[#191c1e] transition-colors"
        >
          <ArrowLeft size={14} />
          Retour
        </button>
        <Link
          href="/explorer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#5c647a] text-xs font-semibold hover:text-[#006e2f] transition-colors"
        >
          <LayoutGrid size={14} />
          Catalogue
        </Link>
        {/* Mobile title */}
        <h1 className="text-2xl font-extrabold text-[#191c1e] leading-tight mt-4 md:hidden">
          {formation.title}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Main content ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Product image card — aspect 16:9 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="aspect-video w-full bg-gradient-to-br from-[#006e2f]/10 to-[#22c55e]/10 flex items-center justify-center">
                {formation.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formation.thumbnail}
                    alt={formation.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <PlayCircle size={64} className="text-[#006e2f] opacity-40 mx-auto" />
                    <p className="text-xs text-[#5c647a] mt-2 font-semibold uppercase tracking-wide">
                      Formation vidéo
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${levelInfo.color}`}>
                  {levelInfo.label}
                </span>
                {formation.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-[#5c647a]">
                    {formation.category.name}
                  </span>
                )}
                {formation.hasCertificate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                    <Award size={13} />
                    Certificat
                  </span>
                )}
                {formation.studentsCount > 100 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                    <Flame size={13} className="fill-amber-700" />
                    POPULAIRE
                  </span>
                )}
              </div>

              <h1 className="hidden md:block text-2xl md:text-3xl font-extrabold text-[#191c1e] leading-tight">
                {formation.title}
              </h1>
              {formation.shortDesc && (
                <p className="text-sm text-[#5c647a] mt-3 leading-relaxed">{formation.shortDesc}</p>
              )}

              {/* Stats — note affichée seulement si la formation a des avis
                  (pas de « Nouveau » qui fait vide sur les nouvelles formations) */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                {formation.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={formation.rating} size={16} />
                    <span className="text-sm font-bold text-[#191c1e]">
                      {formation.rating.toFixed(1)}
                    </span>
                    {formation.reviewsCount > 0 && (
                      <span className="text-xs text-[#5c647a]">({formation.reviewsCount})</span>
                    )}
                  </div>
                )}
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <Users size={14} />
                  {fmt(formation.studentsCount)} apprenant{formation.studentsCount > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <PlayCircle size={14} />
                  {formation.totalLessons} leçon{formation.totalLessons > 1 ? "s" : ""}
                </span>
                {formation.duration > 0 && (
                  <span className="text-xs text-[#5c647a] flex items-center gap-1">
                    <Clock size={14} />
                    {fmtDuration(formation.duration)}
                  </span>
                )}
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <Globe size={14} />
                  {formation.languages.map((l) => l.toUpperCase()).join(", ")}
                </span>
              </div>
            </div>

            {/* What you'll learn */}
            {formation.learnPoints && formation.learnPoints.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-extrabold text-[#191c1e] mb-4">Ce que vous allez apprendre</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formation.learnPoints.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={18} className="text-[#006e2f] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[#191c1e] leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course content */}
            {formation.sections && formation.sections.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-extrabold text-[#191c1e] mb-2">Contenu de la formation</h2>
                <p className="text-xs text-[#5c647a] mb-4">
                  {formation.sections.length} section{formation.sections.length > 1 ? "s" : ""} ·{" "}
                  {formation.totalLessons} leçon{formation.totalLessons > 1 ? "s" : ""}
                  {formation.duration > 0 && ` · ${fmtDuration(formation.duration)}`}
                </p>
                <div className="space-y-2">
                  {formation.sections.map((s, i) => (
                    <SectionAccordion key={s.id} section={s} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {formation.requirements && formation.requirements.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-extrabold text-[#191c1e] mb-4">Prérequis</h2>
                <ul className="space-y-2">
                  {formation.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowRight size={18} className="text-[#5c647a] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[#5c647a] leading-relaxed">{r}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target audience */}
            {formation.targetAudience && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-extrabold text-[#191c1e] mb-3">À qui s&apos;adresse cette formation ?</h2>
                <p className="text-sm text-[#5c647a] leading-relaxed whitespace-pre-wrap">{formation.targetAudience}</p>
              </div>
            )}

            {/* Description */}
            {formation.description && (
              <div className="nk-desc bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-extrabold text-[#191c1e] mb-3">Description</h2>
                {/* Rendu unifié HTML/Markdown — identique à l'éditeur (nk-rich) */}
                <TiptapRenderer content={formation.description} />
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-extrabold text-[#191c1e] mb-4 flex items-center gap-2">
                Avis des apprenants
                <span className="text-sm font-semibold text-[#5c647a]">({formation.reviewsCount})</span>
              </h2>
              {formation.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={48} className="text-gray-300 mx-auto" />
                  <p className="text-sm text-[#5c647a] mt-3">Aucun avis pour cette formation pour l&apos;instant.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formation.reviews.map((r) => (
                    <div key={r.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                          {r.user.image ? (
                            <img src={r.user.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initials(r.user.name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-[#191c1e]">{r.user.name ?? "Apprenant"}</p>
                            <span className="text-[11px] text-[#5c647a]">{timeAgo(r.createdAt)}</span>
                          </div>
                          <StarRating rating={r.rating} size={13} />
                          <p className="text-sm text-[#5c647a] mt-1.5 leading-relaxed whitespace-pre-wrap">{r.comment}</p>

                          {/* Vendor response */}
                          {r.response && (
                            <div className="mt-3 ml-0 border-l-2 border-emerald-300 pl-4 py-2 bg-emerald-50/40 rounded-r-lg">
                              <div className="flex items-center gap-1.5 mb-1">
                                <BadgeCheck size={14} className="text-emerald-600" />
                                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                                  Réponse du créateur
                                </p>
                                {r.respondedAt && (
                                  <span className="text-[11px] text-emerald-600">· {timeAgo(r.respondedAt)}</span>
                                )}
                              </div>
                              <p className="text-sm text-[#191c1e] leading-relaxed whitespace-pre-wrap">{r.response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Price card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-4">
              {/* Preview video */}
              {formation.previewVideo && (
                <div className="relative aspect-video bg-black">
                  <video
                    src={formation.previewVideo}
                    controls
                    className="w-full h-full object-cover"
                    poster={formation.thumbnail ?? undefined}
                  />
                </div>
              )}

              <div className="p-6">
                <div className="mb-4">
                  {discount > 0 && (
                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 mb-2">
                      -{discount}%
                    </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    {formation.isFree ? (
                      <p className="text-3xl font-extrabold text-[#006e2f]">Gratuit</p>
                    ) : (
                      <>
                        <p className="text-3xl font-extrabold text-[#006e2f]">{fmt(formation.price)}</p>
                        <span className="text-sm font-bold text-[#5c647a]">FCFA</span>
                      </>
                    )}
                  </div>
                  {formation.originalPrice && formation.originalPrice > formation.price && (
                    <p className="text-sm text-gray-400 line-through">{fmt(formation.originalPrice)} FCFA</p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                  >
                    {formation.isFree ? <Play size={18} className="fill-white" /> : <Zap size={18} />}
                    {formation.isFree ? "Commencer maintenant" : "Acheter maintenant"}
                  </button>
                  {!formation.isFree && (
                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="w-full py-3 rounded-xl text-[#006e2f] font-bold text-sm border-2 border-[#006e2f]/20 hover:border-[#006e2f]/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {addingToCart ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : addedToCart ? (
                        <>
                          <Check size={18} />
                          Ajouté au panier
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          Ajouter au panier
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <InquiryWidget
                    formationId={formation.id}
                    productTitle={formation.title}
                    vendorName={formation.instructeur.name}
                  />
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <InfinityIcon size={16} className="text-[#006e2f]" />
                    Accès à vie
                  </div>
                  {formation.hasCertificate && (
                    <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                      <Award size={16} className="text-[#006e2f]" />
                      Certificat de complétion
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <MonitorSmartphone size={16} className="text-[#006e2f]" />
                    Accessible sur mobile & desktop
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <CalendarCheck size={16} className="text-[#006e2f]" />
                    Remboursement 14 jours
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Recommandations « Vous aimerez aussi » (v2 Phase 2) */}
        <div className="mt-6">
          <RelatedProducts categoryId={formation.category?.id} excludeId={formation.id} />
        </div>
      </div>
    </div>
  );
}
