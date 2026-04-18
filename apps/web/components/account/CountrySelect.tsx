"use client";

import { COUNTRIES, groupCountriesByRegion, type Country } from "@/lib/countries";
import { countryToFlag } from "@/lib/tracking/geo";

/**
 * <select> listing every country, grouped by region.
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

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
      }
    >
      {includeBlank && <option value="">{placeholder}</option>}
      {regionOrder.map((region) => {
        const items = groups[region];
        if (!items?.length) return null;
        return (
          <optgroup key={region} label={region}>
            {items.map((c) => (
              <option key={c.code} value={getVal(c)}>
                {countryToFlag(c.code)} {c.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

export { COUNTRIES };
