"use client";

import Link from "next/link";
import { StarRating, discountPercent } from "@/lib/formations/format-helpers";

// ── Data interface ──────────────────────────────────────────────

export interface DigitalProductCardData {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  banner: string | null;
  price: number;
  originalPrice: number | null;
  isFree: boolean;
  productType: string;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  maxBuyers: number | null;
  currentBuyers: number;
  previewEnabled: boolean;
  instructeur: {
    user: {
      name: string;
      avatar: string | null;
      image: string | null;
    };
  };
  category: {
    nameFr: string;
    nameEn: string;
    slug: string;
  } | null;
}

// ── Props ───────────────────────────────────────────────────────

interface DigitalProductCardProps {
  product: DigitalProductCardData;
  lang: string;
  /** Translation function — expects keys like "product_type_EBOOK", "free", etc. */
  t: (key: string) => string;
}

// ── Helpers ─────────────────────────────────────────────────────

const PRODUCT_TYPE_ICONS: Record<string, string> = {
  EBOOK: "📖",
  TEMPLATE: "📄",
  LICENCE: "🔑",
  AUDIO: "🎧",
  VIDEO: "🎬",
};

function productIcon(productType: string): string {
  return PRODUCT_TYPE_ICONS[productType] ?? "📦";
}

// ── Component ───────────────────────────────────────────────────

export default function DigitalProductCard({
  product,
  lang,
  t,
}: DigitalProductCardProps) {
  const title =
    lang === "en" ? product.titleEn || product.titleFr : product.titleFr;

  const discount = discountPercent(product.price, product.originalPrice);
  const isLimited = product.maxBuyers && product.maxBuyers > 0;
  const stockPct = isLimited
    ? ((product.maxBuyers! - product.currentBuyers) / product.maxBuyers!) * 100
    : 100;

  const salesLabel = lang === "en" ? "sales" : "ventes";
  const viewLabel = lang === "en" ? "View" : "Voir";

  return (
    <Link
      href={`/formations/produits/${product.slug}`}
      className="group bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      {/* ── Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-slate-800 dark:bg-slate-700">
        {product.banner ? (
          <img
            src={product.banner}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-5xl">{productIcon(product.productType)}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {t(`product_type_${product.productType}`)}
          </span>
          {product.previewEnabled && (
            <span className="bg-sky-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {t("product_preview_available")}
            </span>
          )}
        </div>

        {discount && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Instructor */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {product.instructeur.user.name}
        </p>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-500 text-sm font-bold">
              {product.rating.toFixed(1)}
            </span>
            <StarRating rating={product.rating} />
            <span className="text-xs text-slate-400">
              ({product.reviewsCount})
            </span>
          </div>
        )}

        {/* Sales + Stock */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
          <span>
            {product.salesCount} {salesLabel}
          </span>
          {isLimited && (
            <>
              <span>&middot;</span>
              <span
                className={
                  stockPct < 20
                    ? "text-red-500 font-bold"
                    : "text-orange-500"
                }
              >
                {t("product_limited")}
              </span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            {product.isFree ? (
              <span className="text-lg font-extrabold text-green-500">
                {t("free")}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {product.price.toFixed(2)}&euro;
                </span>
                {discount && (
                  <span className="text-sm text-slate-400 line-through">
                    {product.originalPrice!.toFixed(2)}&euro;
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
            {viewLabel} &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
