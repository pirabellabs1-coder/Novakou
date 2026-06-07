// Refonte KAZA — hero navy + stepper visuel + cards verre dépoli — 2026-06-07
// Logique métier (états, mutations, drafts, validations) strictement préservée.
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileText,
  FileCode2,
  Headphones,
  BookMarked,
  Plus,
  Trash2,
  PlayCircle,
  Link2,
  Image as ImageIcon,
  Save,
  Rocket,
  Cloud,
  CircleDot,
} from "lucide-react";
import { RichTextEditor } from "@/components/formations/RichTextEditor";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { MultiFileUploader, type ProductFile } from "@/components/formations/MultiFileUploader";
import {
  useDraftField,
  useDraftSavedAt,
  formatSavedAt,
  clearDrafts,
} from "@/lib/hooks/use-draft-storage";

const DRAFT_PREFIX = "vendeur:product:create";

type ProductSubType = "cours_video" | "ebook" | "pdf" | "template" | "audio" | null;

const productTypes: {
  value: ProductSubType;
  kind: "formation" | "product";
  productType?: string;
  label: string;
  description: string;
  icon: typeof BookOpen;
}[] = [
  { value: "cours_video", kind: "formation", label: "Formation vidéo", description: "Série de leçons vidéo structurées en modules", icon: BookOpen },
  { value: "ebook", kind: "product", productType: "EBOOK", label: "E-book", description: "Livre numérique au format EPUB", icon: BookMarked },
  { value: "pdf", kind: "product", productType: "PDF", label: "PDF / Guide", description: "Document PDF téléchargeable", icon: FileText },
  { value: "template", kind: "product", productType: "TEMPLATE", label: "Template", description: "Modèle prêt-à-l'emploi (PSD, AI, Notion)", icon: FileCode2 },
  { value: "audio", kind: "product", productType: "AUDIO", label: "Audio / Podcast", description: "Contenu audio téléchargeable", icon: Headphones },
];

const categories = [
  "Développement Web",
  "Marketing Digital",
  "Design Graphique",
  "Entrepreneuriat",
  "Finance & Comptabilité",
  "Langues & Communication",
  "Photographie & Vidéo",
  "Business & Management",
  "Productivité",
  "Intelligence Artificielle",
];

type Lesson = { title: string; duration: number; videoUrl: string };
type Module = { title: string; lessons: Lesson[] };

/** Valide rapidement une URL vidéo (YouTube, Vimeo, .mp4/.webm/.mov, Supabase, Cloudinary). */
function isValidLessonUrl(url: string): boolean {
  if (!url) return false;
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) return false;
  return (
    /youtube\.com\/(watch|embed|shorts)|youtu\.be\//i.test(u) ||
    /vimeo\.com\/|player\.vimeo\.com\//i.test(u) ||
    /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u) ||
    u.includes("supabase.co") ||
    u.includes("cloudinary.com")
  );
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Inputs KAZA réutilisables ─────────────────────────────────────────────
const inputClass =
  "w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-white";
const labelClass = "text-sm font-semibold text-slate-700 mb-2 block";
const helperClass = "text-xs text-slate-500 mt-1.5";

export default function CreerProduitPage() {
  const router = useRouter();
  // Persisted draft state — survives refresh, tab close, accidental nav. Each
  // field is debounced into localStorage under `nk-draft:${DRAFT_PREFIX}:*`.
  const [step, setStep] = useDraftField(`${DRAFT_PREFIX}:step`, 1);
  const [selectedType, setSelectedType] = useDraftField<ProductSubType>(`${DRAFT_PREFIX}:selectedType`, null);
  const [title, setTitle] = useDraftField(`${DRAFT_PREFIX}:title`, "");
  const [category, setCategory] = useDraftField(`${DRAFT_PREFIX}:category`, "");
  const [shortDesc, setShortDesc] = useDraftField(`${DRAFT_PREFIX}:shortDesc`, "");
  const [description, setDescription] = useDraftField(`${DRAFT_PREFIX}:description`, "");
  // `thumbnail` = vignette carrée affichée sur les cartes marketplace.
  // `banner`    = bannière large affichée en haut de la page produit.
  const [thumbnail, setThumbnail] = useDraftField(`${DRAFT_PREFIX}:thumbnail`, "");
  const [banner, setBanner] = useDraftField(`${DRAFT_PREFIX}:banner`, "");
  const [price, setPrice] = useDraftField(`${DRAFT_PREFIX}:price`, 45000);
  const [originalPrice, setOriginalPrice] = useDraftField(`${DRAFT_PREFIX}:originalPrice`, 0);
  const [isFree, setIsFree] = useDraftField(`${DRAFT_PREFIX}:isFree`, false);
  const [error, setError] = useState<string | null>(null);

  // Formation-specific
  const [modules, setModules] = useDraftField<Module[]>(`${DRAFT_PREFIX}:modules`, [
    { title: "", lessons: [{ title: "", duration: 10, videoUrl: "" }] },
  ]);

  // Product-specific
  const [files, setFiles] = useDraftField<ProductFile[]>(`${DRAFT_PREFIX}:files`, []);

  const draftSavedAt = useDraftSavedAt(DRAFT_PREFIX);
  const draftLabel = formatSavedAt(draftSavedAt);

  const selected = productTypes.find((p) => p.value === selectedType);
  const isFormation = selected?.kind === "formation";
  const euroEquiv = Math.round(price / 655.957);

  // Dynamic step list based on type
  const steps = isFormation
    ? [
        { num: 1, label: "Type & Identité", sub: "Choix & catégorie" },
        { num: 2, label: "Description", sub: "Contenu pédagogique" },
        { num: 3, label: "Curriculum", sub: "Modules & leçons" },
        { num: 4, label: "Tarification", sub: "Prix & commission" },
        { num: 5, label: "Récapitulatif", sub: "Vérifier & publier" },
      ]
    : [
        { num: 1, label: "Type & Identité", sub: "Choix & catégorie" },
        { num: 2, label: "Description", sub: "Contenu & résumé" },
        { num: 3, label: "Fichiers", sub: "Livrables à télécharger" },
        { num: 4, label: "Tarification", sub: "Prix & commission" },
        { num: 5, label: "Récapitulatif", sub: "Vérifier & publier" },
      ];
  const lastStep = steps.length;

  const createMutation = useMutation({
    mutationFn: (publish: boolean) =>
      fetch("/api/formations/vendeur/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: selected?.kind,
          productType: selected?.productType,
          title, shortDesc, description, category,
          thumbnail: thumbnail || null,
          banner: banner || null,
          price: isFree ? 0 : price,
          originalPrice: originalPrice || null,
          isFree,
          publish,
          modules: isFormation ? modules.filter((m) => m.title.trim()) : undefined,
          files: !isFormation ? files : undefined,
        }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) {
        setError(res.error);
        // V2.5 — proposer la suppression du brouillon si la création a échoué
        // côté serveur (ex. validation prix). Sans cela, l'utilisateur peut
        // se retrouver bloqué avec un draft pollué qui ressuscite à chaque visite.
        if (typeof window !== "undefined") {
          const keep = window.confirm(
            "La création a échoué. Conserver le brouillon pour réessayer ?\n\n" +
            "OK = conserver · Annuler = effacer le brouillon",
          );
          if (!keep) clearDrafts(DRAFT_PREFIX);
        }
        return;
      }
      // Wipe every saved field for this form once the product was created
      // server-side, otherwise the next visit would resurrect the draft.
      clearDrafts(DRAFT_PREFIX);
      router.push("/vendeur/produits");
    },
    onError: () => {
      setError("Erreur serveur — réessayez");
      // V2.5 — même logique en cas d'erreur réseau / fetch failure.
      if (typeof window !== "undefined") {
        const keep = window.confirm(
          "Erreur serveur. Conserver le brouillon pour réessayer ?\n\n" +
          "OK = conserver · Annuler = effacer le brouillon",
        );
        if (!keep) clearDrafts(DRAFT_PREFIX);
      }
    },
  });

  const canProceed = (() => {
    if (step === 1) return selectedType !== null && title.trim().length > 0 && category.length > 0;
    if (step === 2) return description.trim().length >= 20;
    if (isFormation && step === 3) return modules.some((m) => m.title.trim() && m.lessons.some((l) => l.title.trim()));
    if (!isFormation && step === 3) return true; // File upload optional
    if (step === lastStep - 1) return isFree || price > 0; // Pricing step (gratuit OU prix > 0)
    return true;
  })();

  const progress = ((step - 1) / (lastStep - 1)) * 100;
  const currentStepMeta = steps.find((s) => s.num === step);

  // Curriculum helpers
  const addModule = () => setModules((m) => [...m, { title: "", lessons: [{ title: "", duration: 10, videoUrl: "" }] }]);
  const removeModule = (mIdx: number) => setModules((m) => m.filter((_, i) => i !== mIdx));
  const updateModule = (mIdx: number, title: string) => setModules((m) => m.map((mod, i) => (i === mIdx ? { ...mod, title } : mod)));
  const addLesson = (mIdx: number) =>
    setModules((m) => m.map((mod, i) => (i === mIdx ? { ...mod, lessons: [...mod.lessons, { title: "", duration: 10, videoUrl: "" }] } : mod)));
  const removeLesson = (mIdx: number, lIdx: number) =>
    setModules((m) => m.map((mod, i) => (i === mIdx ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== lIdx) } : mod)));
  const updateLesson = (mIdx: number, lIdx: number, patch: Partial<Lesson>) =>
    setModules((m) =>
      m.map((mod, i) =>
        i === mIdx
          ? { ...mod, lessons: mod.lessons.map((l, j) => (j === lIdx ? { ...l, ...patch } : l)) }
          : mod
      )
    );

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalDuration = modules.reduce((s, m) => s + m.lessons.reduce((ss, l) => ss + (l.duration || 0), 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto">
        {/* ═══════════════════════════════════════════════════════════════
            HERO HEADER — KAZA navy gradient
            ═══════════════════════════════════════════════════════════════ */}
        <header
          className="relative overflow-hidden rounded-3xl mb-8 p-7 md:p-10 text-white"
          style={{
            background:
              "linear-gradient(135deg, #0b2540 0%, #103057 45%, #1a4a7d 100%)",
          }}
        >
          {/* Halos décoratifs subtils */}
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-12 w-[360px] h-[360px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, #006e2f 0%, transparent 70%)" }}
          />

          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="min-w-0 flex-1">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full text-[11px] font-bold uppercase tracking-widest text-white shadow-md"
                style={{ background: "#f97316" }}
              >
                <CircleDot className="w-3 h-3" />
                Étape {step} / {lastStep}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05] mb-2">
                Créer un nouveau produit
              </h1>
              <p className="text-sm md:text-base text-slate-200/80 max-w-2xl">
                {currentStepMeta?.label} — {currentStepMeta?.sub}.
                {selected && (
                  <>
                    {" "}Type sélectionné : <span className="font-bold text-white">{selected.label}</span>.
                  </>
                )}
              </p>

              {draftLabel && (
                <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-emerald-200">
                  <Cloud className="w-3.5 h-3.5" />
                  Brouillon sauvegardé {draftLabel}
                </div>
              )}
            </div>

            <Link
              href="/vendeur/produits"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold text-white hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
              Sortir
            </Link>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            STEPPER VISUEL — cercles connectés
            ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-7 mb-8">
          <div className="relative">
            {/* Ligne de fond */}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-slate-200 hidden md:block" />
            {/* Ligne de progression */}
            <div
              className="absolute top-5 left-0 h-[2px] bg-emerald-500 transition-all duration-500 hidden md:block"
              style={{ width: `${progress}%` }}
            />

            <div className="grid grid-cols-5 gap-2 md:gap-4 relative">
              {steps.map((s) => {
                const active = step === s.num;
                const done = step > s.num;
                const clickable = done;
                return (
                  <button
                    key={s.num}
                    onClick={() => { if (clickable) setStep(s.num); }}
                    disabled={!clickable}
                    className={`flex flex-col items-center text-center gap-2 transition-opacity ${
                      clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all relative z-10 shadow-sm ${
                        active
                          ? "bg-emerald-500 text-white border-emerald-500 ring-4 ring-emerald-100"
                          : done
                          ? "bg-[#0b2540] text-white border-[#0b2540]"
                          : "bg-white text-slate-400 border-slate-200"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <div className="hidden md:block">
                      <p
                        className={`text-[11px] font-bold uppercase tracking-wider leading-tight ${
                          active ? "text-[#0b2540]" : done ? "text-slate-700" : "text-slate-400"
                        }`}
                      >
                        {s.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CONTENU PAR ÉTAPE — carte blanche KAZA
            ═══════════════════════════════════════════════════════════════ */}

        {/* ── STEP 1 — Type & Identité ── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0b2540] tracking-tight">
                Quel type de produit créez-vous&nbsp;?
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Choisissez le format — la suite du formulaire s&apos;adapte automatiquement.
              </p>
            </div>

            {/* Cards type produit */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {productTypes.map((pt) => {
                const Icon = pt.icon;
                const isSel = selectedType === pt.value;
                return (
                  <button
                    key={pt.value}
                    onClick={() => setSelectedType(pt.value)}
                    className={`group relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all ${
                      isSel
                        ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100/50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        isSel ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-base font-bold tracking-tight ${isSel ? "text-emerald-900" : "text-[#0b2540]"}`}>
                        {pt.label}
                      </p>
                      <p className={`text-xs mt-1 leading-relaxed ${isSel ? "text-emerald-700" : "text-slate-500"}`}>
                        {pt.description}
                      </p>
                    </div>
                    {isSel && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Identité du produit (apparaît après sélection du type) */}
            {selectedType && (
              <div className="border-t border-slate-200 pt-8">
                <h3 className="text-lg font-bold text-[#0b2540] tracking-tight mb-1">Identité du produit</h3>
                <p className="text-sm text-slate-500 mb-6">Titre, catégorie, accroche et visuels.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Colonne gauche — champs texte */}
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Titre du produit</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex : Maîtrisez le Marketing Digital"
                        className={inputClass}
                      />
                      <p className={helperClass}>Soyez précis et inspirant — ce titre s&apos;affiche partout.</p>
                    </div>

                    <div>
                      <label className={labelClass}>Catégorie</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={`${inputClass} appearance-none cursor-pointer`}
                      >
                        <option value="">Sélectionner une catégorie…</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Description courte</label>
                      <input
                        type="text"
                        value={shortDesc}
                        onChange={(e) => setShortDesc(e.target.value)}
                        placeholder="Une phrase qui accroche"
                        maxLength={150}
                        className={inputClass}
                      />
                      <p className={`${helperClass} flex justify-between`}>
                        <span>Visible sur les cartes du marketplace.</span>
                        <span className="tabular-nums">{shortDesc.length}/150</span>
                      </p>
                    </div>
                  </div>

                  {/* Colonne droite — visuels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Vignette carrée</label>
                      <ImageUploader
                        value={thumbnail}
                        onChange={setThumbnail}
                        folder="portfolio"
                        aspectClass="aspect-square"
                        helper="600×600 · JPG/PNG · Max 5 MB. Affichée sur les cartes marketplace."
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Bannière 16:9</label>
                      <ImageUploader
                        value={banner}
                        onChange={setBanner}
                        folder="portfolio"
                        aspectClass="aspect-video"
                        helper="1280×720 · JPG/PNG · Max 5 MB. En tête de la page produit."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2 — Description ── */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0b2540] tracking-tight">
                {isFormation ? "Contenu pédagogique" : "Contenu du produit"}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {isFormation
                  ? "Présentez ce que les apprenants vont apprendre, pour qui c'est fait et les prérequis."
                  : "Détaillez ce que contient votre produit, pour qui il est fait et ce qui le rend unique."}
              </p>
            </div>

            <div>
              <label className={labelClass}>
                {isFormation ? "Décrivez votre formation" : "Décrivez votre produit"}
              </label>
              <div className="rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 transition-all">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder={isFormation
                    ? "Que vont apprendre les apprenants ? À qui s'adresse cette formation ? Quels sont les prérequis ? Vous pouvez ajouter des titres, des listes, des images, des liens…"
                    : "Ce que contient votre produit, pour qui, et pourquoi il est unique. Ajoutez des images, des sections, des liens vers des exemples…"}
                  minHeight={360}
                />
              </div>
              <p
                className={`mt-2 text-xs tabular-nums font-semibold flex items-center gap-1.5 ${
                  description.replace(/<[^>]*>/g, "").trim().length < 20 ? "text-rose-600" : "text-slate-500"
                }`}
              >
                {description.replace(/<[^>]*>/g, "").trim().length < 20 && (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {description.replace(/<[^>]*>/g, "").trim().length} caractères
                {description.replace(/<[^>]*>/g, "").trim().length < 20 && " · minimum 20 requis"}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Curriculum (formations) ── */}
        {step === 3 && isFormation && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0b2540] tracking-tight">
                Modules &amp; leçons
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Structurez votre formation en modules. Pour chaque leçon, ajoutez le titre, la durée et le lien vidéo
                (YouTube, Vimeo ou MP4). Le lien est optionnel — vous pourrez l&apos;ajouter plus tard depuis l&apos;éditeur de cours.
              </p>
            </div>

            <div className="space-y-5">
              {modules.map((mod, mIdx) => (
                <div key={mIdx} className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50/40">
                  <div className="flex items-center gap-3 px-5 py-4 bg-white border-b-2 border-emerald-500">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-xs flex-shrink-0">
                      M{String(mIdx + 1).padStart(2, "0")}
                    </span>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => updateModule(mIdx, e.target.value)}
                      placeholder="Titre du module…"
                      className="flex-1 bg-transparent border-none text-base font-bold tracking-tight text-[#0b2540] placeholder:text-slate-400 outline-none"
                    />
                    {modules.length > 1 && (
                      <button
                        onClick={() => removeModule(mIdx)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Supprimer ce module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {mod.lessons.map((lesson, lIdx) => {
                      const urlValid = !lesson.videoUrl.trim() || isValidLessonUrl(lesson.videoUrl);
                      return (
                        <div key={lIdx} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors space-y-2">
                          {/* Ligne titre + durée */}
                          <div className="flex items-center gap-3">
                            <PlayCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-[11px] tabular-nums text-slate-400 w-7 font-semibold">
                              {String(lIdx + 1).padStart(2, "0")}
                            </span>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(mIdx, lIdx, { title: e.target.value })}
                              placeholder="Titre de la leçon…"
                              className="flex-1 bg-transparent border-none text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={lesson.duration}
                                onChange={(e) => updateLesson(mIdx, lIdx, { duration: Number(e.target.value) })}
                                min="0"
                                className="w-16 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 py-1.5 px-2 text-xs tabular-nums text-right outline-none"
                              />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">min</span>
                            </div>
                            {mod.lessons.length > 1 && (
                              <button
                                onClick={() => removeLesson(mIdx, lIdx)}
                                className="p-1.5 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Supprimer la leçon"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {/* Ligne URL vidéo */}
                          <div className="flex items-center gap-3 pl-10">
                            <Link2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                            <input
                              type="url"
                              value={lesson.videoUrl}
                              onChange={(e) => updateLesson(mIdx, lIdx, { videoUrl: e.target.value })}
                              placeholder="URL vidéo : YouTube, Vimeo ou lien .mp4 (optionnel — modifiable plus tard)"
                              className={`flex-1 bg-slate-50 border-2 rounded-lg py-1.5 px-3 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition-all ${
                                urlValid
                                  ? "border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                  : "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                              }`}
                            />
                            {lesson.videoUrl.trim() && urlValid && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            )}
                          </div>
                          {!urlValid && (
                            <p className="pl-10 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Format non reconnu — utilisez YouTube, Vimeo ou un lien direct .mp4/.webm/.mov
                            </p>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={() => addLesson(mIdx)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une leçon
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addModule}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-sm font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/40 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter un module
              </button>
            </div>

            {/* Récap curriculum + info prochaine étape */}
            {modules.some((m) => m.title.trim()) && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Modules</p>
                  <p className="text-2xl font-extrabold tabular-nums text-[#0b2540]">
                    {modules.filter((m) => m.title.trim()).length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Leçons</p>
                  <p className="text-2xl font-extrabold tabular-nums text-[#0b2540]">{totalLessons}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Durée totale</p>
                  <p className="text-2xl font-extrabold tabular-nums text-[#0b2540]">
                    {totalDuration} <span className="text-sm font-bold text-slate-400">min</span>
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 p-5 rounded-2xl bg-emerald-50 border-l-4 border-emerald-500">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">Prochaine étape</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                Après la création, ouvrez la formation pour uploader les vidéos, PDFs et ressources de chaque leçon depuis l&apos;éditeur.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3 — File Upload (products) ── */}
        {step === 3 && !isFormation && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0b2540] tracking-tight">
                Fichier téléchargeable
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {selected?.productType === "EBOOK" && "L'apprenant téléchargera ce fichier après achat."}
                {selected?.productType === "PDF" && "L'apprenant téléchargera ce PDF après achat."}
                {selected?.productType === "TEMPLATE" && "L'apprenant téléchargera ce template (ZIP recommandé)."}
                {selected?.productType === "AUDIO" && "L'apprenant téléchargera ce fichier audio."}
              </p>
            </div>

            <MultiFileUploader
              value={files}
              onChange={setFiles}
              productType={(selected?.productType as "EBOOK" | "PDF" | "TEMPLATE" | "AUDIO") ?? "PDF"}
            />

            <div className="mt-6 p-5 rounded-2xl bg-emerald-50 border-l-4 border-emerald-500">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">Livraison automatique</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                Dès qu&apos;un acheteur règle le produit, il accède immédiatement à ce fichier depuis son espace
                &laquo;&nbsp;Mes achats&nbsp;&raquo;. Il pourra aussi laisser un avis après téléchargement.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 4 — Pricing ── */}
        {step === 4 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0b2540] tracking-tight">
                Tarification
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Choisissez un prix juste pour vous et vos acheteurs. Vous touchez 90&nbsp;% du prix de vente.
              </p>
            </div>

            {/* Toggle Gratuit / Payant */}
            <div
              className={`flex items-center justify-between gap-4 p-5 rounded-2xl border-2 mb-8 transition-colors ${
                isFree ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <p className="text-base font-bold text-[#0b2540]">
                  {isFree ? "Ce produit est gratuit" : "Ce produit est payant"}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {isFree
                    ? "Les apprenants y accèdent sans payer. Idéal pour acquérir une audience."
                    : "Les apprenants paient pour accéder. Vous touchez 90 % du prix."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFree((v) => !v);
                  if (!isFree) setPrice(0);
                }}
                className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                  isFree ? "bg-emerald-500" : "bg-slate-300"
                }`}
                aria-pressed={isFree}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                    isFree ? "left-7" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${isFree ? "opacity-40 pointer-events-none" : ""}`}>
              {/* Colonne gauche — saisies prix */}
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Prix de vente (FCFA)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min="0"
                    disabled={isFree}
                    className={`${inputClass} text-2xl font-extrabold tabular-nums py-4`}
                  />
                  <p className={`${helperClass} tabular-nums`}>≈ {formatFCFA(euroEquiv)} €</p>
                </div>
                <div>
                  <label className={labelClass}>Prix barré (optionnel)</label>
                  <input
                    type="number"
                    value={originalPrice || ""}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    disabled={isFree}
                    className={`${inputClass} text-lg font-bold tabular-nums py-4`}
                  />
                  {originalPrice > price && (
                    <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 tabular-nums">
                      Réduction&nbsp;: -{Math.round((1 - price / originalPrice) * 100)}%
                    </p>
                  )}
                </div>
              </div>

              {/* Colonne droite — card répartition navy */}
              <div
                className="rounded-2xl p-7 text-white overflow-hidden relative"
                style={{
                  background:
                    "linear-gradient(135deg, #0b2540 0%, #103057 45%, #1a4a7d 100%)",
                }}
              >
                <div
                  aria-hidden
                  className="absolute -top-16 -right-16 w-[260px] h-[260px] rounded-full blur-3xl opacity-25"
                  style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }}
                />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-5">Répartition</p>
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">Prix total</p>
                      <p className="text-xl md:text-2xl font-extrabold tabular-nums tracking-tight break-all">
                        {formatFCFA(price)} <span className="text-sm font-bold text-slate-400">FCFA</span>
                      </p>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">Votre part (90%)</p>
                      <p className="text-3xl font-extrabold tabular-nums text-emerald-400">
                        {formatFCFA(price * 0.9)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">Commission Novakou (10%)</p>
                      <p className="text-lg font-bold tabular-nums text-slate-200">{formatFCFA(price * 0.1)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5 — Summary ── */}
        {step === 5 && (
          <div className="space-y-6 mb-8">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#0b2540] tracking-tight">
                  Récapitulatif
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Vérifiez les informations puis publiez votre produit ou enregistrez-le en brouillon.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Aperçus visuels */}
                <div className="space-y-5">
                  <div>
                    <p className={labelClass}>Aperçu carte marketplace</p>
                    <div className="aspect-square rounded-2xl bg-slate-100 relative overflow-hidden border border-slate-200">
                      {(thumbnail || banner) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbnail || banner} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon className="w-12 h-12 mb-2" />
                          <p className="text-xs font-semibold">Pas de visuel</p>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white shadow-md">
                          {selected?.label ?? "Produit"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {banner && (
                    <div>
                      <p className={labelClass}>Aperçu page produit</p>
                      <div className="aspect-video rounded-2xl bg-slate-100 relative overflow-hidden border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={banner} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Détails */}
                <dl className="space-y-4">
                  {[
                    { label: "Type", value: selected?.label ?? "—" },
                    { label: "Titre", value: title || "—" },
                    { label: "Catégorie", value: category || "—" },
                    ...(isFormation
                      ? [
                          {
                            label: "Curriculum",
                            value: `${modules.filter((m) => m.title.trim()).length} modules · ${totalLessons} leçons · ${totalDuration} min`,
                          },
                        ]
                      : [
                          {
                            label: "Fichiers",
                            value: files.length > 0 ? `${files.length} fichier${files.length > 1 ? "s" : ""}` : "Aucun fichier",
                          },
                        ]),
                    {
                      label: "Prix",
                      value: isFree ? "Gratuit" : `${formatFCFA(price)} FCFA · ≈ ${formatFCFA(euroEquiv)} €`,
                    },
                  ].map((row) => (
                    <div key={row.label} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{row.label}</dt>
                      <dd className="text-sm font-bold text-[#0b2540] break-words">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-900">Erreur de publication</p>
                  <p className="text-sm text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-emerald-50 border-l-4 border-emerald-500 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">Avant publication</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                Votre produit sera <span className="font-bold">publié immédiatement</span> sur la marketplace.
                Vous pourrez le modifier ou le retirer à tout moment depuis votre tableau de bord.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER STICKY — navigation + auto-save indicator
          ═══════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-4 flex items-center justify-between gap-3">
          {/* Retour */}
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="inline-flex items-center gap-2 px-4 md:px-5 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour</span>
          </button>

          {/* Auto-save indicator (centre) */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            {draftLabel ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-semibold">Brouillon enregistré {draftLabel}</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                <span>En attente de saisie</span>
              </>
            )}
          </div>

          {/* Actions à droite */}
          <div className="flex items-center gap-2">
            {step < lastStep ? (
              <button
                onClick={() => setStep((s) => Math.min(lastStep, s + 1))}
                disabled={!canProceed}
                className="inline-flex items-center gap-2 px-6 md:px-7 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-md hover:bg-emerald-600 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Continuer
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => createMutation.mutate(false)}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 md:px-5 py-3 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {createMutation.isPending ? "Enregistrement…" : "Brouillon"}
                  </span>
                </button>
                <button
                  onClick={() => createMutation.mutate(true)}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 md:px-7 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-md hover:bg-emerald-600 hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  <Rocket className="w-4 h-4" />
                  {createMutation.isPending ? "Publication…" : "Publier maintenant"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Suppress unused warning if needed
void slugify;
