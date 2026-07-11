"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShopFooter from "@/components/formations/ShopFooter";
import { FormationsFooter } from "@/components/formations/FormationsFooter";
import { productImageSrc, avatarSrc } from "@/lib/utils/image-url";
import {
  Star,
  ShoppingBag,
  ShoppingCart,
  ArrowLeft,
  ChevronRight,
  Flame,
  FileText,
  Eye,
  MessageSquare,
  Download,
  Ban,
  Infinity as InfinityIcon,
  MonitorSmartphone,
  ShieldCheck,
  BadgeCheck,
  CalendarCheck,
  Store,
  FileType,
  BookOpen,
  PlayCircle,
  Music,
  LayoutDashboard,
  GraduationCap,
  Code,
  Package,
  type LucideIcon,
} from "lucide-react";
import { PixelInjector } from "@/components/formations/PixelInjector";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import { InquiryWidget } from "@/components/formations/InquiryWidget";
import AISupportWidget from "@/components/formations/AISupportWidget";
import { SaleAvailability } from "@/components/formations/SaleAvailability";
import { RelatedProducts } from "@/components/formations/RelatedProducts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Review {
  id: string;
  rating: number;
  comment: string;
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

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionFormat: string;
  productType: string;          // "PDF" | "VIDEO" | "AUDIO" | "EBOOK" | "TEMPLATE" | etc.
  banner: string | null;
  thumbnail?: string | null;
  price: number;
  originalPrice: number | null;
  currency: string;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  viewsCount: number;
  tags: string[];
  maxBuyers: number | null;
  currentBuyers: number | null;
  salesEndAt?: string | null;
  previewEnabled?: boolean;
  previewPages?: number;
  watermarkEnabled?: boolean;
  previewAvailable?: boolean;
  category: { id: string; slug: string; name: string } | null;
  instructeur: Instructeur;
  reviews: Review[];
  shop: { slug: string; name: string; legalName: string | null; font: string | null; themeColor: string | null } | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "Aujourd'hui";
  if (d < 30) return `Il y a ${d}j`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  return `Il y a ${Math.floor(d / 365)} an(s)`;
}

const TYPE_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  PDF: { label: "PDF", icon: FileType },
  EBOOK: { label: "E-book", icon: BookOpen },
  VIDEO: { label: "Vidéo", icon: PlayCircle },
  AUDIO: { label: "Audio", icon: Music },
  TEMPLATE: { label: "Template", icon: LayoutDashboard },
  COURSE: { label: "Cours digital", icon: GraduationCap },
  SOFTWARE: { label: "Logiciel", icon: Code },
  BUNDLE: { label: "Pack", icon: Package },
  OTHER: { label: "Produit digital", icon: ShoppingBag },
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ProduitPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "apercu" | "avis">("description");
  // Mis à jour par <SaleAvailability> à chaque tick (deadline ou stock atteint).
  // Permet de désactiver le bouton "Acheter" en temps réel sans recharger la page.
  const [canBuy, setCanBuy] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [addedCart, setAddedCart] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/public/produit/${slug}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setProduct(json.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  function handleBuyNow() {
    if (!product) return;
    router.push(`/checkout?pids=${product.id}`);
  }

  async function handleAddToCart() {
    if (!product || addingCart || addedCart) return;
    setAddingCart(true);
    try {
      const res = await fetch("/api/formations/apprenant/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        setAddedCart(true); // reste coloré
        try { window.dispatchEvent(new CustomEvent("nk:cart-change")); } catch { /* ignore */ }
      }
    } finally {
      setAddingCart(false);
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
          <ShoppingBag size={48} className="text-gray-300 mx-auto" />
          <h2 className="text-lg font-bold text-[#191c1e] mt-3">Produit introuvable</h2>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Ce produit n&apos;existe pas ou n&apos;est plus disponible.
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

  const typeInfo = TYPE_LABELS[product.productType] ?? TYPE_LABELS.OTHER;
  const TypeIcon = typeInfo.icon;
  const isFree = product.price === 0;
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  // Réunion d'urgence du 2026-05-26 (audit Karim+Fatou+Amélie) :
  // `currentBuyers` est un seed manuel saisi par le vendeur ; `salesCount` est le
  // compteur incrémenté par chaque achat réel. La jauge publique DOIT refléter
  // les vraies ventes — on prend le max pour que les ventes réelles dépassent
  // tout seed inflationniste et restent la source de vérité dès qu'elles
  // dépassent le boost initial.
  const displayedSold = Math.max(product.currentBuyers ?? 0, product.salesCount ?? 0);
  const remaining = product.maxBuyers != null
    ? Math.max(0, product.maxBuyers - displayedSold)
    : null;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Pixels vendeur : FB, Google, TikTok — event ViewContent */}
      <PixelInjector
        pixels={product.instructeur.marketingPixels ?? []}
        event={{ name: "ViewContent", value: product.price, currency: "XOF" }}
      />

      {/* Widget IA Support Client (si vendeur actif) */}
      <AISupportWidget
        instructeurId={product.instructeur.id}
        pageContext={`Le visiteur consulte le produit "${product.title}" à ${product.price} F CFA.`}
      />

      {/* Breadcrumb + bouton retour */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap text-xs text-[#5c647a]">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) router.back();
              else router.push("/explorer");
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:text-[#191c1e] font-semibold transition-colors"
          >
            <ArrowLeft size={14} />
            Retour
          </button>
          <span className="text-gray-300">·</span>
          <Link href="/" className="hover:text-[#006e2f] transition-colors">Accueil</Link>
          <ChevronRight size={12} />
          <Link href="/explorer" className="hover:text-[#006e2f] transition-colors">Explorer</Link>
          <ChevronRight size={12} />
          <span className="text-[#191c1e] font-medium truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bannière — object-contain sur fond neutre : l'image du produit
                s'affiche EN ENTIER (jamais rognée), quelle que soit sa taille,
                y compris sur mobile. Un flou de l'image remplit joliment le fond. */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
              {(product.banner || product.thumbnail) ? (
                <>
                  {/* Fond flouté pour combler les bords sans bandes vides */}
                  <img src={productImageSrc(product.banner ?? product.thumbnail, 1000) ?? ""} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40" />
                  <img src={productImageSrc(product.banner ?? product.thumbnail, 1000) ?? ""} alt={product.title} loading="lazy" decoding="async" className="relative w-full h-full object-contain" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#003d1a] to-[#22c55e]">
                  <TypeIcon size={100} className="text-white/30" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/95 text-[#191c1e] shadow-sm backdrop-blur-sm">
                  <TypeIcon size={12} className="text-[#006e2f]" />
                  {typeInfo.label}
                </span>
                {product.category && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[#006e2f] text-white">
                    {product.category.name}
                  </span>
                )}
              </div>
            </div>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {product.tags && product.tags.slice(0, 4).map((t) => (
                  <span key={t} className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-[#5c647a]">
                    #{t}
                  </span>
                ))}
                {product.salesCount > 50 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                    <Flame size={13} className="fill-amber-700" />
                    POPULAIRE
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] leading-tight">{product.title}</h1>

              {/* Infos produit (ventes + date) — sans identité créateur : la
                  boutique du vendeur suffit comme identité. */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-[#5c647a] mt-4">
                {product.salesCount > 0 && (
                  <span>
                    <span className="font-semibold text-[#191c1e]">{fmt(product.salesCount)}</span>
                    {" "}vente{product.salesCount !== 1 ? "s" : ""}
                  </span>
                )}
                {product.salesCount > 0 && <span className="text-zinc-300">·</span>}
                <span>
                  Ajouté le {new Date(product.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>

              {/* Stats — note affichée uniquement si le produit a déjà des avis
                  (pas de « Nouveau » ni de second compteur de ventes en doublon) */}
              {product.rating > 0 && (
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={product.rating} size={16} />
                    <span className="text-sm font-bold text-[#191c1e]">
                      {product.rating.toFixed(1)}
                    </span>
                    {product.reviewsCount > 0 && (
                      <span className="text-xs text-[#5c647a]">({product.reviewsCount} avis)</span>
                    )}
                  </div>
                  {remaining !== null && remaining < 50 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                      Plus que {remaining} {remaining > 1 ? "places" : "place"}
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-4">
              <div className="p-6">
                <div className="mb-4">
                  {discount > 0 && (
                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 mb-2">
                      -{discount}% de réduction
                    </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    {isFree ? (
                      <p className="text-3xl font-extrabold text-[#006e2f]">Gratuit</p>
                    ) : (
                      <>
                        <p className="text-3xl font-extrabold text-[#006e2f]">{fmt(product.price)}</p>
                        <span className="text-sm font-bold text-[#5c647a]">FCFA</span>
                      </>
                    )}
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <p className="text-sm text-gray-400 line-through mt-1">{fmt(product.originalPrice)} FCFA</p>
                  )}
                </div>

                <button
                  onClick={handleBuyNow}
                  disabled={!canBuy}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{
                    background: canBuy
                      ? "linear-gradient(to right, #006e2f, #22c55e)"
                      : "linear-gradient(to right, #94a3b8, #64748b)",
                  }}
                >
                  {!canBuy ? <Ban size={18} /> : isFree ? <Download size={18} /> : <ShoppingCart size={18} />}
                  {!canBuy
                    ? "Vente terminée"
                    : isFree
                      ? "Télécharger maintenant"
                      : "Acheter maintenant"}
                </button>

                {!isFree && canBuy && (
                  <button
                    onClick={handleAddToCart}
                    disabled={addingCart || addedCart}
                    className="w-full mt-2.5 py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-2 transition-colors disabled:cursor-default"
                    style={
                      addedCart
                        ? { background: "#e6f5eb", color: "#006e2f", borderColor: "#006e2f" }
                        : { background: "#fff", color: "#191c1e", borderColor: "#e4eae6" }
                    }
                  >
                    <ShoppingCart size={17} />
                    {addedCart ? "Ajouté au panier ✓" : addingCart ? "Ajout…" : "Ajouter au panier"}
                  </button>
                )}

                {/* Compte à rebours + barre de progression — affichés uniquement
                    si le vendeur a configuré une deadline ou un stock max. */}
                <SaleAvailability
                  salesEndAt={product.salesEndAt}
                  maxBuyers={product.maxBuyers}
                  currentBuyers={displayedSold}
                  onAvailabilityChange={setCanBuy}
                />

                <div className="mt-3">
                  <InquiryWidget
                    productId={product.id}
                    productTitle={product.title}
                    vendorName={product.instructeur.name}
                  />
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <InfinityIcon size={16} className="text-[#006e2f]" />
                    Accès et téléchargement à vie
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <TypeIcon size={16} className="text-[#006e2f]" />
                    Format {typeInfo.label}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <MonitorSmartphone size={16} className="text-[#006e2f]" />
                    Accessible sur mobile & desktop
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <ShieldCheck size={16} className="text-[#006e2f]" />
                    Paiement 100% sécurisé
                  </div>
                </div>

                {/* Lien vers la boutique du vendeur (où se trouve le produit). */}
                {product.shop && (
                  <Link
                    href={`/boutique/${product.shop.slug}`}
                    className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-4 py-3 hover:border-[#006e2f]/40 hover:bg-[#006e2f]/[0.03] transition-colors group"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Store size={16} className="text-[#006e2f] flex-shrink-0" />
                      <span className="text-sm font-semibold text-[#191c1e] truncate">Voir la boutique {product.shop.name}</span>
                    </span>
                    <ChevronRight size={16} className="text-[#5c647a] group-hover:text-[#006e2f] flex-shrink-0" />
                  </Link>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Description & détails — pleine largeur (façon Chariow) */}
        <div className="mt-6">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit">
              {(
                [
                  { id: "description", label: "Description", show: true },
                  { id: "apercu", label: "Aperçu", show: !!product.previewAvailable },
                  { id: "avis", label: `Avis (${product.reviewsCount})`, show: true },
                ] as const
              )
                .filter((t) => t.show)
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === tab.id ? "bg-[#006e2f] text-white shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
            </div>

            {/* Description tab */}
            {activeTab === "description" && (
              <div className="space-y-5">
                {product.description ? (
                  <div className="nk-desc bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                    {/* Rendu unifié HTML/Markdown — identique à l'éditeur (nk-rich) */}
                    <TiptapRenderer content={product.description} />
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <FileText size={36} className="text-gray-300 mx-auto" />
                    <p className="text-sm text-[#5c647a] mt-2">Aucune description fournie pour ce produit.</p>
                  </div>
                )}
              </div>
            )}

            {/* Aperçu tab — preview PDF (vendor opt-in, watermarked) */}
            {activeTab === "apercu" && product.previewAvailable && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 space-y-4">
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <Eye size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <p className="font-bold mb-0.5">
                      Aperçu gratuit — {product.previewPages ?? 5} première{(product.previewPages ?? 5) > 1 ? "s" : ""} page{(product.previewPages ?? 5) > 1 ? "s" : ""}
                    </p>
                    <p>
                      Les pages affichées portent un filigrane Novakou. Achetez le produit pour télécharger le fichier complet sans filigrane.
                    </p>
                  </div>
                </div>
                <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50" style={{ aspectRatio: "1 / 1.414" }}>
                  <iframe
                    src={`/api/produits/${product.id}/preview#toolbar=0&navpanes=0&scrollbar=1`}
                    title={`Aperçu — ${product.title}`}
                    className="absolute inset-0 w-full h-full"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
                <p className="text-[11px] text-[#5c647a] text-center">
                  Si l&apos;aperçu ne s&apos;affiche pas, votre navigateur bloque peut-être les PDF intégrés.{" "}
                  <a
                    href={`/api/produits/${product.id}/preview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#006e2f] font-semibold hover:underline"
                  >
                    Ouvrir dans un nouvel onglet
                  </a>
                </p>
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === "avis" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                {product.reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={48} className="text-gray-300 mx-auto" />
                    <p className="text-sm text-[#5c647a] mt-3">Aucun avis pour ce produit pour l&apos;instant.</p>
                    <p className="text-xs text-[#5c647a] mt-1">Soyez le premier à laisser votre retour après l&apos;achat.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {product.reviews.map((r) => (
                      <div key={r.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                            {r.user.image ? (
                              <img src={avatarSrc(r.user.image, 64) ?? r.user.image ?? ""} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              initials(r.user.name)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-[#191c1e]">{r.user.name ?? "Acheteur"}</p>
                              <span className="text-[11px] text-[#5c647a]">{timeAgo(r.createdAt)}</span>
                            </div>
                            <StarRating rating={r.rating} size={13} />
                            <p className="text-sm text-[#5c647a] mt-1.5 leading-relaxed">{r.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Recommandations « Vous aimerez aussi » (v2 Phase 2) */}
        <div className="mt-6">
          <RelatedProducts categoryId={product.category?.id} excludeId={product.id} />
        </div>
      </div>

      {/* Pied de page = celui de la BOUTIQUE du vendeur (identité = boutique).
          Le footer plateforme est masqué sur cette route. */}
      {product.shop ? (
        <ShopFooter shopSlug={product.shop.slug} shopName={product.shop.name} legalName={product.shop.legalName} />
      ) : (
        <FormationsFooter />
      )}
    </div>
  );
}
