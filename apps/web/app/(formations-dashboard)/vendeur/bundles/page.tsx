"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  X,
  PlayCircle,
  Download,
  ExternalLink,
  Pencil,
  Pause,
  Play,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { RichTextEditor } from "@/components/formations/RichTextEditor";
import {
  KazaHero,
  KazaCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceXof, setPriceXof] = useState(50_000);
  const [selected, setSelected] = useState<{ kind: "formation" | "digital"; id: string }[]>([]);
  const [thumbnail, setThumbnail] = useState("");
  const [banner, setBanner] = useState("");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setTitle(""); setDescription(""); setPriceXof(50_000);
    setSelected([]); setThumbnail(""); setBanner("");
  }

  function openEdit(b: Bundle) {
    setEditingId(b.id);
    setTitle(b.title);
    setDescription(b.description ?? "");
    setPriceXof(b.priceXof);
    setThumbnail(b.thumbnail ?? "");
    setBanner((b as Bundle & { banner?: string | null }).banner ?? "");
    setSelected(
      b.items
        .map((it) => {
          if (it.itemKind === "formation" && it.formation?.id) return { kind: "formation" as const, id: it.formation.id };
          if (it.itemKind === "digital" && it.product?.id) return { kind: "digital" as const, id: it.product.id };
          return null;
        })
        .filter((x): x is { kind: "formation" | "digital"; id: string } => !!x),
    );
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      const res = await fetch("/api/formations/vendeur/catalog");
      const j = await res.json();
      const raw = Array.isArray(j?.data) ? (j.data as Array<{ kind: string; id: string; title: string; price: number; status?: string }>) : [];
      const items: CatalogItem[] = raw
        .filter((it) => it.status === "ACTIF")
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

  async function togglePause(b: Bundle) {
    const next = !b.isActive;
    setBundles((prev) => prev.map((x) => (x.id === b.id ? { ...x, isActive: next } : x)));
    try {
      const res = await fetch(`/api/formations/vendeur/bundles/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next ? "ACTIF" : "BROUILLON" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast("error", j.error || "Impossible de changer le statut");
        setBundles((prev) => prev.map((x) => (x.id === b.id ? { ...x, isActive: b.isActive } : x)));
        return;
      }
      toast("success", next ? "Bundle réactivé" : "Bundle mis en pause");
    } catch {
      setBundles((prev) => prev.map((x) => (x.id === b.id ? { ...x, isActive: b.isActive } : x)));
      toast("error", "Erreur réseau");
    }
  }

  async function deleteBundle(b: Bundle) {
    const ok = await confirmAction({
      title: `Supprimer le bundle "${b.title}" ?`,
      message: (b._count?.purchases ?? 0) > 0
        ? `Ce bundle a ${b._count?.purchases} achat(s) — il sera archivé (les acheteurs gardent leur accès) au lieu d'être supprimé définitivement.`
        : "Cette action est irréversible.",
      confirmLabel: "Supprimer",
      confirmVariant: "danger",
      icon: "delete_forever",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/formations/vendeur/bundles/${b.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast("error", j.error || "Suppression impossible");
        return;
      }
      const j = await res.json();
      toast("success", j.data?.archived ? "Bundle archivé" : "Bundle supprimé");
      load();
    } catch {
      toast("error", "Erreur réseau");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast("warning", "Donnez un titre au bundle."); return; }
    if (selected.length < 2) { toast("warning", "Au moins 2 articles requis."); return; }
    if (priceXof >= originalPrice) { toast("warning", "Le prix du bundle doit être inférieur au total."); return; }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/formations/vendeur/bundles/${editingId}`
        : "/api/formations/vendeur/bundles";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priceXof,
          thumbnail: thumbnail || null,
          banner: banner || null,
          items: selected.map((s) => ({ kind: s.kind, id: s.id })),
        }),
      });
      const j = await res.json();
      if (!res.ok) { toast("error", j.error || (editingId ? "Modification impossible." : "Création impossible.")); return; }
      toast("success", editingId ? "Bundle mis à jour" : "Bundle créé");
      resetForm();
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto space-y-8">
        <KazaHero
          badge="Pro"
          badgeColor="orange"
          icon={Package}
          title="Bundles produits"
          subtitle="Packagez plusieurs formations/produits à un prix réduit — augmentez votre panier moyen."
          actions={
            <KazaButton
              variant="primary"
              icon={showForm ? X : Plus}
              onClick={() => {
                if (showForm) resetForm();
                setShowForm((v) => !v);
              }}
            >
              {showForm ? "Fermer" : "Nouveau bundle"}
            </KazaButton>
          }
        />

        {showForm && (
          <KazaCard title={editingId ? "Modifier le bundle" : "Créer un bundle"}>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Pack Débutant — Marketing Digital"
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description
                  <span className="ml-2 font-normal text-slate-500">(le bouton IA améliore le texte)</span>
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Présentez la valeur du pack — pourquoi c'est intéressant d'acheter le tout ensemble plutôt que séparément."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vignette (carte marketplace)</label>
                  <ImageUploader
                    value={thumbnail}
                    onChange={setThumbnail}
                    aspectClass="aspect-square"
                    helper="600×600 carré · JPG/PNG · Max 5 MB"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bannière de couverture</label>
                  <ImageUploader
                    value={banner}
                    onChange={setBanner}
                    aspectClass="aspect-video"
                    helper="1280×720 (16:9) · JPG/PNG · Max 5 MB"
                  />
                </div>
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
                    <KazaButton variant="primary" size="sm" icon={Plus} href="/vendeur/produits/creer">
                      Créer un produit
                    </KazaButton>
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
                    <KazaButton variant="primary" size="sm" icon={Plus} href="/vendeur/produits/creer">
                      Créer un autre produit
                    </KazaButton>
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
                          {isSel ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                          )}
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
                    className="w-full px-3 py-2 rounded-lg border-2 border-slate-200 text-base font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
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
                <KazaButton variant="primary" type="submit" disabled={saving || selected.length < 2}>
                  {saving
                    ? (editingId ? "Mise à jour…" : "Création…")
                    : (editingId ? "Mettre à jour" : "Créer le bundle")}
                </KazaButton>
                <KazaButton variant="ghost" type="button" onClick={() => { resetForm(); setShowForm(false); }}>
                  Annuler
                </KazaButton>
              </div>
            </form>
          </KazaCard>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : bundles.length === 0 ? (
          <KazaEmpty
            icon={Package}
            title="Aucun bundle pour le moment"
            description="Créez un bundle pour augmenter votre panier moyen en regroupant plusieurs produits."
            action={!showForm ? { label: "Créer un bundle", onClick: () => setShowForm(true) } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{b.title}</h3>
                  <KazaBadge variant={b.isActive ? "green" : "slate"}>
                    {b.isActive ? "Actif" : "Masqué"}
                  </KazaBadge>
                </div>
                {b.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{b.description}</p>
                )}
                <div className="space-y-1.5 mb-3">
                  {b.items.slice(0, 4).map((it) => {
                    const Icon = it.itemKind === "formation" ? PlayCircle : Download;
                    return (
                      <div key={it.id} className="flex items-center gap-2 text-xs text-slate-700">
                        <Icon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{it.formation?.title ?? it.product?.title}</span>
                      </div>
                    );
                  })}
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

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <Link
                    href={`/bundle/${b.slug}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                    aria-label="Voir publique"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePause(b)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      b.isActive
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {b.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {b.isActive ? "Pause" : "Reprendre"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBundle(b)}
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
