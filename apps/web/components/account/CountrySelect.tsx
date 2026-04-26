"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES, groupCountriesByRegion, type Country } from "@/lib/countries";
import { Flag } from "@/components/ui/Flag";

/**
 * Custom dropdown listing every country, grouped by region.
 * Renders real SVG flag images (works on every platform incl. Windows where
 * native emoji flags break inside <option>).
 *
 * Value = country name (for legacy compatibility with existing data).
 * Use `valueKey="code"` to store the ISO-2 code instead.
 */
export default function CountrySelect({
  value,
  onChange,
  className,
  valueKey = "name",
  includeBlank = false,
  placeholder = "Sélectionnez un pays",
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  valueKey?: "name" | "code";
  includeBlank?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const groups = groupCountriesByRegion();
  const regionOrder: Country["region"][] = [
    "Afrique",
    "Europe",
    "Amériques",
    "Moyen-Orient",
    "Asie",
    "Océanie",
  ];

  const getVal = (c: Country) => (valueKey === "code" ? c.code : c.name);

  // Find current selection
  const selected = COUNTRIES.find((c) => getVal(c) === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = search.trim().toLowerCase();
  const matches = (c: Country) =>
    !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          className ??
          "w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] bg-white text-left focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
        }
      >
        {selected ? (
          <>
            <Flag code={selected.code} size="sm" />
            <span className="flex-1">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-zinc-400">{placeholder}</span>
        )}
        <span className="material-symbols-outlined text-[18px] text-zinc-400">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 flex-shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pays…"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#006e2f]"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {includeBlank && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:bg-gray-50"
              >
                {placeholder}
              </button>
            )}
            {regionOrder.map((region) => {
              const items = (groups[region] ?? []).filter(matches);
              if (!items.length) return null;
              return (
                <div key={region}>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-gray-50 sticky top-0">
                    {region}
                  </div>
                  {items.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        onChange(getVal(c));
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        getVal(c) === value ? "bg-[#006e2f]/5 font-bold text-[#006e2f]" : "text-[#191c1e]"
                      }`}
                    >
                      <Flag code={c.code} size="sm" />
                      <span className="flex-1">{c.name}</span>
                      {getVal(c) === value && (
                        <span className="material-symbols-outlined text-[16px] text-[#006e2f]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { COUNTRIES };
