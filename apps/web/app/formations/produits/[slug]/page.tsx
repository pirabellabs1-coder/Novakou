"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Star, ShoppingBag, Eye, Download, Shield, User, ChevronDown, ChevronUp,
  Share2, Heart, AlertCircle, CheckCircle, Package,
} from "lucide-react";
import { CountdownTimer } from "@/components/formations/CountdownTimer";
import { StockCounter } from "@/components/formations/StockCounter";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import { firePixelEvent } from "@/components/formations/PixelTracker";

// ── Types ──

interface Review {
  id: string;
  rating: number;
  comment: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
  user: { name: string; avatar: string | null; image: string | null };
}

interface FlashPromo {
  id: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
  maxUsage: number | null;
  usageCount: number;
}

interface Product {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  descriptionFormat: string;
  banner: string | null;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  productType: string;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  viewsCount: number;
  previewEnabled: boolean;
  previewPages: number;
  watermarkEnabled: boolean;
  maxBuyers: number | null;
  currentBuyers: number;
  fileSize: number | null;
  fileMimeType: string | null;
  tags: string[];
  category: { id: string; nameFr: string; nameEn: string; slug: string } | null;
  instructeur: {
    id: string;
    bioFr: string | null;
    bioEn: string | null;
    user: { name: string; avatar: string | null; image: string | null };
  };
  reviews: Review[];
  flashPromotions: FlashPromo[];
}

const TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  EBOOK: { icon: "menu_book", label: "E-book" },
  PDF: { icon: "picture_as_pdf", label: "PDF" },
  TEMPLATE: { icon: "dashboard_customize", label: "Template" },
  LICENCE: { icon: "vpn_key", label: "Licence" },
  AUDIO: { icon: "headphones", label: "Audio" },
  VIDEO: { icon: "videocam", label: "Vidéo" },
  AUTRE: { icon: "inventory_2", label: "Autre" },
};

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    fetch(`/api/produits/${slug}`)
      .then((r) => r.json())
      .then((data) => setProduct(data.product || null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-600">Produit introuvable</h2>
        <Link href="/formations/produits" className="mt-4 inline-block text-primary hover:underline">
          Retour aux produits
        </Link>
      </div>
    );
  }

  const title = locale === "fr" ? product.titleFr : product.titleEn;
  const description = locale === "fr" ? product.descriptionFr : product.descriptionEn;
  const catName = product.category ? (locale === "fr" ? product.category.nameFr : product.category.nameEn) : "";
  const typeBadge = TYPE_LABELS[product.productType] || TYPE_LABELS.AUTRE;
  const instructor = product.instructeur;

  // Flash promo
  const activePromo = product.flashPromotions?.[0];
  const promoPrice = activePromo ? product.price * (1 - activePromo.discountPct / 100) : null;
  const displayPrice = promoPrice ?? product.price;

  const soldOut = product.maxBuyers !== null && product.currentBuyers >= product.maxBuyers;

  async function handlePurchase() {
    if (!session?.user) {
      router.push("/formations/connexion");
      return;
    }
    setPurchasing(true);
    try {
      const res = await fetch("/api/produits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product!.id }),
      });
      const data = await res.json();
      firePixelEvent("InitiateCheckout", {
        value: product!.price,
        currency: "EUR",
        content_id: product!.id,
        content_name: product!.titleFr,
      });
      if (data.free) {
        firePixelEvent("Purchase", { value: 0, currency: "EUR", content_id: product!.id, content_name: product!.titleFr });
        router.push(data.redirectUrl);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur");
      }
    } catch {
      alert("Erreur lors de l'achat");
    } finally {
      setPurchasing(false);
    }
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-slate-500 mb-6">
        <Link href="/formations" className="hover:text-primary">Formations</Link>
        <span className="mx-2">/</span>
        <Link href="/formations/produits" className="hover:text-primary">Produits</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-blue-500/10">
            {product.banner ? (
              <img src={product.banner} alt={title} className="w-full h-64 sm:h-80 object-cover" />
            ) : (
              <div className="w-full h-64 sm:h-80 flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-primary/20">{typeBadge.icon}</span>
              </div>
            )}

            {/* Promo badge */}
            {activePromo && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold">
                -{activePromo.discountPct}%
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold">
                <span className="material-symbols-outlined text-sm">{typeBadge.icon}</span>
                {typeBadge.label}
              </span>
              {catName && <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 px-2.5 py-1 rounded-full">{catName}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
              {product.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">{product.rating.toFixed(1)}</span>
                  <span>({product.reviewsCount} avis)</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-4 h-4" />
                {product.salesCount} ventes
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {product.viewsCount} vues
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4">Description</h2>
            {description ? (
              <TiptapRenderer content={description} />
            ) : (
              <p className="text-slate-400 italic">Aucune description disponible</p>
            )}
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold mb-4">
              Avis ({product.reviewsCount})
            </h2>
            {product.reviews.length > 0 ? (
              <div className="space-y-4">
                {(showAllReviews ? product.reviews : product.reviews.slice(0, 3)).map((review) => (
                  <div key={review.id} className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {review.user.avatar || review.user.image ? (
                          <img src={review.user.avatar || review.user.image || ""} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold">{review.user.name}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString("fr")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                    {review.response && (
                      <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/30">
                        <p className="text-xs font-semibold text-primary mb-1">Réponse de l&apos;instructeur</p>
                        <p className="text-sm text-slate-500">{review.response}</p>
                      </div>
                    )}
                  </div>
                ))}
                {product.reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {showAllReviews ? <><ChevronUp className="w-4 h-4" /> Moins</> : <><ChevronDown className="w-4 h-4" /> Voir tous les avis</>}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Aucun avis pour le moment</p>
            )}
          </div>
        </div>

        {/* Right: Purchase sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Price card */}
            <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              {/* Flash promo countdown */}
              {activePromo && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">Promotion flash</span>
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">-{activePromo.discountPct}%</span>
                  </div>
                  <CountdownTimer endsAt={activePromo.endsAt} />
                  {activePromo.maxUsage && (
                    <p className="text-xs text-red-500 mt-1">
                      {activePromo.maxUsage - activePromo.usageCount} utilisation(s) restante(s)
                    </p>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="text-center">
                {product.isFree ? (
                  <span className="text-3xl font-bold text-green-600">Gratuit</span>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      {displayPrice.toFixed(2)}€
                    </span>
                    {(activePromo || (product.originalPrice && product.originalPrice > product.price)) && (
                      <span className="ml-2 text-lg text-slate-400 line-through">
                        {(activePromo ? product.price : product.originalPrice)?.toFixed(2)}€
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Stock counter */}
              {product.maxBuyers && (
                <StockCounter current={product.currentBuyers} max={product.maxBuyers} />
              )}

              {/* Buy button */}
              <button
                onClick={handlePurchase}
                disabled={purchasing || soldOut}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                  soldOut
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                } disabled:opacity-60`}
              >
                {purchasing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                    Traitement...
                  </span>
                ) : soldOut ? (
                  "Rupture de stock"
                ) : product.isFree ? (
                  "Obtenir gratuitement"
                ) : (
                  `Acheter — ${displayPrice.toFixed(2)}€`
                )}
              </button>

              {/* Preview button */}
              {product.previewEnabled && (
                <a
                  href={`/api/produits/${product.id}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Aperçu gratuit ({product.previewPages} pages)
                </a>
              )}

              {/* Info */}
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Téléchargement immédiat
                </div>
                {product.fileSize && (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Taille : {formatFileSize(product.fileSize)}
                  </div>
                )}
                {product.productType === "LICENCE" && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Clé de licence unique
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  5 téléchargements inclus
                </div>
              </div>
            </div>

            {/* Instructor card */}
            {instructor && (
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {instructor.user.avatar || instructor.user.image ? (
                      <img src={instructor.user.avatar || instructor.user.image || ""} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{instructor.user.name}</p>
                    <p className="text-xs text-slate-500">Instructeur</p>
                  </div>
                </div>
                {(locale === "fr" ? instructor.bioFr : instructor.bioEn) && (
                  <p className="text-xs text-slate-500 mt-3 line-clamp-3">
                    {locale === "fr" ? instructor.bioFr : instructor.bioEn}
                  </p>
                )}
                <Link
                  href={`/formations/instructeurs/${instructor.id}`}
                  className="block text-center mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  Voir le profil
                </Link>
              </div>
            )}

            {/* Share */}
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
