"use client";

import { useEffect, useState } from "react";
import { Prix } from "@/components/formations/Prix";
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


/**
 * Section « Vous aimerez aussi » — recommandations par catégorie (v2 Phase 2).
 * Affiche jusqu'à 4 produits/formations similaires. Ne rend rien s'il n'y a
 * aucune reco (nouvelle catégorie, catalogue vide) → pas de section vide.
 *
 * Même langue que les cartes de la marketplace : coque double-bezel, vignette
 * 4:3, prix tabulaires, levée au survol (transform seul).
 */
export function RelatedProducts({
  categoryId,
  excludeId,
  instructeurId,
  title = "Vous aimerez aussi",
}: {
  categoryId?: string | null;
  excludeId: string;
  /** Vendeur courant : ne recommander QUE ses produits (anti-fuite). */
  instructeurId?: string | null;
  title?: string;
}) {
  const [items, setItems] = useState<Reco[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (instructeurId) qs.set("instructeurId", instructeurId);
    else if (categoryId) qs.set("categoryId", categoryId);
    qs.set("excludeId", excludeId);
    qs.set("limit", "4");
    fetch(`/api/formations/public/recommendations?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, [categoryId, excludeId, instructeurId]);

  if (!loaded || items.length === 0) return null;

  return (
    <section aria-labelledby="reco-titre">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f0f6f2] text-[#006e2f]" aria-hidden="true">
          <Sparkles size={16} />
        </span>
        <h2
          id="reco-titre"
          className="text-lg font-bold tracking-tight text-[#0e1512] [font-family:var(--nkf-display,inherit)] md:text-xl"
        >
          {title}
        </h2>
      </div>
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
        {items.map((it) => {
          const href = it.kind === "formation" ? `/formation/${it.slug}` : `/produit/${it.slug}`;
          const discount =
            it.originalPrice && it.originalPrice > it.price
              ? Math.round((1 - it.price / it.originalPrice) * 100)
              : null;
          return (
            <li key={`${it.kind}-${it.id}`} className="min-w-0">
              <Link
                href={href}
                className="group block h-full rounded-[22px] bg-[rgba(14,21,18,.035)] p-1.5 shadow-[inset_0_0_0_1px_rgba(14,21,18,.06),inset_0_1px_0_rgba(255,255,255,.6),0_1px_2px_rgba(14,21,18,.05)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgba(14,21,18,.06),0_14px_28px_-8px_rgba(14,21,18,.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#006e2f] motion-reduce:hover:translate-y-0"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-[16px] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_1px_2px_rgba(14,21,18,.05)]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#eef3ef]">
                    {it.thumbnail ? (
                      <AdaptiveImage
                        src={productImageSrc(it.thumbnail, 500) || it.thumbnail}
                        alt={it.title}
                        imgClassName="transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(60%_60%_at_50%_40%,#DFEDE4,#F0F6F2)] text-[#006e2f]/60"
                        aria-hidden="true"
                      >
                        <ShoppingBag size={36} strokeWidth={1.25} />
                      </div>
                    )}
                    {discount && (
                      <span className="absolute right-3 top-3 rounded-full bg-[rgba(14,21,18,.88)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white tabular-nums">
                        −{discount} %
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3.5">
                    {it.category && (
                      <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#006e2f]">{it.category}</p>
                    )}
                    <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-snug tracking-tight text-[#0e1512] transition-colors group-hover:text-[#006e2f]">
                      {it.title}
                    </h3>
                    {(it.rating > 0 || it.salesCount > 0) && (
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#5c6b62]">
                        {it.rating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star size={11} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                            <span className="font-bold tabular-nums text-[#0e1512]">{it.rating.toFixed(1)}</span>
                          </span>
                        )}
                        {it.salesCount > 0 && (
                          <span className="font-semibold tabular-nums">
                            {it.salesCount} {it.kind === "formation" ? "élèves" : "ventes"}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-auto pt-2.5 text-sm font-extrabold tabular-nums tracking-tight text-[#0e1512]">
                      <Prix fcfa={it.price} />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
