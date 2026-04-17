"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useActiveShop } from "@/components/formations/ShopProvider";

export default function ShopSwitcher() {
  const { activeShop, shops, shopCount, switchShop, loading } = useActiveShop();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (loading || !activeShop) return null;

  // Single shop: show non-clickable badge so user knows what they're in
  if (shopCount <= 1) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#006e2f]/8 text-[#006e2f] text-xs font-bold">
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-extrabold"
          style={{ background: activeShop.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
        >
          {activeShop.name[0]?.toUpperCase()}
        </span>
        <span className="max-w-[140px] truncate">{activeShop.name}</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#006e2f]/8 text-[#006e2f] text-xs font-bold hover:bg-[#006e2f]/15 transition-colors"
      >
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-extrabold"
          style={{ background: activeShop.themeColor || "linear-gradient(135deg, #006e2f, #22c55e)" }}
        >
          {activeShop.name[0]?.toUpperCase()}
        </span>
        <span className="max-w-[120px] md:max-w-[160px] truncate">{activeShop.name}</span>
        <span className={`material-symbols-outlined text-[16px] transition-transform ${open ? "rotate-180" : ""}`}>
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
            {shops.map((s) => {
              const isActive = s.id === activeShop.id;
              return (
                <button
                  key={s.id}
                  onClick={async () => {
                    setOpen(false);
                    if (!isActive) await switchShop(s.id);
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
                      {s.customDomain && s.customDomainVerified ? s.customDomain : `/boutique/${s.slug}`}
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
