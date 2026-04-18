"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

interface BundleItem {
  id: string;
  itemKind: "formation" | "digital";
  order: number;
  formation?: { id: string; title: string; price: number; thumbnail: string | null };
  product?: { id: string; title: string; price: number; banner: string | null };
}

interface Bundle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  priceXof: number;
  originalPriceXof: number | null;
  isActive: boolean;
  thumbnail: string | null;
  items: BundleItem[];
  _count?: { purchases: number };
  createdAt: string;
}

interface CatalogItem {
  id: string;
  title: string;
  price: number;
  kind: "formation" | "digital";
}

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export default function VendorBundlesPage() {
  const toast = useToastStore.getState().addToast;
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceXof, setPriceXof] = useState(50_000);
  const [selected, setSelected] = useState<{ kind: "formation" | "digital"; id: string }[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/vendeur/bundles");
      const j = await res.json();
      setBundles(Array.isArray(j.data) ? j.data : []);
    } catch {
      toast("error", "Impossible de charger vos bundles.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCatalog() {
    try {
      // /catalog renvoie un tableau plat { kind: "formation"|"product", id, title, price, status, ... }
      // On garde uniquement les produits ACTIFS (publiés et en ligne) pour les bundles.
      const res = await fetch("/api/formations/vendeur/catalog");
      const j = await res.json();
      const raw = Array.isArray(j?.data) ? (j.data as Array<{ kind: string; id: string; title: string; price: number; status?: string }>) : [];
      const items: CatalogItem[] = raw
        .filter((it) => it.status === "ACTIF") // publiés uniquement
        .map((it) => ({
          id: it.id,
          title: it.title,
          price: it.price,
          kind: it.kind === "formation" ? "formation" : "digital",
        }));
      setCatalog(items);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    load();
    loadCatalog();
    /* eslint-disable-next-line */
  }, []);

  function toggleItem(kind: "formation" | "digital", id: string) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.kind === kind && s.id === id);
      if (exists) return prev.filter((s) => !(s.kind === kind && s.id === id));
      return [...prev, { kind, id }];
    });
  }

  const originalPrice = selected.reduce((s, sel) => {
    const item = catalog.find((c) => c.id === sel.id && c.kind === sel.kind);
    return s + (item?.price ?? 0);
  }, 0);
  const savings = originalPrice > 0 ? originalPrice - priceXof : 0;
  const savingsPct = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast("warning", "Donnez un titre au bundle."); return; }
    if (selected.length < 2) { toast("warning", "Au moins 2 articles requis."); return; }
    if (priceXof >= originalPrice) { toast("warning", "Le prix du bundle doit être inférieur au total."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/formations/vendeur/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priceXof,
          items: selected.map((s) => ({ kind: s.kind, id: s.id })),
        }),
      });
      const j = await res.json();
      if (!res.ok) { toast("error", j.error || "Création impossible."); return; }
      toast("success", "Bundle créé ✓");
      setTitle(""); setDescription(""); setSelected([]);
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">
              Marketing
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Bundles produits
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Packagez plusieurs formations/produits à un prix réduit — panier moyen ↑.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add_circle"}</span>
            {showForm ? "Fermer" : "Nouveau bundle"}
          </button>
        </header>

        {showForm && (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Créer un bundle</h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Pack Débutant — Marketing Digital"
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Articles inclus ({selected.length})
              </label>
              {catalog.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    Aucun produit publié pour cette boutique
                  </p>
                  <p className="text-xs text-amber-800">
                    Pour créer un bundle, vous devez d&apos;abord avoir au moins{" "}
                    <span className="font-bold">2 produits ou formations publiés</span> (statut Actif). Les
                    brouillons ne sont pas inclus.
                  </p>
                  <a
                    href="/vendeur/produits/creer"
                    className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-bold hover:bg-amber-800"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Créer un produit
                  </a>
                </div>
              ) : catalog.length < 2 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    {catalog.length} produit publié — il en faut au moins 2 pour un bundle
                  </p>
                  <p className="text-xs text-amber-800">
                    Vous avez actuellement <span className="font-bold">{catalog.length} produit publié</span>.
                    Publiez au moins un autre produit (formation ou produit digital) pour pouvoir créer un bundle.
                  </p>
                  <a
                    href="/vendeur/produits/creer"
                    className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-bold hover:bg-amber-800"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Créer un autre produit
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50">
                  {catalog.map((c) => {
                    const isSel = !!selected.find((s) => s.kind === c.kind && s.id === c.id);
                    return (
                      <button
                        type="button"
                        key={`${c.kind}-${c.id}`}
                        onClick={() => toggleItem(c.kind, c.id)}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                          isSel ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{c.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {c.kind === "formation" ? "Formation" : "Produit"} · {fmtFCFA(c.price)}
                          </p>
                        </div>
                        <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${isSel ? "text-emerald-600" : "text-slate-300"}`} style={{ fontVariationSettings: isSel ? "'FILL' 1" : undefined }}>
                          {isSel ? "check_circle" : "radio_button_unchecked"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Prix individuel total</p>
                <p className="text-lg font-extrabold text-slate-900 line-through opacity-60 tabular-nums">
                  {fmtFCFA(originalPrice)}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Prix du bundle
                </label>
                <input
                  type="number" min={500}
                  value={priceXof}
                  onChange={(e) => setPriceXof(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-base font-bold text-emerald-700"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Économie</p>
                <p className="text-lg font-extrabold text-emerald-600 tabular-nums">
                  {fmtFCFA(savings)} <span className="text-xs">({savingsPct}%)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving || selected.length < 2}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                {saving ? "Création…" : "Créer le bundle"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
                Annuler
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : bundles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">category</span>
            <p className="text-base font-bold text-slate-700 mt-3">Aucun bundle pour le moment</p>
            <p className="text-sm text-slate-500 mt-1">
              Créez un bundle pour augmenter votre panier moyen en regroupant plusieurs produits.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{b.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {b.isActive ? "Actif" : "Masqué"}
                  </span>
                </div>
                {b.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{b.description}</p>
                )}
                <div className="space-y-1.5 mb-3">
                  {b.items.slice(0, 4).map((it) => (
                    <div key={it.id} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="material-symbols-outlined text-[14px] text-emerald-600">
                        {it.itemKind === "formation" ? "play_circle" : "download"}
                      </span>
                      <span className="truncate">{it.formation?.title ?? it.product?.title}</span>
                    </div>
                  ))}
                  {b.items.length > 4 && (
                    <p className="text-[11px] text-slate-400">+{b.items.length - 4} autres</p>
                  )}
                </div>
                <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                  <div>
                    {b.originalPriceXof && b.originalPriceXof > b.priceXof && (
                      <p className="text-xs text-slate-400 line-through">{fmtFCFA(b.originalPriceXof)}</p>
                    )}
                    <p className="text-lg font-extrabold text-emerald-700 tabular-nums">{fmtFCFA(b.priceXof)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ventes</p>
                    <p className="text-sm font-bold text-slate-900">{b._count?.purchases ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
