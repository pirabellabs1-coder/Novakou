"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  /** Bornes affichées (1-based) et total, pour la ligne « Affichage x–y sur n ». */
  debut: number;
  fin: number;
  total: number;
};

/** Numéros affichés : 7 visibles au plus, ellipses au milieu. */
function numerosPages(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const debut = Math.max(2, page - 1);
  const fin = Math.min(total - 1, page + 1);
  if (debut > 2) pages.push("…");
  for (let i = debut; i <= fin; i++) pages.push(i);
  if (fin < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

/** ← Précédent · 1 2 3 … · Suivant → (numéros masqués sur mobile). */
export function Pagination({ page, totalPages, onPage, debut, fin, total }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} className="nkx-btn nkx-btn--sm" aria-label="Page précédente">
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          Précédent
        </button>
        <div className="mx-1 hidden items-center gap-1 sm:flex">
          {numerosPages(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="select-none px-1.5 text-[#5C6B62]" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className="nkx-page tabular-nums"
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="nkx-btn nkx-btn--sm"
          aria-label="Page suivante"
        >
          Suivant
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs text-[#5C6B62] tabular-nums">
        Affichage {debut}–{fin} sur {total}
      </p>
    </nav>
  );
}
