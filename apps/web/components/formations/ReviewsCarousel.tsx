"use client";

import { useRef } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

export interface CarouselReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Carrousel d'avis — cartes défilables horizontalement (scroll-snap) avec
 * flèches précédent/suivant. Ne rend rien s'il n'y a pas assez d'avis.
 */
export default function ReviewsCarousel({
  reviews,
  title = "Ce qu'en disent les acheteurs",
  themeColor = "#006e2f",
}: {
  reviews: CarouselReview[];
  title?: string;
  themeColor?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  if (!reviews || reviews.length < 2) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(340, el.clientWidth * 0.9), behavior: "smooth" });
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-lg font-extrabold text-[#191c1e] flex items-center gap-2">
          <Star size={18} className="fill-amber-400 text-amber-400" />
          {title}
        </h2>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            aria-label="Avis précédents"
            onClick={() => scrollBy(-1)}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Avis suivants"
            onClick={() => scrollBy(1)}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r) => (
          <div
            key={r.id}
            className="snap-start shrink-0 w-[280px] md:w-[320px] bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col"
          >
            <Quote size={22} style={{ color: themeColor }} className="opacity-30 mb-2" />
            <p className="text-sm text-[#374151] leading-relaxed line-clamp-5 flex-1">{r.comment}</p>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200/70">
              {r.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.user.image} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: themeColor }}
                >
                  {(r.user.name?.[0] ?? "A").toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#191c1e] truncate">{r.user.name ?? "Acheteur"}</p>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-[11px] text-[#9ca3af]">{fmtDate(r.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
