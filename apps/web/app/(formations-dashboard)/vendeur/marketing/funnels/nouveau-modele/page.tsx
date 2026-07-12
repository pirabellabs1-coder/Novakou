"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  LayoutTemplate,
  GraduationCap,
  Magnet,
  Clapperboard,
  Presentation,
  BookOpen,
  Crown,
  Rocket,
  Repeat,
  Zap,
  Briefcase,
  Check,
  Loader2,
  ArrowRight,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { FUNNEL_BLUEPRINTS, type Ambiance, type FunnelBlueprint } from "@/lib/funnels/blueprints";
import { THEME_PRESETS, generatePalette } from "@/lib/funnels/theme-engine";

const BP_ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  magnet: Magnet,
  clapperboard: Clapperboard,
  presentation: Presentation,
  "book-open": BookOpen,
  crown: Crown,
  rocket: Rocket,
  repeat: Repeat,
  zap: Zap,
  briefcase: Briefcase,
};

type CatalogItem = { kind: "formation" | "product"; id: string; title: string; image: string | null; price: number; isFree: boolean; status: string };

export default function NouveauModelePage() {
  const router = useRouter();

  const [selectedKey, setSelectedKey] = useState<string>(FUNNEL_BLUEPRINTS[0].key);
  const [paletteKey, setPaletteKey] = useState<string>(FUNNEL_BLUEPRINTS[0].recommendedPalette);
  const [ambiance, setAmbiance] = useState<Ambiance>("clair");
  const [name, setName] = useState<string>("");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected: FunnelBlueprint = useMemo(
    () => FUNNEL_BLUEPRINTS.find((b) => b.key === selectedKey) ?? FUNNEL_BLUEPRINTS[0],
    [selectedKey],
  );
  const preset = useMemo(() => THEME_PRESETS.find((p) => p.key === paletteKey) ?? THEME_PRESETS[0], [paletteKey]);

  // Charge le catalogue (produit à lier, optionnel)
  useEffect(() => {
    fetch("/api/formations/vendeur/catalog")
      .then((r) => r.json())
      .then((j) => setCatalog(j.data ?? []))
      .catch(() => {});
  }, []);

  // Quand on change de modèle, on aligne la palette recommandée + un nom par défaut
  function pickBlueprint(b: FunnelBlueprint) {
    setSelectedKey(b.key);
    setPaletteKey(b.recommendedPalette);
    if (!name.trim()) setName(b.label);
  }

  function handleCatalogSelect(value: string) {
    if (!value) { setSelectedItem(null); return; }
    const [kind, id] = value.split(":");
    const item = catalog.find((c) => c.kind === kind && c.id === id) ?? null;
    setSelectedItem(item);
    if (item && !name.trim()) setName(`${selected.label} — ${item.title}`);
  }

  async function create() {
    const finalName = (name.trim() || selected.label).slice(0, 80);
    if (finalName.length < 3) { setError("Donnez un nom d'au moins 3 caractères."); return; }
    setCreating(true);
    setError(null);
    try {
      const pal = preset.palette;
      const dark = ambiance === "profond";
      const theme = {
        primaryColor: pal.primary,
        accentColor: pal.accent,
        textColor: dark ? "#F4F6F5" : pal.ink,
        bgColor: dark ? pal.night : "#FFFFFF",
        font: "Sora",
        palette: pal,
        ambiance,
      };
      // La route ai-create lit `title` pour le nom d'étape (et réordonne elle-même).
      const steps = selected.build(ambiance).map((s) => ({
        stepType: s.stepType,
        title: s.name,
        ...(s.headlineFr ? { headlineFr: s.headlineFr } : {}),
        blocks: s.blocks,
      }));
      const payload: Record<string, unknown> = {
        name: finalName,
        description: selected.description,
        theme,
        steps,
        ...(selectedItem?.kind === "formation" && { formationId: selectedItem.id }),
        ...(selectedItem?.kind === "product" && { productId: selectedItem.id }),
      };
      const res = await fetch("/api/formations/vendeur/funnels/ai-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur lors de la création du tunnel.");
      }
      const json = await res.json();
      router.push(`/vendeur/marketing/funnels/${json.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setCreating(false);
    }
  }

  const pal = preset.palette;

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Fil d'Ariane + titre */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[#5c647a] mb-2">
          <Link href="/vendeur/marketing/funnels" className="hover:text-[#006e2f] transition-colors">Funnels de vente</Link>
          <ChevronRight size={14} />
          <span className="text-[#191c1e] font-medium">Modèles de tunnels</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white shadow-lg">
            <LayoutTemplate size={26} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#191c1e]">Partez d&apos;un modèle de tunnel</h1>
            <p className="text-sm text-[#5c647a]">10 tunnels prêts à l&apos;emploi, harmonisés à votre couleur de marque. Tout se modifie ensuite.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── Galerie des modèles ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FUNNEL_BLUEPRINTS.map((b) => {
            const Icon = BP_ICONS[b.icon] ?? LayoutTemplate;
            const active = b.key === selectedKey;
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => pickBlueprint(b)}
                className={`text-left rounded-2xl bg-white overflow-hidden border transition-all ${active ? "border-[#006e2f] ring-2 ring-[#006e2f]/15 shadow-lg" : "border-gray-100 hover:border-gray-300 hover:shadow-md"}`}
              >
                <div className="relative h-24" style={{ background: b.preview }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={30} className="text-white/95 drop-shadow" />
                  </div>
                  {active && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
                      <Check size={14} className="text-[#006e2f]" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-extrabold text-[#191c1e] text-sm">{b.label}</h3>
                  <p className="text-[11px] font-semibold text-[#006e2f] mt-0.5">{b.tagline}</p>
                  <p className="text-[12.5px] text-[#5c647a] mt-2 leading-relaxed line-clamp-3">{b.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {b.stepLabels.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-[#5c647a] border border-gray-200">
                        {i > 0 && <ArrowRight size={9} className="opacity-50" />}{s}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Panneau de configuration (sticky) ── */}
        <div className="lg:sticky lg:top-6 space-y-4">
          {/* Aperçu palette */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-2">Aperçu</p>
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <div className="p-4 text-center" style={{ background: ambiance === "profond" ? `linear-gradient(135deg, ${pal.deep}, ${pal.night})` : `linear-gradient(135deg, ${pal.deep}, ${pal.night})` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: pal.accent }}>{selected.tagline.split(" → ")[0]}</p>
                <p className="text-sm font-extrabold text-white mt-1 leading-snug">{selected.label}</p>
                <span className="inline-block mt-2 px-3 py-1.5 rounded-lg text-[11px] font-bold" style={{ background: pal.primary, color: pal.textOnPrimary }}>Bouton d&apos;action</span>
              </div>
              <div className="p-3" style={{ background: ambiance === "profond" ? pal.night : "#fff" }}>
                <div className="h-1.5 rounded-full w-3/4" style={{ background: pal.primary, opacity: 0.9 }} />
                <div className="h-1.5 rounded-full w-1/2 mt-1.5" style={{ background: ambiance === "profond" ? "rgba(255,255,255,.25)" : pal.line }} />
              </div>
            </div>
          </div>

          {/* Palette */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-2">Palette de marque</p>
            <div className="grid grid-cols-4 gap-1.5">
              {THEME_PRESETS.map((p) => {
                const on = p.key === paletteKey;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPaletteKey(p.key)}
                    title={p.label}
                    className={`relative h-10 rounded-lg overflow-hidden border transition-all ${on ? "border-[#191c1e] ring-2 ring-[#191c1e]/15" : "border-black/10 hover:border-black/25"}`}
                    style={{ background: `linear-gradient(135deg, ${p.palette.primary}, ${p.palette.accent})` }}
                  >
                    {on && <span className="absolute inset-0 flex items-center justify-center"><Check size={14} className="text-white drop-shadow" strokeWidth={3} /></span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#8a968e] mt-2">{preset.label} — contraste AA vérifié.</p>
          </div>

          {/* Ambiance */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-2">Ambiance</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([["clair", "Clair", Sun], ["profond", "Profond", Moon]] as const).map(([val, lbl, Ic]) => {
                const on = ambiance === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmbiance(val)}
                    className={`h-10 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${on ? "border-[#191c1e] bg-[#191c1e] text-white" : "border-gray-200 bg-white text-[#5c647a] hover:border-gray-300"}`}
                  >
                    <Ic size={14} />{lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nom + produit */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5">Nom du tunnel</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={selected.label}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5">Produit à vendre (optionnel)</label>
              <select
                onChange={(e) => handleCatalogSelect(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#006e2f]"
                defaultValue=""
              >
                <option value="">— Lier plus tard —</option>
                {catalog.map((c) => (
                  <option key={`${c.kind}:${c.id}`} value={`${c.kind}:${c.id}`}>
                    {c.title} {c.isFree ? "(gratuit)" : `— ${new Intl.NumberFormat("fr-FR").format(c.price)} FCFA`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-[#b4552f] bg-[#b4552f]/10 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={create}
            disabled={creating}
            className="w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#006e2f] to-[#22c55e] hover:opacity-90 hover:scale-[1.01] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {creating ? <><Loader2 size={18} className="animate-spin" /> Création…</> : <>Créer ce tunnel <ArrowRight size={18} /></>}
          </button>
          <p className="text-center text-[11px] text-[#8a968e]">Le tunnel s&apos;ouvre ensuite dans l&apos;éditeur — tout se personnalise.</p>
        </div>
      </div>
    </div>
  );
}
