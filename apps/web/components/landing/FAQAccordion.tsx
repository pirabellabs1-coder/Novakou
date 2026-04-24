"use client";

import { useState } from "react";

export function FAQAccordion({ items }: { items: Array<{ q: string; a: string }> }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
          >
            <span className="font-bold text-[#191c1e] text-base">{item.q}</span>
            <span
              className={`material-symbols-outlined text-[22px] text-[#5c647a] transition-transform ${open === i ? "rotate-180" : ""}`}
            >
              expand_more
            </span>
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: open === i ? "800px" : 0 }}
          >
            <div className="px-5 pb-5 text-[#5c647a] text-sm leading-relaxed whitespace-pre-line">
              {item.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
