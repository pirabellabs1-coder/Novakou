"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RichTextEditor } from "@/components/formations/RichTextEditor";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { MultiFileUploader, type ProductFile } from "@/components/formations/MultiFileUploader";
import { confirmAction } from "@/store/confirm";
import {
  useDraftField,
  useDraftSavedAt,
  formatSavedAt,
  clearDrafts,
  hasStoredDraft,
} from "@/lib/hooks/use-draft-storage";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionFormat: string;
  productType: string;
  thumbnail: string | null;
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
  files: ProductFile[];
  downloadable: boolean;
  hiddenFromMarketplace: boolean;
  previewEnabled?: boolean;
  previewPages?: number;
  watermarkEnabled?: boolean;
  // Limites de vente — nullables = pas de limite (rétro-compat avec produits existants)
  maxBuyers?: number | null;
  currentBuyers?: number;
  salesEndAt?: string | null; // ISO datetime
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

  // Auto-save scope: per-product. Each product edit has its own draft slot
  // so editing two tabs in parallel never bleeds state across them.
  const draftPrefix = `vendeur:product:edit:${id}`;

  const [title, setTitle] = useDraftField(`${draftPrefix}:title`, "");
  const [description, setDescription] = useDraftField(`${draftPrefix}:description`, "");
  const [productType, setProductType] = useDraftField(`${draftPrefix}:productType`, "EBOOK");
  const [thumbnail, setThumbnail] = useDraftField(`${draftPrefix}:thumbnail`, "");
  const [banner, setBanner] = useDraftField(`${draftPrefix}:banner`, "");
  const [price, setPrice] = useDraftField(`${draftPrefix}:price`, 0);
  const [originalPrice, setOriginalPrice] = useDraftField<string>(`${draftPrefix}:originalPrice`, "");
  const [tagsInput, setTagsInput] = useDraftField(`${draftPrefix}:tagsInput`, "");
  const [files, setFiles] = useDraftField<ProductFile[]>(`${draftPrefix}:files`, []);
  const [hiddenFromMarketplace, setHiddenFromMarketplace] = useDraftField(`${draftPrefix}:hiddenFromMarketplace`, false);
  const [previewEnabled, setPreviewEnabled] = useDraftField(`${draftPrefix}:previewEnabled`, false);
  const [previewPages, setPreviewPages] = useDraftField(`${draftPrefix}:previewPages`, 5);
  const [watermarkEnabled, setWatermarkEnabled] = useDraftField(`${draftPrefix}:watermarkEnabled`, true);
  // Limites de vente. Tous nullable / vides côté UI → pas de limite.
  // maxBuyers vide = vente illimitée. salesEndAt vide = pas d'échéance.
  // currentBuyers est rendu éditable pour permettre au vendeur de réinitialiser
  // ou ajuster manuellement le compteur (ex: après un litige / refund).
  const [maxBuyersInput, setMaxBuyersInput] = useDraftField<string>(`${draftPrefix}:maxBuyers`, "");
  const [currentBuyersInput, setCurrentBuyersInput] = useDraftField<string>(`${draftPrefix}:currentBuyers`, "");
  const [salesEndAtInput, setSalesEndAtInput] = useDraftField<string>(`${draftPrefix}:salesEndAt`, "");
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  // Tracks whether we've already pulled the API value into state on first
  // load — this is what lets drafts win over fresh refetches.
  const [hasHydrated, setHasHydrated] = useState(false);
  const draftSavedAtTs = useDraftSavedAt(draftPrefix);
  const draftLabel = formatSavedAt(draftSavedAtTs);

  const { data: response, isLoading, error } = useQuery<{ data: Product; error?: string }>({
    queryKey: ["product", id],
    queryFn: async () => {
      const r = await fetch(`/api/formations/vendeur/products/${id}`);
      // Si le serveur renvoie HTML (502 cold start, etc.), .json() throw.
      // On veut que react-query traite ca comme une erreur, pas comme {data: undefined}.
      if (!r.ok) {
        let msg = `${r.status}`;
        try { const j = await r.json(); msg = j?.error ?? msg; } catch { /* ignore */ }
        throw new Error(msg);
      }
      return r.json();
    },
    enabled: !!id,
    staleTime: 30_000,
    retry: (failureCount, err) => {
      // Retry sur 502/503/504 et erreurs reseau, pas sur 401/404
      const m = err instanceof Error ? err.message : "";
      if (m.includes("401") || m.includes("404") || m.includes("introuvable") || m.includes("authentifi")) return false;
      return failureCount < 2;
    },
    retryDelay: (attempt) => 1000 * (attempt + 1),
  });

  const product = response?.data;
  const productId = product?.id;

  useEffect(() => {
    if (!product || hasHydrated) return;

    // Drafts win over a fresh API load — but ONLY if the draft contains
    // actual user work. A draft with all-empty values (which can happen if
    // Per-field hydration. Previous logic was all-or-nothing : si UN seul champ
    // avait un brouillon non vide (ex: titre tapé puis fermé), TOUS les autres
    // champs restaient à leur valeur initiale ("") au lieu d'être hydratés
    // depuis l'API. Conséquence visible côté vendeur : ouverture d'un produit
    // existant → tous les champs paraissaient vides (titre, image, prix, fichiers…).
    //
    // Maintenant chaque champ est hydraté indépendamment : si SON brouillon
    // existe, on garde la valeur locale ; sinon on écrit la valeur du serveur.
    const has = (field: string) => hasStoredDraft(draftPrefix, field);
    let anyDraft = false;

    if (!has("title")) setTitle(product.title);
    else anyDraft = true;
    if (!has("description")) setDescription(product.description ?? "");
    else anyDraft = true;
    if (!has("productType")) setProductType(product.productType);
    else anyDraft = true;
    if (!has("thumbnail")) setThumbnail(product.thumbnail ?? "");
    else anyDraft = true;
    if (!has("banner")) setBanner(product.banner ?? "");
    else anyDraft = true;
    if (!has("price")) setPrice(product.price);
    else anyDraft = true;
    if (!has("originalPrice")) setOriginalPrice(product.originalPrice != null ? String(product.originalPrice) : "");
    else anyDraft = true;
    if (!has("tagsInput")) setTagsInput((product.tags ?? []).join(", "));
    else anyDraft = true;
    if (!has("files")) setFiles(Array.isArray(product.files) ? product.files : []);
    else anyDraft = true;
    if (!has("hiddenFromMarketplace")) setHiddenFromMarketplace(!!product.hiddenFromMarketplace);
    else anyDraft = true;
    if (!has("previewEnabled")) setPreviewEnabled(!!product.previewEnabled);
    else anyDraft = true;
    if (!has("previewPages")) setPreviewPages(typeof product.previewPages === "number" ? product.previewPages : 5);
    else anyDraft = true;
    if (!has("watermarkEnabled")) setWatermarkEnabled(product.watermarkEnabled !== false);
    else anyDraft = true;
    // Limites de vente — null/undefined côté API → champ vide côté UI
    if (!has("maxBuyers")) setMaxBuyersInput(product.maxBuyers != null ? String(product.maxBuyers) : "");
    else anyDraft = true;
    if (!has("currentBuyers")) setCurrentBuyersInput(typeof product.currentBuyers === "number" ? String(product.currentBuyers) : "0");
    else anyDraft = true;
    // datetime-local attend "YYYY-MM-DDTHH:MM" (sans secondes ni TZ)
    if (!has("salesEndAt")) setSalesEndAtInput(product.salesEndAt ? product.salesEndAt.slice(0, 16) : "");
    else anyDraft = true;

    setDirty(anyDraft);
    setHasHydrated(true);
    // productId in the deps gives a stable trigger on initial load and on the
    // rare cross-product navigation; avoiding [product] avoids re-runs from
    // referentially-fresh-but-equivalent objects on background refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, hasHydrated, draftPrefix]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/formations/vendeur/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", id] });
      // Persisted to backend → drop the local draft so the next visit
      // re-hydrates from the canonical product, not stale localStorage.
      clearDrafts(draftPrefix);
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
    onSuccess: () => {
      clearDrafts(draftPrefix);
      router.push("/vendeur/produits");
    },
  });

  function track<T>(setter: (v: T) => void, v: T) {
    setter(v);
    setDirty(true);
  }

  function handleSave() {
    // Parse les limites : champ vide → null (pas de limite). NaN négatif → on
    // laisse remonter null aussi pour éviter d'écrire des valeurs absurdes.
    const maxBuyersParsed = maxBuyersInput.trim() === "" ? null : Math.max(0, Math.floor(Number(maxBuyersInput)));
    const currentBuyersParsed = currentBuyersInput.trim() === "" ? 0 : Math.max(0, Math.floor(Number(currentBuyersInput)));
    const salesEndAtParsed = salesEndAtInput.trim() === "" ? null : new Date(salesEndAtInput).toISOString();
    saveMutation.mutate({
      title,
      description,
      productType,
      thumbnail,
      banner,
      price,
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      files,
      hiddenFromMarketplace,
      previewEnabled,
      previewPages,
      watermarkEnabled,
      maxBuyers: maxBuyersParsed,
      currentBuyers: currentBuyersParsed,
      salesEndAt: salesEndAtParsed,
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
            ) : draftLabel ? (
              <span
                title="Vos modifications sont stockées localement à chaque saisie. Vous pouvez fermer l'onglet et revenir, elles seront restaurées."
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700"
              >
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
                Brouillon {draftLabel}
              </span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
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

        {/* Section: Images — vignette (carte) + bannière (page produit) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-[#191c1e] mb-1">Images du produit</h2>
            <p className="text-xs text-[#5c647a]">
              La <strong>vignette</strong> apparaît sur les cartes du marketplace.
              La <strong>bannière</strong> apparaît en haut de la page détail. Vous pouvez n&apos;en mettre qu&apos;une, l&apos;autre la remplacera.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-bold text-[#5c647a] uppercase tracking-wider mb-2">Vignette</p>
              <ImageUploader
                value={thumbnail}
                onChange={(url) => track(setThumbnail, url)}
                aspectClass="aspect-square"
                helper="600×600 carré · JPG/PNG · Max 5 MB"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#5c647a] uppercase tracking-wider mb-2">Bannière de couverture</p>
              <ImageUploader
                value={banner}
                onChange={(url) => track(setBanner, url)}
                aspectClass="aspect-video"
                helper="1280×720 (16:9) · JPG/PNG · Max 5 MB"
              />
            </div>
          </div>
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

        {/* Section: Limites de vente */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-[#191c1e] mb-1">Limites de vente</h2>
            <p className="text-xs text-[#5c647a]">
              Créez de l&apos;urgence avec une date de fin et/ou un nombre de ventes limité.
              Une fois la limite atteinte, le bouton &laquo; Acheter &raquo; est remplacé par
              &laquo; Vente terminée &raquo; et plus aucune commande ne passe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5c647a] uppercase tracking-wider mb-1.5">
                Date de fin des ventes (optionnel)
              </label>
              <input
                type="datetime-local"
                value={salesEndAtInput}
                onChange={(e) => track(setSalesEndAtInput, e.target.value)}
                className="w-full text-sm text-[#191c1e] bg-white px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
              />
              <p className="text-[11px] text-[#5c647a] mt-1.5">
                Laissez vide pour vendre sans limite de temps.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5c647a] uppercase tracking-wider mb-1.5">
                Nombre maximum de ventes (optionnel)
              </label>
              <input
                type="number"
                value={maxBuyersInput}
                onChange={(e) => track(setMaxBuyersInput, e.target.value)}
                min={0}
                placeholder="ex: 100"
                className="w-full text-sm text-[#191c1e] bg-white px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
              />
              <p className="text-[11px] text-[#5c647a] mt-1.5">
                Laissez vide pour autoriser un nombre illimité de ventes.
              </p>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#5c647a] uppercase tracking-wider mb-1.5">
                Compteur de ventes affiché (auto + ajustement)
              </label>
              <input
                type="number"
                value={currentBuyersInput}
                onChange={(e) => track(setCurrentBuyersInput, e.target.value)}
                min={0}
                className="w-full text-sm text-[#191c1e] bg-white px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/20"
              />
              <p className="text-[11px] text-[#5c647a] mt-1.5">
                <strong className="text-[#006e2f]">Auto-incrémenté à chaque vente.</strong> Vous pouvez le pré-remplir
                (ex : ventes hors plateforme) ou l&apos;ajuster après un remboursement. Le compteur réel
                des transactions reste visible dans votre dashboard.
                {maxBuyersInput && Number(maxBuyersInput) > 0 && (
                  <>
                    {" "}Restant : <strong>{Math.max(0, Number(maxBuyersInput) - Number(currentBuyersInput || 0))}</strong> sur {maxBuyersInput}.
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => track(setCurrentBuyersInput, "0")}
              className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#5c647a] hover:border-[#006e2f]/30 hover:text-[#006e2f] whitespace-nowrap"
            >
              Réinitialiser
            </button>
          </div>

          {/* Aperçu visuel de la barre de progression telle qu'elle s'affichera côté acheteur */}
          {maxBuyersInput && Number(maxBuyersInput) > 0 && (
            <div className="rounded-xl bg-[#f7f9fb] border border-gray-100 p-4">
              <p className="text-[11px] font-semibold text-[#5c647a] uppercase tracking-wider mb-2">
                Aperçu côté acheteur
              </p>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-bold text-[#191c1e]">
                  {Number(currentBuyersInput || 0)} / {maxBuyersInput} vendus
                </span>
                <span className="text-xs font-semibold text-[#006e2f]">
                  {Math.max(0, Number(maxBuyersInput) - Number(currentBuyersInput || 0))} restants
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#006e2f] to-[#22c55e] transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, (Number(currentBuyersInput || 0) / Math.max(1, Number(maxBuyersInput))) * 100),
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
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
          <MultiFileUploader
            value={files}
            onChange={(next) => track(setFiles, next)}
            productType={(productType as "EBOOK" | "PDF" | "TEMPLATE" | "AUDIO" | "VIDEO" | "LICENCE" | "AUTRE") || "PDF"}
          />
        </div>

        {/* Section: Aperçu gratuit (PDF only) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#191c1e] mb-1">Aperçu gratuit</h2>
            <p className="text-xs text-[#5c647a]">
              Laissez les acheteurs feuilleter les premières pages de votre PDF avant l&apos;achat.
              Les pages affichées portent un filigrane Novakou pour protéger votre contenu.
            </p>
          </div>

          {!files.some((f) => (f.mimeType ?? "").toLowerCase() === "application/pdf") && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">info</span>
              <p>Aucun PDF n&apos;est attaché à ce produit. L&apos;aperçu ne s&apos;affichera que si vous ajoutez un fichier PDF dans la section ci-dessus.</p>
            </div>
          )}

          <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#006e2f]/30 cursor-pointer">
            <div>
              <p className="text-sm font-bold text-[#191c1e]">Activer l&apos;aperçu gratuit</p>
              <p className="text-xs text-[#5c647a] mt-0.5">
                Affiche un onglet « Aperçu » sur la page produit avec les premières pages du PDF.
              </p>
            </div>
            <button
              type="button"
              onClick={() => track(setPreviewEnabled, !previewEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                previewEnabled ? "bg-[#006e2f]" : "bg-gray-200"
              }`}
              aria-pressed={previewEnabled}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                  previewEnabled ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </label>

          {previewEnabled && (
            <>
              <div className="p-4 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#191c1e]">Nombre de pages visibles</p>
                  <span className="text-base font-extrabold text-[#006e2f] tabular-nums">{previewPages}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={previewPages}
                  onChange={(e) => track(setPreviewPages, Number(e.target.value))}
                  className="w-full accent-[#006e2f]"
                />
                <div className="flex justify-between text-[10px] text-[#5c647a] font-semibold uppercase tracking-wider">
                  <span>1 page</span>
                  <span>20 pages max</span>
                </div>
                <p className="text-xs text-[#5c647a]">
                  Si votre PDF contient moins de pages que cette valeur, toutes seront affichées.
                </p>
              </div>

              <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#006e2f]/30 cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-[#191c1e]">Filigrane Novakou</p>
                  <p className="text-xs text-[#5c647a] mt-0.5">
                    Recommandé. Empêche la diffusion de l&apos;aperçu comme s&apos;il s&apos;agissait du fichier complet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => track(setWatermarkEnabled, !watermarkEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    watermarkEnabled ? "bg-[#006e2f]" : "bg-gray-200"
                  }`}
                  aria-pressed={watermarkEnabled}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      watermarkEnabled ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </label>
            </>
          )}
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
