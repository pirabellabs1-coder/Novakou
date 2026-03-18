"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

const FormationRichEditor = dynamic(
  () => import("@/components/formations/FormationRichEditor").then((m) => m.FormationRichEditor),
  { ssr: false, loading: () => <div className="h-[250px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

interface Category {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
}

const PRODUCT_TYPES = [
  { value: "EBOOK", icon: "menu_book", label: "E-book", desc: "Livre numérique" },
  { value: "PDF", icon: "picture_as_pdf", label: "Document PDF", desc: "Guide, rapport, workbook" },
  { value: "TEMPLATE", icon: "dashboard_customize", label: "Template", desc: "Modèle réutilisable" },
  { value: "LICENCE", icon: "vpn_key", label: "Licence logiciel", desc: "Clé de licence unique" },
  { value: "AUDIO", icon: "headphones", label: "Audio", desc: "Podcast, musique, cours audio" },
  { value: "VIDEO", icon: "videocam", label: "Vidéo", desc: "Tutoriel, formation vidéo" },
  { value: "AUTRE", icon: "inventory_2", label: "Autre", desc: "Tout autre produit numérique" },
];

const STEPS = [
  { label: "Informations", icon: "info" },
  { label: "Description", icon: "description" },
  { label: "Fichier & Aperçu", icon: "upload_file" },
  { label: "Prix & Publication", icon: "sell" },
];

export default function CreerProduitPage() {
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Step 1: Information
  const [titleFr, setTitleFr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [productType, setProductType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Step 2: Description
  const [descriptionFr, setDescriptionFr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");

  // Step 3: File & Preview
  const [banner, setBanner] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileStoragePath, setFileStoragePath] = useState("");
  const [fileSize, setFileSize] = useState<number | undefined>();
  const [fileMimeType, setFileMimeType] = useState("");
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [previewPages, setPreviewPages] = useState(5);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [maxBuyers, setMaxBuyers] = useState<number | undefined>();

  // Step 4: Pricing
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>();
  const [isFree, setIsFree] = useState(false);

  useEffect(() => {
    fetch("/api/formations/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  function canProceed(): boolean {
    if (step === 0) return titleFr.length >= 3 && titleEn.length >= 3 && !!productType && !!categoryId;
    if (step === 1) return true; // description optional
    if (step === 2) return true; // file can be added later
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/instructeur/produits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleFr,
          titleEn,
          productType,
          categoryId,
          tags,
          descriptionFr: descriptionFr || undefined,
          descriptionEn: descriptionEn || undefined,
          descriptionFormat: "tiptap",
          banner: banner || undefined,
          fileUrl: fileUrl || undefined,
          fileStoragePath: fileStoragePath || undefined,
          fileSize,
          fileMimeType: fileMimeType || undefined,
          previewEnabled,
          previewPages,
          watermarkEnabled,
          maxBuyers: maxBuyers || undefined,
          price: isFree ? 0 : price,
          originalPrice: originalPrice || undefined,
          isFree,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        return;
      }

      router.push("/formations/instructeur/produits");
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Créer un produit numérique</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full ${
                i === step
                  ? "bg-primary text-white"
                  : i < step
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-400"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : <span className="material-symbols-outlined text-sm">{s.icon}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {/* Step 1: Information */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Type de produit *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRODUCT_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setProductType(pt.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${
                      productType === pt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary/30"
                    }`}
                  >
                    <span className="material-symbols-outlined">{pt.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{pt.label}</p>
                      <p className="text-xs text-slate-500">{pt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Titre (Français) *</label>
                <input
                  type="text" value={titleFr} onChange={(e) => setTitleFr(e.target.value)}
                  placeholder="Mon e-book génial"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Titre (Anglais) *</label>
                <input
                  type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="My awesome e-book"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Catégorie *</label>
              <select
                value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {locale === "fr" ? cat.nameFr : cat.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Tags</label>
              <div className="flex items-center gap-2">
                <input
                  type="text" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Ajouter un tag..."
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
                <button onClick={addTag} className="px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold">+</button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-xs px-2 py-1 rounded-full">
                      #{tag}
                      <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-slate-400 hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Description (Français)</label>
              <FormationRichEditor
                content={descriptionFr}
                onChange={setDescriptionFr}
                placeholder="Décrivez votre produit en détail..."
                minHeight={250}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Description (Anglais)</label>
              <FormationRichEditor
                content={descriptionEn}
                onChange={setDescriptionEn}
                placeholder="Describe your product in detail..."
                minHeight={250}
              />
            </div>
          </div>
        )}

        {/* Step 3: File & Preview */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Image de couverture (URL)</label>
              <input
                type="url" value={banner} onChange={(e) => setBanner(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Fichier du produit (URL)</label>
              <input
                type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">URL Supabase Storage ou autre hébergement sécurisé</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Taille (octets)</label>
                <input
                  type="number" value={fileSize || ""} onChange={(e) => setFileSize(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Type MIME</label>
                <input
                  type="text" value={fileMimeType} onChange={(e) => setFileMimeType(e.target.value)}
                  placeholder="application/pdf"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
              <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">Aperçu & Protection</h3>

              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input type="checkbox" checked={previewEnabled} onChange={(e) => setPreviewEnabled(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Activer l&apos;aperçu (premières pages visibles gratuitement)</span>
              </label>

              {previewEnabled && (
                <div className="ml-7 space-y-3">
                  <div>
                    <label className="text-xs font-semibold">Nombre de pages d&apos;aperçu</label>
                    <input
                      type="number" min={1} max={50} value={previewPages} onChange={(e) => setPreviewPages(parseInt(e.target.value) || 5)}
                      className="w-24 ml-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={watermarkEnabled} onChange={(e) => setWatermarkEnabled(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Filigrane sur l&apos;aperçu (&quot;APERÇU - FreelanceHigh&quot;)</span>
                  </label>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
              <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">Stock limité</h3>
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maxBuyers !== undefined}
                  onChange={(e) => setMaxBuyers(e.target.checked ? 100 : undefined)}
                  className="w-4 h-4 rounded border-slate-300 text-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Limiter le nombre d&apos;acheteurs</span>
              </label>
              {maxBuyers !== undefined && (
                <div className="ml-7">
                  <label className="text-xs font-semibold">Nombre maximum</label>
                  <input
                    type="number" min={1} value={maxBuyers} onChange={(e) => setMaxBuyers(parseInt(e.target.value) || 1)}
                    className="w-32 ml-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {step === 3 && (
          <div className="space-y-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Produit gratuit</span>
            </label>

            {!isFree && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Prix (€) *</label>
                  <input
                    type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Prix original (€)</label>
                  <input
                    type="number" min={0} step={0.01} value={originalPrice || ""} onChange={(e) => setOriginalPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Prix barré"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">Affiché comme prix barré (optionnel)</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl p-4 mt-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold mb-3 text-slate-900 dark:text-white">Récapitulatif</h3>
              <div className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                <p><strong>Titre FR :</strong> {titleFr || "—"}</p>
                <p><strong>Titre EN :</strong> {titleEn || "—"}</p>
                <p><strong>Type :</strong> {PRODUCT_TYPES.find((p) => p.value === productType)?.label || "—"}</p>
                <p><strong>Prix :</strong> {isFree ? "Gratuit" : `${price.toFixed(2)}€`}</p>
                <p><strong>Aperçu :</strong> {previewEnabled ? `${previewPages} pages${watermarkEnabled ? " (filigrané)" : ""}` : "Désactivé"}</p>
                <p><strong>Stock :</strong> {maxBuyers ? `${maxBuyers} max` : "Illimité"}</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Précédent
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? (
                <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Création...</>
              ) : (
                <><Check className="w-4 h-4" /> Créer le produit</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
