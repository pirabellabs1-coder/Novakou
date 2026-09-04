"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useActiveShop } from "@/components/formations/ShopProvider";

export default function ShopSwitcher() {
  const { activeShop, shops, shopCount, scope, setScope, loading } = useActiveShop();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (loading) return null;

  const isAll = scope === "all";
  // Boutique affichée par le bouton quand une portée précise est active.
  const current = isAll ? null : (shops.find((s) => s.id === scope) ?? activeShop);

  // Single shop: show a clean static chip (not clickable) so the user always
  // sees which shop they're in. Click goes to /vendeur/boutiques.
  if (shopCount <= 1 && activeShop) {
    return (
      <Link
        href="/vendeur/boutiques"
        className="hidden md:inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        title="Gérer mes boutiques"
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-extrabold"
          style={{ background: activeShop.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
        >
          {activeShop.name[0]?.toUpperCase()}
        </span>
        <span className="text-xs font-bold text-slate-800 max-w-[140px] truncate">{activeShop.name}</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hidden md:inline-flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      >
        {isAll ? (
          <>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white bg-[#191c1e]">
              <span className="material-symbols-outlined text-[16px]">apps</span>
            </span>
            <span className="text-xs font-bold text-slate-800 max-w-[160px] truncate">Toutes les boutiques</span>
          </>
        ) : (
          <>
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-extrabold"
              style={{ background: current?.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              {current?.name[0]?.toUpperCase()}
            </span>
            <span className="text-xs font-bold text-slate-800 max-w-[120px] md:max-w-[160px] truncate">{current?.name}</span>
          </>
        )}
        <span className={`material-symbols-outlined text-[16px] text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c647a]">
              Vos boutiques ({shopCount})
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {/* Vue globale cumulée */}
            <button
              onClick={async () => { setOpen(false); if (!isAll) await setScope("all"); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${isAll ? "bg-[#006e2f]/5" : ""}`}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-[#191c1e] flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">apps</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#191c1e] truncate">Toutes les boutiques</p>
                <p className="text-[11px] text-[#5c647a] truncate">Vue globale cumulée</p>
              </div>
              {isAll && (
                <span className="material-symbols-outlined text-[18px] text-[#006e2f] flex-shrink-0">check_circle</span>
              )}
            </button>
            {shops.map((s) => {
              const isActive = s.id === scope;
              return (
                <button
                  key={s.id}
                  onClick={async () => {
                    setOpen(false);
                    if (!isActive) await setScope(s.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                    isActive ? "bg-[#006e2f]/5" : ""
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                    style={{ background: s.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
                  >
                    {s.name[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-[#191c1e] truncate">{s.name}</p>
                      {s.isPrimary && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-px rounded bg-[#006e2f]/10 text-[#006e2f]">
                          Prin.
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5c647a] truncate">
                      {s.customDomain && s.customDomainVerified ? s.customDomain : `/${s.slug}`}
                    </p>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined text-[18px] text-[#006e2f] flex-shrink-0">
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="border-t border-gray-100 p-2 flex flex-col">
            <Link
              href="/vendeur/boutiques"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              Gérer toutes mes boutiques
            </Link>
            {shopCount < 5 && (
              <Link
                href="/vendeur/choisir-boutique"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#006e2f] hover:bg-[#006e2f]/5"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Créer une nouvelle boutique
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
