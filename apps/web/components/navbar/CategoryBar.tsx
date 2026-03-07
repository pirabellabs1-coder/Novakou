"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/dev/mock-data";

function CategoryBarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("categorie");

  function selectCategory(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("categorie") === slug) {
      params.delete("categorie");
    } else {
      params.set("categorie", slug);
    }
    router.push(`/feed?${params.toString()}`);
  }

  return (
    <div className="sticky top-16 z-40 bg-[#0f1117] border-b border-white/10">
      <div
        className="flex overflow-x-auto px-4 py-2 gap-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Tout */}
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("categorie");
            router.push(`/feed?${params.toString()}`);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors",
            !activeCategory
              ? "bg-primary text-[#0f1117]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <span className="material-symbols-outlined text-base">grid_view</span>
          <span>Tout</span>
        </button>

        {/* Catégories */}
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => selectCategory(cat.slug)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors",
                active
                  ? "bg-primary text-[#0f1117]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="material-symbols-outlined text-base">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryBar() {
  return (
    <Suspense fallback={
      <div className="sticky top-16 z-40 bg-[#0f1117] border-b border-white/10 h-12" />
    }>
      <CategoryBarInner />
    </Suspense>
  );
}
