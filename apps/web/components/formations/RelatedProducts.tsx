"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdaptiveImage from "@/components/formations/AdaptiveImage";
import { Star, ShoppingBag, Sparkles } from "lucide-react";
import { productImageSrc } from "@/lib/utils/image-url";

interface Reco {
  id: string;
  kind: "formation" | "product";
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  thumbnail: string | null;
  rating: number;
  salesCount: number;
  seller: string;
  category: string | null;
}

const fmtFCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

/**
 * Section « Vous aimerez aussi » — recommandations par catégorie (v2 Phase 2).
 * Affiche jusqu'à 4 produits/formations similaires. Ne rend rien s'il n'y a
 * aucune reco (nouvelle catégorie, catalogue vide) → pas de section vide.
 */
export function RelatedProducts({
  categoryId,
  excludeId,
  title = "Vous aimerez aussi",
}: {
  categoryId?: string | null;
  excludeId: string;
  title?: string;
}) {
  const [items, setItems] = useState<Reco[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (categoryId) qs.set("categoryId", categoryId);
    qs.set("excludeId", excludeId);
    qs.set("limit", "4");
    fetch(`/api/formations/public/recommendations?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, [categoryId, excludeId]);

  if (!loaded || items.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={18} className="text-[#006e2f]" />
        <h2 className="text-lg font-extrabold text-[#191c1e]">{title}</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => {
          const href = it.kind === "formation" ? `/formation/${it.slug}` : `/produit/${it.slug}`;
          const discount =
            it.originalPrice && it.originalPrice > it.price
              ? Math.round((1 - it.price / it.originalPrice) * 100)
              : null;
          return (
            <Link
              key={`${it.kind}-${it.id}`}
              href={href}
              className="group block rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 hover:border-[#006e2f]/20 transition-all"
            >
              <div className="relative aspect-square bg-slate-100 overflow-hidden">
                {it.thumbnail ? (
                  <AdaptiveImage
                    src={productImageSrc(it.thumbnail, 500) || it.thumbnail}
                    alt={it.title}
                    imgClassName="group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#006e2f] to-[#22c55e] text-white/70">
                    <ShoppingBag size={40} />
                  </div>
                )}
                {discount && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    -{discount}%
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-[13px] font-extrabold text-[#006e2f] leading-snug line-clamp-2 min-h-[2.4rem] group-hover:text-[#00481f] transition-colors">
                  {it.title}
                </h3>
                {(it.rating > 0 || it.salesCount > 0) && (
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#5c647a]">
                    {it.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-[#191c1e]">{it.rating.toFixed(1)}</span>
                      </span>
                    )}
                    {it.salesCount > 0 && (
                      <span className="font-semibold">
                        {it.salesCount} {it.kind === "formation" ? "élèves" : "ventes"}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-2 text-sm font-extrabold text-[#006e2f]">
                  {it.price === 0 ? "Gratuit" : `${fmtFCFA(it.price)} FCFA`}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
