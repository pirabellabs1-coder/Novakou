"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PixelInjector } from "@/components/formations/PixelInjector";
import { InquiryWidget } from "@/components/formations/InquiryWidget";

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

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  PDF: { label: "PDF", icon: "picture_as_pdf" },
  EBOOK: { label: "E-book", icon: "menu_book" },
  VIDEO: { label: "Vidéo", icon: "play_circle" },
  AUDIO: { label: "Audio", icon: "music_note" },
  TEMPLATE: { label: "Template", icon: "dashboard_customize" },
  COURSE: { label: "Cours digital", icon: "school" },
  SOFTWARE: { label: "Logiciel", icon: "code" },
  BUNDLE: { label: "Pack", icon: "inventory_2" },
  OTHER: { label: "Produit digital", icon: "shopping_bag" },
};

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined text-yellow-400"
          style={{
            fontSize: `${size}px`,
            fontVariationSettings: s <= Math.floor(rating) ? "'FILL' 1" : "'FILL' 0",
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
  const [activeTab, setActiveTab] = useState<"description" | "avis">("description");

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
          <span className="material-symbols-outlined text-gray-300 text-5xl">shopping_bag</span>
          <h2 className="text-lg font-bold text-[#191c1e] mt-3">Produit introuvable</h2>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Ce produit n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/explorer"
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

  const typeInfo = TYPE_LABELS[product.productType] ?? TYPE_LABELS.OTHER;
  const isFree = product.price === 0;
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const remaining = product.maxBuyers != null && product.currentBuyers != null
    ? Math.max(0, product.maxBuyers - product.currentBuyers)
    : null;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Pixels vendeur : FB, Google, TikTok — event ViewContent */}
      <PixelInjector
        pixels={product.instructeur.marketingPixels ?? []}
        event={{ name: "ViewContent", value: product.price, currency: "XOF" }}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-[#5c647a]">
          <Link href="/" className="hover:text-[#006e2f] transition-colors">Accueil</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <Link href="/explorer" className="hover:text-[#006e2f] transition-colors">Explorer</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-[#191c1e] font-medium truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Banner */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#003d1a] to-[#22c55e]">
              {product.banner ? (
                <img src={product.banner} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/30 text-[100px]">{typeInfo.icon}</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/95 text-[#191c1e] shadow-sm backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[12px] text-[#006e2f]">{typeInfo.icon}</span>
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
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    POPULAIRE
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] leading-tight">{product.title}</h1>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.rating} size={16} />
                  <span className="text-sm font-bold text-[#191c1e]">
                    {product.rating > 0 ? product.rating.toFixed(1) : "Nouveau"}
                  </span>
                  {product.reviewsCount > 0 && (
                    <span className="text-xs text-[#5c647a]">({product.reviewsCount} avis)</span>
                  )}
                </div>
                <span className="text-xs text-[#5c647a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                  <span className="font-semibold text-[#191c1e]">{fmt(product.salesCount)}</span>
                  vente{product.salesCount !== 1 ? "s" : ""}
                </span>
                {remaining !== null && remaining < 50 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                    Plus que {remaining} {remaining > 1 ? "places" : "place"}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit">
              {(["description", "avis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab ? "bg-[#006e2f] text-white shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"
                  }`}
                >
                  {tab === "description" ? "Description" : `Avis (${product.reviewsCount})`}
                </button>
              ))}
            </div>

            {/* Description tab */}
            {activeTab === "description" && (
              <div className="space-y-5">
                {product.description ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                    <h2 className="text-lg font-extrabold text-[#191c1e] mb-3">À propos de ce produit</h2>
                    {/* Render HTML if description contains tags, otherwise plain text */}
                    {product.description.includes("<") && product.description.includes(">") ? (
                      <div
                        className="text-sm text-[#5c647a] leading-relaxed prose prose-sm max-w-none prose-headings:text-[#191c1e] prose-strong:text-[#191c1e] prose-ul:my-2 prose-li:my-0.5"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    ) : (
                      <div className="text-sm text-[#5c647a] leading-relaxed whitespace-pre-wrap">
                        {product.description}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <span className="material-symbols-outlined text-gray-300 text-4xl">description</span>
                    <p className="text-sm text-[#5c647a] mt-2">Aucune description fournie pour ce produit.</p>
                  </div>
                )}

                {/* Seller card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                  <h2 className="text-lg font-extrabold text-[#191c1e] mb-4">À propos du créateur</h2>
                  <Link href={`/instructeurs/${product.instructeur.userId}`} className="flex items-start gap-4 group">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {product.instructeur.image ? (
                        <img src={product.instructeur.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials(product.instructeur.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#191c1e] group-hover:text-[#006e2f] transition-colors">
                        {product.instructeur.name ?? "Créateur"}
                      </p>
                      {product.instructeur.yearsExp > 0 && (
                        <p className="text-xs text-[#5c647a] mt-0.5">
                          {product.instructeur.yearsExp} an{product.instructeur.yearsExp > 1 ? "s" : ""} d&apos;expérience
                        </p>
                      )}
                      {product.instructeur.bio && (
                        <p className="text-xs text-[#5c647a] mt-2 leading-relaxed line-clamp-3">{product.instructeur.bio}</p>
                      )}
                      {product.instructeur.expertise && product.instructeur.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {product.instructeur.expertise.slice(0, 4).map((e) => (
                            <span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-[#5c647a] text-[18px] group-hover:text-[#006e2f] transition-colors">chevron_right</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === "avis" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                {product.reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-gray-300 text-5xl">reviews</span>
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
            )}
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
                  {!isFree && (
                    <p className="text-xs text-[#5c647a] mt-1">≈ {Math.round(product.price / 655.957)} EUR</p>
                  )}
                </div>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-md"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  <span className="material-symbols-outlined text-[18px]">{isFree ? "download" : "shopping_cart"}</span>
                  {isFree ? "Télécharger maintenant" : "Acheter maintenant"}
                </button>

                <div className="mt-3">
                  <InquiryWidget
                    productId={product.id}
                    productTitle={product.title}
                    vendorName={product.instructeur.name}
                  />
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px]">all_inclusive</span>
                    Accès et téléchargement à vie
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px]">{typeInfo.icon}</span>
                    Format {typeInfo.label}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px]">devices</span>
                    Accessible sur mobile & desktop
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px]">verified_user</span>
                    Paiement 100% sécurisé
                  </div>
                  {!isFree && (
                    <div className="flex items-center gap-2 text-xs text-[#5c647a]">
                      <span className="material-symbols-outlined text-[#006e2f] text-[16px]">event_available</span>
                      Remboursement 14 jours
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mini seller card */}
            <Link
              href={`/instructeurs/${product.instructeur.userId}`}
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#006e2f]/30 transition-colors"
            >
              <p className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-2">Créé par</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {product.instructeur.image ? (
                    <img src={product.instructeur.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials(product.instructeur.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#191c1e] truncate">{product.instructeur.name ?? "Créateur"}</p>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating rating={product.rating} size={12} />
                      <span className="text-[11px] text-[#5c647a]">({product.reviewsCount})</span>
                    </div>
                  )}
                </div>
                <span className="material-symbols-outlined text-[#5c647a] text-[18px]">chevron_right</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
