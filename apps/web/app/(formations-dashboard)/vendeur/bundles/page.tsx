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
  StPageHeader,
  StCard,
  StButton,
  StChip,
  ST,
} from "@/components/stitch";

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto space-y-6">
        <StPageHeader
          title="Bundles produits"
          subtitle="Packagez plusieurs formations/produits à un prix réduit — augmentez votre panier moyen."
          actions={
            <StButton
              icon={showForm ? X : Plus}
              onClick={() => {
                if (showForm) resetForm();
                setShowForm((v) => !v);
              }}
            >
              {showForm ? "Fermer" : "Nouveau bundle"}
            </StButton>
          }
        />

        {showForm && (
          <StCard>
            <h3 className="text-[15px] font-extrabold mb-4" style={{ color: ST.text }}>
              {editingId ? "Modifier le bundle" : "Créer un bundle"}
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Titre</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Pack Débutant — Marketing Digital"
                  maxLength={80}
                  className="w-full px-[14px] py-[11px] rounded-[12px] text-[13.5px] font-semibold focus:outline-none transition-all"
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                  Description
                  <span className="ml-2 font-semibold" style={{ color: ST.textMuted }}>(le bouton IA améliore le texte)</span>
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Présentez la valeur du pack — pourquoi c'est intéressant d'acheter le tout ensemble plutôt que séparément."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Vignette (carte marketplace)</label>
                  <ImageUploader
                    value={thumbnail}
                    onChange={setThumbnail}
                    aspectClass="aspect-square"
                    helper="600×600 carré · JPG/PNG · Max 5 MB"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Bannière de couverture</label>
                  <ImageUploader
                    value={banner}
                    onChange={setBanner}
                    aspectClass="aspect-video"
                    helper="1280×720 (16:9) · JPG/PNG · Max 5 MB"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-extrabold mb-2" style={{ color: ST.textLabel }}>
                  Articles inclus ({selected.length})
                </label>
                {catalog.length === 0 ? (
                  <div className="p-4 rounded-xl space-y-2" style={{ background: ST.amberSoft, border: "1px solid #f3e2bd" }}>
                    <p className="text-xs font-extrabold" style={{ color: "#633806" }}>
                      Aucun produit publié pour cette boutique
                    </p>
                    <p className="text-xs font-semibold" style={{ color: ST.amberText }}>
                      Pour créer un bundle, vous devez d&apos;abord avoir au moins{" "}
                      <span className="font-extrabold">2 produits ou formations publiés</span> (statut Actif). Les
                      brouillons ne sont pas inclus.
                    </p>
                    <StButton size="sm" icon={Plus} href="/vendeur/produits/creer">
                      Créer un produit
                    </StButton>
                  </div>
                ) : catalog.length < 2 ? (
                  <div className="p-4 rounded-xl space-y-2" style={{ background: ST.amberSoft, border: "1px solid #f3e2bd" }}>
                    <p className="text-xs font-extrabold" style={{ color: "#633806" }}>
                      {catalog.length} produit publié — il en faut au moins 2 pour un bundle
                    </p>
                    <p className="text-xs font-semibold" style={{ color: ST.amberText }}>
                      Vous avez actuellement <span className="font-extrabold">{catalog.length} produit publié</span>.
                      Publiez au moins un autre produit (formation ou produit digital) pour pouvoir créer un bundle.
                    </p>
                    <StButton size="sm" icon={Plus} href="/vendeur/produits/creer">
                      Créer un autre produit
                    </StButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto rounded-xl p-3" style={{ border: `1px solid ${ST.cardBorder}`, background: "#fbfdfc" }}>
                    {catalog.map((c) => {
                      const isSel = !!selected.find((s) => s.kind === c.kind && s.id === c.id);
                      return (
                        <button
                          type="button"
                          key={`${c.kind}-${c.id}`}
                          onClick={() => toggleItem(c.kind, c.id)}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                          style={
                            isSel
                              ? { background: ST.greenSoft, border: `1px solid #d7ecde` }
                              : { background: "#fff", border: `1px solid ${ST.cardBorder}` }
                          }
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold truncate" style={{ color: ST.text }}>{c.title}</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: ST.textMuted }}>
                              {c.kind === "formation" ? "Formation" : "Produit"} · {fmtFCFA(c.price)}
                            </p>
                          </div>
                          {isSel ? (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: ST.green }} />
                          ) : (
                            <Circle className="w-5 h-5 flex-shrink-0" style={{ color: "#cdd9d2" }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl p-4" style={{ background: "#fbfdfc", border: `1px solid ${ST.cardBorder}` }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ST.textMuted }}>Prix individuel total</p>
                  <p className="text-lg font-extrabold line-through opacity-60 tabular-nums" style={{ color: ST.text }}>
                    {fmtFCFA(originalPrice)}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: ST.textMuted }}>
                    Prix du bundle
                  </label>
                  <input
                    type="number" min={500}
                    value={priceXof}
                    onChange={(e) => setPriceXof(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-base font-extrabold focus:outline-none"
                    style={{ color: ST.green, border: "1px solid #dde6e0" }}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ST.textMuted }}>Économie</p>
                  <p className="text-lg font-extrabold tabular-nums" style={{ color: ST.green }}>
                    {fmtFCFA(savings)} <span className="text-xs">({savingsPct}%)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${ST.divider}` }}>
                <StButton type="submit" disabled={saving || selected.length < 2}>
                  {saving
                    ? (editingId ? "Mise à jour…" : "Création…")
                    : (editingId ? "Mettre à jour" : "Créer le bundle")}
                </StButton>
                <StButton variant="secondary" type="button" onClick={() => { resetForm(); setShowForm(false); }}>
                  Annuler
                </StButton>
              </div>
            </form>
          </StCard>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "#f3f6f4" }} />)}
          </div>
        ) : bundles.length === 0 ? (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <Package size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>
              Aucun bundle pour le moment
            </h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Créez un bundle pour augmenter votre panier moyen en regroupant plusieurs produits.
            </p>
            {!showForm && (
              <StButton icon={Plus} onClick={() => setShowForm(true)}>Créer un bundle</StButton>
            )}
          </StCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles.map((b) => (
              <StCard key={b.id} className="hover:-translate-y-0.5 transition-transform">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h3 className="text-base font-extrabold leading-snug line-clamp-2" style={{ color: ST.text }}>{b.title}</h3>
                  <StChip tone={b.isActive ? "green" : "neutral"}>
                    {b.isActive ? "Actif" : "Masqué"}
                  </StChip>
                </div>
                {b.description && (
                  <p className="text-xs line-clamp-2 mb-3 font-semibold" style={{ color: ST.textSecondary }}>{b.description}</p>
                )}
                <div className="space-y-1.5 mb-3">
                  {b.items.slice(0, 4).map((it) => {
                    const Icon = it.itemKind === "formation" ? PlayCircle : Download;
                    return (
                      <div key={it.id} className="flex items-center gap-2 text-xs font-semibold" style={{ color: ST.textLabel }}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ST.green }} />
                        <span className="truncate">{it.formation?.title ?? it.product?.title}</span>
                      </div>
                    );
                  })}
                  {b.items.length > 4 && (
                    <p className="text-[11px] font-semibold" style={{ color: ST.textMuted }}>+{b.items.length - 4} autres</p>
                  )}
                </div>
                <div className="flex items-end justify-between pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  <div>
                    {b.originalPriceXof && b.originalPriceXof > b.priceXof && (
                      <p className="text-xs line-through font-semibold" style={{ color: ST.textMuted }}>{fmtFCFA(b.originalPriceXof)}</p>
                    )}
                    <p className="text-lg font-extrabold tabular-nums" style={{ color: ST.green }}>{fmtFCFA(b.priceXof)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: ST.textMuted }}>Ventes</p>
                    <p className="text-sm font-extrabold" style={{ color: ST.text }}>{b._count?.purchases ?? 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  <Link
                    href={`/bundle/${b.slug}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-extrabold transition-colors"
                    style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
                    aria-label="Voir publique"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-colors"
                    style={{ background: ST.greenSoft, color: ST.green }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePause(b)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-colors"
                    style={
                      b.isActive
                        ? { background: ST.amberSoft, color: ST.amberText }
                        : { background: ST.greenSoft, color: ST.green }
                    }
                  >
                    {b.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {b.isActive ? "Pause" : "Reprendre"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBundle(b)}
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-extrabold transition-colors"
                    style={{ background: ST.roseSoft, color: ST.roseText }}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </StCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
