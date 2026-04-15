"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  bio: string | null;
  expertise: string[];
  yearsExp: number;
}

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionFormat: string;
  productType: string;
  banner: string | null;
  price: number;
  originalPrice: number | null;
  currency: string;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  viewsCount: number;
  tags: string[];
  maxBuyers: number | null;
  currentBuyers: number;
  category: { id: string; slug: string; name: string } | null;
  instructeur: Instructeur;
  reviews: Review[];
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

const PRODUCT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  EBOOK: { label: "Ebook", icon: "menu_book" },
  TEMPLATE: { label: "Template", icon: "dashboard_customize" },
  NOTION: { label: "Template Notion", icon: "article" },
  PACK: { label: "Pack", icon: "inventory_2" },
  CHECKLIST: { label: "Checklist", icon: "checklist" },
  LICENCE: { label: "Licence", icon: "verified" },
  AUDIO: { label: "Audio", icon: "headphones" },
  VIDEO: { label: "Vidéo", icon: "videocam" },
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined"
          style={{
            fontSize: `${size}px`,
            color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db",
            fontVariationSettings: "'FILL' 1",
          }}
        >
          star
        </span>
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
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

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
    router.push(`/formations/checkout?pids=${product.id}`);
  }

  async function handleAddToCart() {
    if (!product || addingToCart) return;
    setAddingToCart(true);
    try {
      const res = await fetch("/api/formations/apprenant/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2500);
      }
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] animate-pulse">
        <div className="h-64 bg-gray-200" />
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
          <div className="h-10 w-2/3 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-60 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-gray-300 text-5xl">inventory_2</span>
          <h2 className="text-lg font-bold text-[#191c1e] mt-3">Produit introuvable</h2>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Ce produit n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/formations/explorer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = PRODUCT_TYPE_LABELS[product.productType] ?? { label: product.productType, icon: "inventory_2" };
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Hero */}
      <div
        className="relative h-64 md:h-80"
        style={{
          background: product.banner
            ? `url(${product.banner}) center/cover`
            : "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
        <div className="absolute top-4 left-4">
          <Link
            href="/formations/explorer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Catalogue
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-20 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#006e2f]/10 text-[#006e2f]">
                  <span className="material-symbols-outlined text-[13px]">{typeInfo.icon}</span>
                  {typeInfo.label}
                </span>
                {product.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-[#5c647a]">
                    {product.category.name}
                  </span>
                )}
                {product.salesCount > 100 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      local_fire_department
                    </span>
                    BESTSELLER
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.rating} size={16} />
                  <span className="text-sm font-bold text-[#191c1e]">
                    {product.rating > 0 ? product.rating.toFixed(1) : "Nouveau"}
                  </span>
                  {product.reviewsCount > 0 && (
                    <span className="text-xs text-[#5c647a]">({product.reviewsCount})</span>
                  )}
                </div>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                  {fmt(product.salesCount)} vente{product.salesCount > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  {fmt(product.viewsCount)} vue{product.viewsCount > 1 ? "s" : ""}
                </span>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {product.tags.slice(0, 6).map((t) => (
                    <span key={t} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-extrabold text-[#191c1e] mb-3">Description</h2>
              {product.description ? (
                <div className="text-sm text-[#5c647a] leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucune description fournie.</p>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-extrabold text-[#191c1e] mb-4 flex items-center gap-2">
                Avis des acheteurs
                <span className="text-sm font-semibold text-[#5c647a]">
                  ({product.reviewsCount})
                </span>
              </h2>

              {product.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-gray-300 text-5xl">reviews</span>
                  <p className="text-sm text-[#5c647a] mt-3">Aucun avis pour ce produit pour l&apos;instant.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {product.reviews.map((r) => (
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
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-4">
              <div className="mb-4">
                {discount > 0 && (
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 mb-2">
                    -{discount}%
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-[#006e2f]">{fmt(product.price)}</p>
                  <span className="text-sm font-bold text-[#5c647a]">FCFA</span>
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <p className="text-sm text-gray-400 line-through">{fmt(product.originalPrice)} FCFA</p>
                )}
                <p className="text-xs text-[#5c647a] mt-1">
                  ≈ {Math.round(product.price / 655.957)} EUR
                </p>
              </div>

              {product.maxBuyers && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-800 font-semibold">Stock limité</span>
                    <span className="text-amber-800 font-bold">
                      {product.currentBuyers} / {product.maxBuyers}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (product.currentBuyers / product.maxBuyers) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  Acheter maintenant
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full py-3 rounded-xl text-[#006e2f] font-bold text-sm border-2 border-[#006e2f]/20 hover:border-[#006e2f]/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingToCart ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  ) : addedToCart ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      Ajouté au panier
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                      Ajouter au panier
                    </>
                  )}
                </button>
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                  <span className="material-symbols-outlined text-[#006e2f] text-[16px]">download</span>
                  Accès immédiat après paiement
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                  <span className="material-symbols-outlined text-[#006e2f] text-[16px]">verified_user</span>
                  Paiement sécurisé 100%
                </div>
                <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                  <span className="material-symbols-outlined text-[#006e2f] text-[16px]">event_available</span>
                  Remboursement 14 jours
                </div>
              </div>
            </div>

            {/* Instructeur card */}
            <Link
              href={`/formations/instructeurs/${product.instructeur.userId}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#006e2f]/30 transition-colors"
            >
              <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-2">Proposé par</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {product.instructeur.image ? (
                    <img src={product.instructeur.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials(product.instructeur.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#191c1e] truncate">
                    {product.instructeur.name ?? "Vendeur"}
                  </p>
                  <p className="text-xs text-[#5c647a]">
                    {product.instructeur.yearsExp > 0
                      ? `${product.instructeur.yearsExp} an(s) d'expérience`
                      : "Nouveau vendeur"}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[#5c647a] text-[18px]">chevron_right</span>
              </div>
              {product.instructeur.bio && (
                <p className="text-xs text-[#5c647a] mt-3 line-clamp-2 leading-relaxed">
                  {product.instructeur.bio}
                </p>
              )}
              {product.instructeur.expertise && product.instructeur.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {product.instructeur.expertise.slice(0, 3).map((e) => (
                    <span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a]">
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
