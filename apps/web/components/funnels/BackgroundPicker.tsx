"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MediaUpload } from "@/components/funnels/MediaUpload";

// ─── Types ────────────────────────────────────────────────────────────────────
// Values are stored as a CSS `background` string:
//   - "" / null → transparent / inherit
//   - "#RRGGBB" → solid color
//   - "linear-gradient(...)" → gradient
//   - "linear-gradient(rgba(0,0,0,x)...), url(...) center/cover no-repeat" → image (+ voile)

type Mode = "none" | "solid" | "gradient" | "image";

const PRESET_COLORS: string[] = [
  "#ffffff", "#f3f4f6", "#111827", "#ecfdf5", "#dbeafe", "#ede9fe", "#fef3c7", "#fee2e2",
  "#006e2f", "#22c55e", "#10b981", "#3b82f6", "#2563eb", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#ef4444", "#f97316", "#f59e0b", "#facc15", "#14b8a6", "#0ea5e9", "#64748b",
];

const GRADIENT_PRESETS: Array<{ label: string; value: string }> = [
  { label: "Vert marque", value: "linear-gradient(135deg, #006e2f, #22c55e)" },
  { label: "Menthe douce", value: "linear-gradient(135deg, #ecfdf5, #a7f3d0)" },
  { label: "Bleu profond", value: "linear-gradient(135deg, #1e3a8a, #3b82f6)" },
  { label: "Ciel", value: "linear-gradient(135deg, #dbeafe, #93c5fd)" },
  { label: "Violet nuit", value: "linear-gradient(135deg, #4c1d95, #8b5cf6)" },
  { label: "Lavande", value: "linear-gradient(135deg, #ede9fe, #c4b5fd)" },
  { label: "Coucher de soleil", value: "linear-gradient(135deg, #f97316, #ec4899)" },
  { label: "Pêche", value: "linear-gradient(135deg, #fed7aa, #fdba74)" },
  { label: "Rouge feu", value: "linear-gradient(135deg, #dc2626, #f97316)" },
  { label: "Doré premium", value: "linear-gradient(135deg, #f59e0b, #facc15)" },
  { label: "Noir élégant", value: "linear-gradient(135deg, #111827, #374151)" },
  { label: "Gris subtil", value: "linear-gradient(135deg, #f3f4f6, #ffffff)" },
];

const DIRECTIONS: Array<{ label: string; deg: number; arrow: string }> = [
  { label: "↗", deg: 45, arrow: "↗" },
  { label: "→", deg: 90, arrow: "→" },
  { label: "↘", deg: 135, arrow: "↘" },
  { label: "↓", deg: 180, arrow: "↓" },
  { label: "↙", deg: 225, arrow: "↙" },
  { label: "←", deg: 270, arrow: "←" },
  { label: "↖", deg: 315, arrow: "↖" },
  { label: "↑", deg: 0, arrow: "↑" },
];

interface Props {
  value: string | null | undefined;
  onChange: (bg: string | null) => void;
  label?: string;
  defaultSolid?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseMode(v: string | null | undefined): Mode {
  if (!v) return "none";
  if (v.includes("url(")) return "image"; // AVANT gradient : le voile contient aussi "gradient("
  if (v.includes("gradient(")) return "gradient";
  return "solid";
}

// Parse une valeur image → { url, overlay 0-100 }
function parseImage(v: string): { url: string; overlay: number } {
  const um = v.match(/url\(["']?([^"')]+)["']?\)/i);
  const om = v.match(/rgba\(0,\s*0,\s*0,\s*([0-9.]+)\)/i);
  return { url: um ? um[1] : "", overlay: om ? Math.round(parseFloat(om[1]) * 100) : 0 };
}

function makeImage(url: string, overlay: number): string {
  const a = Math.max(0, Math.min(85, overlay)) / 100;
  const veil = a > 0 ? `linear-gradient(rgba(0,0,0,${a}), rgba(0,0,0,${a})), ` : "";
  return `${veil}url("${url}") center/cover no-repeat`;
}

// Parse "linear-gradient(135deg, #aabbcc, #ddeeff)" → { deg, from, to }
function parseGradient(v: string): { deg: number; from: string; to: string } | null {
  const m = v.match(/linear-gradient\((-?\d+)deg,\s*([#a-f0-9]+),\s*([#a-f0-9]+)\)/i);
  if (!m) return null;
  return { deg: parseInt(m[1], 10), from: m[2], to: m[3] };
}

function makeGradient(deg: number, from: string, to: string): string {
  return `linear-gradient(${deg}deg, ${from}, ${to})`;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function BackgroundPicker({ value, onChange, label, defaultSolid = "#ffffff" }: Props) {
  const derivedMode = parseMode(value);
  // Onglet Image sélectionné mais aucune image encore uploadée → on force
  // l'affichage de l'onglet sans committer de valeur cassée.
  const [imageTab, setImageTab] = useState(false);
  const mode: Mode = imageTab && derivedMode !== "image" ? "image" : derivedMode;
  const parsedImg = derivedMode === "image" && value ? parseImage(value) : { url: "", overlay: 35 };
  const [imgOverlay, setImgOverlay] = useState(parsedImg.overlay);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Parsed gradient state (when in gradient mode) OR sensible defaults
  const parsed = value && mode === "gradient" ? parseGradient(value) : null;
  const [gradDeg, setGradDeg] = useState(parsed?.deg ?? 135);
  const [gradFrom, setGradFrom] = useState(parsed?.from ?? "#006e2f");
  const [gradTo, setGradTo] = useState(parsed?.to ?? "#22c55e");

  useEffect(() => {
    if (!open) return;
    function pos() {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({ top: r.bottom + 6, left: r.left, width: Math.max(360, r.width) });
    }
    pos();
    window.addEventListener("scroll", pos, true);
    window.addEventListener("resize", pos);
    return () => {
      window.removeEventListener("scroll", pos, true);
      window.removeEventListener("resize", pos);
    };
  }, [open]);

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

  const current = value ?? "";
  const isEmpty = !value;
  const displayLabel = isEmpty
    ? (imageTab ? "Image (à choisir)" : "Aucun / transparent")
    : mode === "image" ? "Image de fond"
    : mode === "gradient" ? "Dégradé"
    : current.toUpperCase();

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
          className="w-7 h-7 rounded-md border border-gray-200 flex-shrink-0 relative overflow-hidden"
          style={{ background: current || "transparent" }}
        >
          {isEmpty && (
            <span className="absolute inset-0" style={{ background: "repeating-linear-gradient(45deg, #e5e7eb 0 4px, transparent 4px 8px)" }} />
          )}
        </span>
        <span className="flex-1 text-left font-mono text-xs text-[#191c1e] truncate">{displayLabel}</span>
        <span className="material-symbols-outlined text-[16px] text-gray-400">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && anchor && typeof window !== "undefined" && createPortal(
        <div
          ref={popRef}
          className="fixed z-[9999] bg-white rounded-2xl border border-gray-200 shadow-2xl p-4"
          style={{ top: anchor.top, left: anchor.left, width: anchor.width, maxHeight: "min(560px, calc(100vh - 80px))", overflowY: "auto" }}
        >
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
            {(["none", "solid", "gradient", "image"] as Mode[]).map((m) => {
              const active = mode === m;
              const lbl = m === "none" ? "Aucun" : m === "solid" ? "Couleur" : m === "gradient" ? "Dégradé" : "Image";
              return (
                <button key={m} type="button" onClick={() => {
                  if (m === "image") { setImageTab(true); return; }
                  setImageTab(false);
                  if (m === "none") onChange(null);
                  else if (m === "solid") onChange(defaultSolid);
                  else onChange(makeGradient(gradDeg, gradFrom, gradTo));
                }} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${active ? "bg-white text-[#006e2f] shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"}`}>
                  {lbl}
                </button>
              );
            })}
          </div>

          {/* NONE mode */}
          {mode === "none" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-xl mb-3" style={{ background: "repeating-linear-gradient(45deg, #e5e7eb 0 8px, transparent 8px 16px)", border: "1px dashed #d1d5db" }} />
              <p className="text-sm font-semibold text-[#191c1e]">Fond transparent</p>
              <p className="text-xs text-[#5c647a] mt-1">Aucun arrière-plan appliqué</p>
            </div>
          )}

          {/* SOLID mode */}
          {mode === "solid" && (
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5">Couleurs prédéfinies</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {PRESET_COLORS.map((c) => {
                    const active = current.toLowerCase() === c.toLowerCase();
                    return (
                      <button key={c} type="button" onClick={() => onChange(c)}
                        className={`aspect-square rounded-lg border-2 hover:scale-110 transition-transform relative ${active ? "border-[#006e2f] ring-2 ring-[#006e2f]/30" : "border-gray-200"}`}
                        style={{ background: c }} title={c}>
                        {active && <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-white text-[14px]" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>check</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[9px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5">Couleur personnalisée</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={current.startsWith("#") ? current : "#ffffff"}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0" />
                  <input type="text" value={current} onChange={(e) => onChange(e.target.value)}
                    placeholder="#RRGGBB" className="flex-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] text-[#191c1e]" />
                </div>
              </div>
            </div>
          )}

          {/* GRADIENT mode */}
          {mode === "gradient" && (
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5">Dégradés prédéfinis</p>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((g) => {
                    const active = current === g.value;
                    return (
                      <button key={g.label} type="button"
                        onClick={() => {
                          const p = parseGradient(g.value)!;
                          setGradDeg(p.deg); setGradFrom(p.from); setGradTo(p.to);
                          onChange(g.value);
                        }}
                        className={`rounded-lg border-2 p-0.5 hover:scale-105 transition-transform ${active ? "border-[#006e2f] ring-2 ring-[#006e2f]/30" : "border-gray-200"}`}>
                        <div className="h-12 rounded-md" style={{ background: g.value }} />
                        <p className="text-[9px] font-semibold text-[#5c647a] mt-0.5 truncate">{g.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <p className="text-[9px] font-bold text-[#5c647a] uppercase tracking-wider">Personnaliser</p>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-semibold text-[#5c647a] w-14">De</label>
                  <input type="color" value={gradFrom}
                    onChange={(e) => { setGradFrom(e.target.value); onChange(makeGradient(gradDeg, e.target.value, gradTo)); }}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0" />
                  <input type="text" value={gradFrom}
                    onChange={(e) => { setGradFrom(e.target.value); onChange(makeGradient(gradDeg, e.target.value, gradTo)); }}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-[#006e2f] text-[#191c1e]" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-semibold text-[#5c647a] w-14">Vers</label>
                  <input type="color" value={gradTo}
                    onChange={(e) => { setGradTo(e.target.value); onChange(makeGradient(gradDeg, gradFrom, e.target.value)); }}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0" />
                  <input type="text" value={gradTo}
                    onChange={(e) => { setGradTo(e.target.value); onChange(makeGradient(gradDeg, gradFrom, e.target.value)); }}
                    className="flex-1 px-2 py-1.5 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-[#006e2f] text-[#191c1e]" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#5c647a] mb-1 block">Direction</label>
                  <div className="grid grid-cols-8 gap-1">
                    {DIRECTIONS.map((d) => {
                      const active = gradDeg === d.deg;
                      return (
                        <button key={d.deg} type="button"
                          onClick={() => { setGradDeg(d.deg); onChange(makeGradient(d.deg, gradFrom, gradTo)); }}
                          className={`aspect-square rounded-md text-base font-bold transition-all ${active ? "bg-[#006e2f] text-white" : "bg-gray-50 text-[#5c647a] hover:bg-gray-100"}`}
                          title={`${d.deg}°`}>
                          {d.arrow}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="h-16 rounded-lg border border-gray-200" style={{ background: makeGradient(gradDeg, gradFrom, gradTo) }} />
              </div>
            </div>
          )}

          {/* IMAGE mode : photo d'arrière-plan + voile sombre pour la lisibilité */}
          {mode === "image" && (
            <div className="space-y-3">
              <MediaUpload
                label="Image d'arrière-plan"
                value={parsedImg.url || null}
                onChange={(url) => {
                  if (url) onChange(makeImage(url, imgOverlay));
                  else { onChange(null); setImageTab(true); }
                }}
                accept="image"
                aspectRatio="auto"
              />
              {parsedImg.url && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug">Voile sombre (lisibilité du texte)</label>
                      <span className="text-[10px] font-bold text-[#191c1e] tabular-nums">{imgOverlay}%</span>
                    </div>
                    <input type="range" min={0} max={80} step={5} value={imgOverlay}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setImgOverlay(v);
                        onChange(makeImage(parsedImg.url, v));
                      }}
                      className="w-full accent-[#006e2f]" />
                    <p className="text-[10px] text-[#5c647a] mt-0.5">Assombrit la photo pour que le texte blanc reste lisible.</p>
                  </div>
                  <div className="h-20 rounded-lg border border-gray-200 flex items-center justify-center" style={{ background: makeImage(parsedImg.url, imgOverlay) }}>
                    <span className="text-white text-xs font-extrabold drop-shadow">Aperçu du texte</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
