"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// 60 curated colors, organized by hue family then intensity (light → dark)
const PRESET_COLORS: Array<{ label: string; colors: string[] }> = [
  { label: "Vert (marque)", colors: ["#ecfdf5", "#a7f3d0", "#22c55e", "#10b981", "#059669", "#006e2f", "#064e3b"] },
  { label: "Bleu", colors: ["#eff6ff", "#93c5fd", "#3b82f6", "#2563eb", "#1d4ed8", "#1e3a8a", "#172554"] },
  { label: "Indigo / Violet", colors: ["#eef2ff", "#a5b4fc", "#6366f1", "#4f46e5", "#8b5cf6", "#7c3aed", "#581c87"] },
  { label: "Rose / Magenta", colors: ["#fdf2f8", "#f9a8d4", "#ec4899", "#db2777", "#d946ef", "#a21caf", "#701a75"] },
  { label: "Rouge / Orange", colors: ["#fef2f2", "#fca5a5", "#ef4444", "#dc2626", "#f97316", "#ea580c", "#7c2d12"] },
  { label: "Jaune / Ambre", colors: ["#fffbeb", "#fcd34d", "#f59e0b", "#d97706", "#facc15", "#ca8a04", "#713f12"] },
  { label: "Gris / Neutre", colors: ["#ffffff", "#f3f4f6", "#d1d5db", "#9ca3af", "#6b7280", "#374151", "#111827"] },
];

interface Props {
  value: string | null | undefined;
  onChange: (color: string | null) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const current = value ?? "";
  const displayColor = value || "transparent";
  const isEmpty = !value;

  // Position the popup relative to the button (fixed to escape overflow clipping)
  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({ top: r.bottom + 6, left: r.left, width: Math.max(320, r.width) });
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const isValidHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

  return (
    <div className="relative min-w-0">
      {label && (
        <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">
          {label}
        </label>
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-[#006e2f] text-sm w-full transition-colors"
      >
        <span
          className="w-6 h-6 rounded-md border border-gray-200 flex-shrink-0 relative overflow-hidden"
          style={{ background: displayColor }}
        >
          {isEmpty && (
            <span
              className="absolute inset-0"
              style={{
                background: "repeating-linear-gradient(45deg, #e5e7eb 0 4px, transparent 4px 8px)",
              }}
            />
          )}
        </span>
        <span className="flex-1 text-left font-mono text-xs text-[#191c1e]">
          {isEmpty ? "Auto / transparent" : current.toUpperCase()}
        </span>
        <span className="material-symbols-outlined text-[16px] text-gray-400">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && anchor && typeof window !== "undefined" && createPortal(
        <div
          ref={popRef}
          className="fixed z-[9999] bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 space-y-3"
          style={{ top: anchor.top, left: anchor.left, width: anchor.width, maxHeight: "min(500px, calc(100vh - 80px))", overflowY: "auto" }}
        >
          {/* Preset palette, grouped by hue */}
          <div className="space-y-2.5">
            {PRESET_COLORS.map((group) => (
              <div key={group.label}>
                <p className="text-[9px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">{group.label}</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {group.colors.map((c) => {
                    const active = current.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { onChange(c); setOpen(false); }}
                        className={`aspect-square rounded-lg border-2 hover:scale-110 transition-transform relative ${
                          active ? "border-[#006e2f] ring-2 ring-[#006e2f]/30" : "border-gray-200"
                        }`}
                        style={{ background: c }}
                        title={c}
                      >
                        {active && (
                          <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-white text-[14px]" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                            check
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom hex + native picker */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[9px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5">Couleur personnalisée</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isValidHex(current) ? current : "#006e2f"}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0"
                title="Sélecteur natif"
              />
              <input
                type="text"
                value={current}
                onChange={(e) => {
                  const v = e.target.value;
                  // only commit when valid or empty
                  if (v === "" || isValidHex(v)) onChange(v === "" ? null : v);
                  else onChange(v); // still display but value may be invalid
                }}
                placeholder="#RRGGBB"
                className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] text-[#191c1e]"
              />
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="px-3 py-2 text-xs font-semibold text-[#5c647a] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Réinitialiser (transparent)"
              >
                Effacer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Column layout picker ─────────────────────────────────────────────────────

interface ColumnProps {
  value: number;
  onChange: (cols: number) => void;
  options?: number[];
}

export function ColumnPicker({ value, onChange, options = [1, 2, 3, 4] }: ColumnProps) {
  return (
    <div className="min-w-0">
      <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1.5">
        Disposition en colonnes
      </label>
      <div className="flex gap-1.5">
        {options.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border-2 transition-all ${
                active ? "border-[#006e2f] bg-[#006e2f]/5" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              title={`${n} colonne${n > 1 ? "s" : ""}`}
            >
              <div className="flex gap-0.5 h-4 items-stretch">
                {Array.from({ length: n }).map((_, i) => (
                  <div key={i} className={`w-1.5 rounded-sm ${active ? "bg-[#006e2f]" : "bg-gray-300"}`} />
                ))}
              </div>
              <span className={`text-[10px] font-semibold ${active ? "text-[#006e2f]" : "text-gray-600"}`}>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
