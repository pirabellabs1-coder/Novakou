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
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-[#d5ddd8]"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

const FLECHE =
  "grid h-9 w-9 place-items-center rounded-full bg-white text-[#5c6b62] " +
  "shadow-[inset_0_0_0_1px_rgba(14,21,18,.08),inset_0_1px_0_#fff,0_1px_2px_rgba(14,21,18,.05)] " +
  "transition-colors hover:text-[#006e2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006e2f]";

/**
 * Carrousel d'avis — cartes défilables horizontalement (scroll-snap) avec
 * flèches précédent/suivant. Ne rend rien s'il n'y a pas assez d'avis.
 *
 * `sansCadre` : rendu nu (ni carte ni titre), pour s'insérer dans une section
 * qui porte déjà son en-tête (fiches produit / formation).
 */
export default function ReviewsCarousel({
  reviews,
  title = "Ce qu'en disent les acheteurs",
  themeColor = "#006e2f",
  sansCadre = false,
}: {
  reviews: CarouselReview[];
  title?: string;
  themeColor?: string;
  sansCadre?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  if (!reviews || reviews.length < 2) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * Math.min(340, el.clientWidth * 0.9), behavior: reduit ? "auto" : "smooth" });
  };

  const fleches = (
    <div className="hidden items-center gap-2 sm:flex">
      <button type="button" aria-label="Avis précédents" onClick={() => scrollBy(-1)} className={FLECHE}>
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Avis suivants" onClick={() => scrollBy(1)} className={FLECHE}>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  );

  const piste = (
    <div
      ref={scroller}
      // Région défilable atteignable au clavier (flèches gauche/droite).
      role="region"
      aria-label={title}
      tabIndex={0}
      className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] focus-visible:rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006e2f] [&::-webkit-scrollbar]:hidden"
    >
      {reviews.map((r) => (
        <article
          key={r.id}
          className="flex w-[280px] shrink-0 snap-start flex-col rounded-2xl bg-[#f7f9fb] p-5 shadow-[inset_0_0_0_1px_rgba(14,21,18,.06),inset_0_1px_0_#fff] md:w-[320px]"
        >
          <Quote size={22} style={{ color: themeColor }} className="mb-2 opacity-30" aria-hidden="true" />
          <p className="line-clamp-5 flex-1 text-sm leading-relaxed text-[#2f3a34]">{r.comment}</p>
          <div className="mt-4 flex items-center gap-3 border-t border-[#e6ece8] pt-4">
            {r.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.user.image} alt="" loading="lazy" decoding="async" className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: themeColor }}
                aria-hidden="true"
              >
                {(r.user.name?.[0] ?? "A").toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#0e1512]">{r.user.name ?? "Acheteur"}</p>
              <div className="flex items-center gap-2">
                <Stars rating={r.rating} />
                <span className="text-[11px] text-[#8a968e]">{fmtDate(r.createdAt)}</span>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  if (sansCadre) {
    return (
      <div>
        <div className="mb-4 flex justify-end">{fleches}</div>
        {piste}
      </div>
    );
  }

  return (
    <section className="rounded-[22px] bg-white p-6 shadow-[inset_0_0_0_1px_rgba(14,21,18,.06),0_1px_2px_rgba(14,21,18,.05)] md:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#0e1512]">
          <Star size={18} className="fill-amber-400 text-amber-400" aria-hidden="true" />
          {title}
        </h2>
        {fleches}
      </div>
      {piste}
    </section>
  );
}
