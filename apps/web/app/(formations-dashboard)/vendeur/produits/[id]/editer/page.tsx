"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RichTextEditor } from "@/components/formations/RichTextEditor";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { FileUploader } from "@/components/formations/FileUploader";
import { confirmAction } from "@/store/confirm";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionFormat: string;
  productType: string;
  banner: string | null;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  viewsCount: number;
  tags: string[];
  status: string;
  fileUrl: string | null;
  downloadable: boolean;
  hiddenFromMarketplace: boolean;
  category: { id: string; slug: string; name: string } | null;
}

const PRODUCT_TYPES = [
  { value: "EBOOK", label: "E-book" },
  { value: "PDF", label: "PDF / Guide" },
  { value: "TEMPLATE", label: "Template" },
  { value: "AUDIO", label: "Audio" },
  { value: "VIDEO", label: "Vidéo" },
  { value: "BUNDLE", label: "Bundle / Pack" },
  { value: "OTHER", label: "Autre" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ACTIF: { label: "Publié", cls: "bg-green-100 text-green-700" },
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700" },
  EN_ATTENTE: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  ARCHIVE: { label: "Archivé", cls: "bg-zinc-100 text-zinc-500" },
  REFUSE: { label: "Refusé", cls: "bg-red-100 text-red-700" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export default function EditerProduitPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("EBOOK");
  const [banner, setBanner] = useState("");
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [hiddenFromMarketplace, setHiddenFromMarketplace] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const { data: response, isLoading, error } = useQuery<{ data: Product; error?: string }>({
    queryKey: ["product", id],
    queryFn: () => fetch(`/api/formations/vendeur/products/${id}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  const product = response?.data;

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setDescription(product.description ?? "");
      setProductType(product.productType);
      setBanner(product.banner ?? "");
      setPrice(product.price);
      setOriginalPrice(product.originalPrice != null ? String(product.originalPrice) : "");
      setTagsInput((product.tags ?? []).join(", "));
      setFileUrl(product.fileUrl ?? "");
      setHiddenFromMarketplace(!!product.hiddenFromMarketplace);
      setDirty(false);
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/formations/vendeur/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", id] });
      setDirty(false);
      setSavedAt(new Date());
    },
  });

  const publishMutation = useMutation({
    mutationFn: (newStatus: "ACTIF" | "BROUILLON") =>
      fetch(`/api/formations/vendeur/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["product", id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/formations/vendeur/products/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => router.push("/vendeur/produits"),
  });

  function track<T>(setter: (v: T) => void, v: T) {
    setter(v);
    setDirty(true);
  }

  function handleSave() {
    saveMutation.mutate({
      title,
      description,
      productType,
      banner,
      price,
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      fileUrl,
      hiddenFromMarketplace,
    });
  }

  async function handleDelete() {
    const ok = await confirmAction({
      title: `Supprimer définitivement "${product?.title}" ?`,
      message: "Cette action est irréversible. Tous les contenus, inscriptions et stats associés seront perdus.",
      confirmLabel: "Supprimer définitivement",
      confirmVariant: "danger",
      icon: "delete_forever",
    });
    if (!ok) return;
    deleteMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-8">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-zinc-200 rounded" />
          <div className="h-12 w-2/3 bg-zinc-200 rounded-xl" />
          <div className="h-64 bg-zinc-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-gray-300 text-5xl">shopping_bag</span>
          <p className="text-lg font-bold text-[#191c1e] mt-3">Produit introuvable</p>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Ce produit n&apos;existe pas ou ne vous appartient pas.
          </p>
          <Link href="/vendeur/produits" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Retour aux produits
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_BADGE[product.status] ?? STATUS_BADGE.BROUILLON;
  const isPublished = product.status === "ACTIF";

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 flex items-center gap-3">
          <Link href="/vendeur/produits" className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#5c647a] truncate">Édition produit · {product.slug}</p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${status.cls}`}>{status.label}</span>
          <div className="flex items-center gap-2 text-xs text-[#5c647a]">
            {saveMutation.isPending ? (
              <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>Sauvegarde…</>
            ) : savedAt ? (
              <><span className="material-symbols-outlined text-[14px] text-green-500">check_circle</span>Sauvegardé</>
            ) : null}
          </div>
          <a href={`/produit/${product.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>Aperçu
          </a>
          <button
            onClick={handleSave}
            disabled={!dirty || saveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            Enregistrer
          </button>
          <button
            onClick={() => publishMutation.mutate(isPublished ? "BROUILLON" : "ACTIF")}
            disabled={publishMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              isPublished ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-zinc-900 text-white hover:bg-zinc-700"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{isPublished ? "pause" : "publish"}</span>
            {isPublished ? "Dépublier" : "Publier"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 space-y-6">

        {/* Stats card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Ventes", value: product.salesCount, icon: "shopping_bag", color: "#006e2f" },
            { label: "Vues", value: product.viewsCount, icon: "visibility", color: "#2563eb" },
            { label: "Note moyenne", value: product.rating > 0 ? product.rating.toFixed(1) : "—", icon: "star", color: "#f59e0b" },
            { label: "Avis", value: product.reviewsCount, icon: "reviews", color: "#8b5cf6" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]" style={{ color: s.color }}>{s.icon}</span>
                <p className="text-[10px] font-bold uppercase text-[#5c647a] tracking-wider">{s.label}</p>
              </div>
              <p className="text-xl font-extrabold text-[#191c1e] mt-1">{typeof s.value === "number" ? fmt(s.value) : s.value}</p>
            </div>
          ))}
        </div>

        {/* Section: Image principale */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-extrabold text-[#191c1e] mb-1">Image de couverture</h2>
          <p className="text-xs text-[#5c647a] mb-4">L&apos;image principale visible sur la marketplace et la page produit.</p>
          <ImageUploader
            value={banner}
            onChange={(url) => track(setBanner, url)}
            aspectClass="aspect-video"
          />
        </div>

        {/* Section: Infos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-base font-extrabold text-[#191c1e]">Informations principales</h2>

          <div>
            <label className="block text-xs font-semibold text-[#5c647a] uppercase tracking-wider mb-1.5">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => track(setTitle, e.target.value)}
              className="w-full text-base text-[#191c1e] bg-white px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
              placeholder="Titre de votre produit"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5c647a] uppercase tracking-wider mb-1.5">Type de produit</label>
            <select
              value={productType}
              onChange={(e) => track(setProductType, e.target.value)}
              className="w-full text-sm text-[#191c1e] bg-white px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5c647a] uppercase tracking-wider mb-1.5">Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => track(setTagsInput, e.target.value)}
              className="w-full text-sm text-[#191c1e] bg-white px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
              placeholder="ex: marketing, automation, productivité"
            />
          </div>
        </div>

        {/* Section: Prix */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-base font-extrabold text-[#191c1e]">Prix</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5c647a] uppercase tracking-wider mb-1.5">Prix de vente (FCFA)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => track(setPrice, Number(e.target.value))}
                className="w-full text-base font-bold text-[#006e2f] bg-white px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5c647a] uppercase tracking-wider mb-1.5">Prix barré (optionnel)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => track(setOriginalPrice, e.target.value)}
                className="w-full text-base text-[#5c647a] bg-white px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
                min={0}
                placeholder="Pour afficher une remise"
              />
            </div>
          </div>
          {price === 0 && <p className="text-xs text-amber-600">⚠️ Prix à 0 FCFA = produit gratuit</p>}
        </div>

        {/* Section: Description */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-extrabold text-[#191c1e] mb-1">Description détaillée</h2>
          <p className="text-xs text-[#5c647a] mb-4">Ce que les acheteurs verront sur la page produit. Soyez clair et convaincant.</p>
          <RichTextEditor value={description} onChange={(v) => track(setDescription, v)} placeholder="Décrivez votre produit en détail…" />
        </div>

        {/* Section: Fichier livré */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-extrabold text-[#191c1e] mb-1">Fichier à livrer</h2>
          <p className="text-xs text-[#5c647a] mb-4">Le fichier que les acheteurs téléchargeront après leur paiement.</p>
          <FileUploader value={fileUrl} onChange={(url) => track(setFileUrl, url)} />
        </div>

        {/* Section: Visibilité marketplace */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-extrabold text-[#191c1e] mb-1">Visibilité</h2>
          <p className="text-xs text-[#5c647a] mb-4">
            Choisissez où ce produit apparaît. Vos boutiques personnalisées l&apos;affichent toujours.
          </p>
          <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#006e2f]/30 cursor-pointer">
            <div>
              <p className="text-sm font-bold text-[#191c1e]">Cacher du marketplace public</p>
              <p className="text-xs text-[#5c647a] mt-0.5">
                Quand activé, ce produit est invisible sur <code>/explorer</code> et la home Novakou. Il
                reste vendable depuis votre/vos boutique(s) seulement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => track(setHiddenFromMarketplace, !hiddenFromMarketplace)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                hiddenFromMarketplace ? "bg-[#006e2f]" : "bg-gray-200"
              }`}
              aria-pressed={hiddenFromMarketplace}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  hiddenFromMarketplace ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border-2 border-red-100 p-6">
          <h2 className="text-base font-extrabold text-red-600 mb-1">Zone dangereuse</h2>
          <p className="text-xs text-[#5c647a] mb-4">La suppression est définitive et irréversible.</p>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Supprimer ce produit
          </button>
        </div>

        {/* Save bar at bottom */}
        {dirty && (
          <div className="sticky bottom-4 mx-auto max-w-md">
            <div className="bg-zinc-900 text-white rounded-full px-5 py-3 shadow-2xl flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">Modifications non enregistrées</span>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-4 py-1.5 rounded-full bg-[#22c55e] text-zinc-900 text-xs font-extrabold hover:bg-[#16a34a] hover:text-white transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
