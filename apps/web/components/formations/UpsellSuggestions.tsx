"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Suggestion {
  kind: "formation" | "product";
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  rating: number;
  count: number;
  href: string;
}

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

/**
 * Suggest 3-6 related products to add at checkout. Keep it subtle (horizontal
 * scroll on mobile) — don't distract from the primary CTA.
 */
export default function UpsellSuggestions({
  kind,
  id,
  title = "Pour aller plus loin",
}: {
  kind: "formation" | "product";
  id: string;
  title?: string;
}) {
  const [items, setItems] = useState<Suggestion[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/formations/upsell?kind=${kind}&id=${encodeURIComponent(id)}`);
        const j = await res.json();
        if (!cancelled) setItems(Array.isArray(j.data) ? j.data : []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => { cancelled = true; };
  }, [kind, id]);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <span className="text-[11px] text-slate-500">Sélection du vendeur</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory">
        {items.map((s) => (
          <Link
            key={`${s.kind}-${s.id}`}
            href={s.href}
            className="flex-shrink-0 w-48 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow snap-start"
          >
            <div className="aspect-video relative bg-slate-100">
              {s.image ? (
                <Image src={s.image} alt={s.title} fill sizes="200px" unoptimized className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-slate-300">
                    {s.kind === "formation" ? "school" : "inventory_2"}
                  </span>
                </div>
              )}
              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur">
                {s.kind === "formation" ? "Formation" : "Produit"}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">{s.title}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-extrabold text-emerald-700">{fmtFCFA(s.price)}</span>
                {s.rating > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
                    <span className="material-symbols-outlined text-[12px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    {s.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
