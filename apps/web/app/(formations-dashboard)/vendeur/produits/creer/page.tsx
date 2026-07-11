// Refonte KAZA — hero navy + stepper visuel + cards verre dépoli — 2026-06-07
// V2 — 2026-06-07 : raccourcis clavier, preview live drawer, smart defaults,
// validation inline visible, indicateur "prêt à publier", toast d'étape,
// tour d'onboarding première fois, étapes optionnelles avec "Sauter".
// Logique métier (états, mutations, drafts, validations) strictement préservée.
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Sparkles,
  Keyboard,
  SkipForward,
  Lightbulb,
  Timer,
  Share2,
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
const ONBOARDING_KEY = "nk-onboarding:product-create:dismissed";

type ProductSubType = "cours_video" | "ebook" | "pdf" | "template" | "audio" | null;

/**
 * Smart defaults par type de produit — uniquement des hints (placeholder + bouton
 * "Suggérer"). N'écrasent jamais la saisie utilisateur sans action explicite.
 */
type SmartDefault = {
  price: number;
  shortDesc: string;
  description: string;
};

const SMART_DEFAULTS: Record<NonNullable<ProductSubType>, SmartDefault> = {
  cours_video: {
    price: 15000,
    shortDesc: "Une formation vidéo complète de 4h pour passer du débutant à l'autonome.",
    description:
      "<p><strong>Ce que vous allez apprendre :</strong></p><ul><li>Les fondamentaux pour partir sur de bonnes bases</li><li>La pratique guidée pas à pas</li><li>Les pièges à éviter et les astuces des pros</li></ul><p><strong>À qui s'adresse cette formation :</strong> débutants motivés et intermédiaires qui veulent structurer leurs connaissances.</p><p><strong>Prérequis :</strong> aucun, un ordinateur et de la curiosité suffisent.</p>",
  },
  ebook: {
    price: 5000,
    shortDesc: "Un e-book de 50 pages pour maîtriser l'essentiel à votre rythme.",
    description:
      "<p><strong>Ce que contient cet e-book :</strong></p><ul><li>50 pages de contenu structuré et illustré</li><li>Des exemples concrets et actionnables</li><li>Une checklist récapitulative en fin d'ouvrage</li></ul><p><strong>Format :</strong> PDF haute qualité, lisible sur tout appareil.</p>",
  },
  pdf: {
    price: 5000,
    shortDesc: "Un guide PDF clair et concis, prêt à appliquer dès aujourd'hui.",
    description:
      "<p><strong>Dans ce guide vous trouverez :</strong></p><ul><li>Une méthode étape par étape</li><li>Des modèles prêts à copier</li><li>Des ressources complémentaires triées</li></ul>",
  },
  template: {
    price: 3000,
    shortDesc: "Un template prêt-à-l'emploi pour gagner des heures de travail.",
    description:
      "<p><strong>Ce template comprend :</strong></p><ul><li>Le fichier source modifiable</li><li>Une documentation d'utilisation</li><li>Des variantes pour s'adapter à votre marque</li></ul><p><strong>Format :</strong> Notion / Figma / Canva (au choix).</p>",
  },
  audio: {
    price: 25000,
    shortDesc: "Un programme audio premium à écouter partout, à votre rythme.",
    description:
      "<p><strong>Contenu :</strong></p><ul><li>Plusieurs heures de contenu audio haute qualité</li><li>Transcription écrite incluse</li><li>Ressources et compléments téléchargeables</li></ul>",
  },
};

const productTypes: {
  value: ProductSubType;
  kind: "formation" | "product";
  productType?: string;
  label: string;
  description: string;
  icon: typeof BookOpen;
  hint: string;
}[] = [
  { value: "cours_video", kind: "formation", label: "Formation vidéo", description: "Série de leçons vidéo structurées en modules", icon: BookOpen, hint: "Suggéré ~15 000 FCFA · durée 4h" },
  { value: "ebook", kind: "product", productType: "EBOOK", label: "E-book", description: "Livre numérique au format EPUB", icon: BookMarked, hint: "Suggéré ~5 000 FCFA · 50 pages" },
  { value: "pdf", kind: "product", productType: "PDF", label: "PDF / Guide", description: "Document PDF téléchargeable", icon: FileText, hint: "Suggéré ~5 000 FCFA" },
  { value: "template", kind: "product", productType: "TEMPLATE", label: "Template", description: "Modèle prêt-à-l'emploi (PSD, AI, Notion)", icon: FileCode2, hint: "Suggéré ~3 000 FCFA · Notion/Figma" },
  { value: "audio", kind: "product", productType: "AUDIO", label: "Audio / Podcast", description: "Contenu audio téléchargeable", icon: Headphones, hint: "Suggéré ~25 000 FCFA · 60min" },
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

// ─────────────────────────────────────────────────────────────────────────
// Toast minimal — pas de dépendance externe. Stack vertical, auto-dismiss.
// ─────────────────────────────────────────────────────────────────────────
type ToastKind = "success" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);
  return { toasts, push };
}

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
  // Affiliation — opt-in explicite du vendeur (le produit devient promouvable
  // par les affiliés) + commission qu'il leur offre.
  const [affiliateEnabled, setAffiliateEnabled] = useDraftField(`${DRAFT_PREFIX}:affiliateEnabled`, false);
  const [affiliateCommissionPct, setAffiliateCommissionPct] = useDraftField(`${DRAFT_PREFIX}:affiliateCommissionPct`, 30);
  const [error, setError] = useState<string | null>(null);

  // Formation-specific
  const [modules, setModules] = useDraftField<Module[]>(`${DRAFT_PREFIX}:modules`, [
    { title: "", lessons: [{ title: "", duration: 10, videoUrl: "" }] },
  ]);

  // Product-specific
  const [files, setFiles] = useDraftField<ProductFile[]>(`${DRAFT_PREFIX}:files`, []);

  const draftSavedAt = useDraftSavedAt(DRAFT_PREFIX);
  const draftLabel = formatSavedAt(draftSavedAt);

  // ─── UI-only state (not persisted) ──────────────────────────────────────
  const { toasts, push } = useToasts();
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const announcedStepRef = useRef<number>(1);

  // First visit detection — only opens the onboarding once per browser.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(ONBOARDING_KEY);
    if (!dismissed) setShowOnboarding(true);
  }, []);

  const dismissOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_KEY, String(Date.now()));
    }
    setShowOnboarding(false);
    setOnboardingStep(0);
  }, []);

  const selected = productTypes.find((p) => p.value === selectedType);
  const isFormation = selected?.kind === "formation";

  // Dynamic step list based on type. `optional` marque les étapes que l'on
  // peut sauter via le bouton "Sauter pour l'instant" (étape Fichiers seulement —
  // les autres bloquent la publication par contrainte métier).
  const steps = isFormation
    ? [
        { num: 1, label: "Type & Identité", sub: "Choix & catégorie", estMin: 2, optional: false },
        { num: 2, label: "Description", sub: "Contenu pédagogique", estMin: 3, optional: false },
        { num: 3, label: "Curriculum", sub: "Modules & leçons", estMin: 3, optional: false },
        { num: 4, label: "Tarification", sub: "Prix & commission", estMin: 1, optional: false },
        { num: 5, label: "Récapitulatif", sub: "Vérifier & publier", estMin: 1, optional: false },
      ]
    : [
        { num: 1, label: "Type & Identité", sub: "Choix & catégorie", estMin: 2, optional: false },
        { num: 2, label: "Description", sub: "Contenu & résumé", estMin: 3, optional: false },
        { num: 3, label: "Fichiers", sub: "Livrables à télécharger", estMin: 2, optional: true },
        { num: 4, label: "Tarification", sub: "Prix & commission", estMin: 1, optional: false },
        { num: 5, label: "Récapitulatif", sub: "Vérifier & publier", estMin: 1, optional: false },
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
          affiliateEnabled,
          affiliateCommissionPct: affiliateEnabled ? Number(affiliateCommissionPct) || null : null,
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

  // ─── Validation par champ (pour les checkmarks inline + tooltip raisons) ─
  const titleValid = title.trim().length > 0;
  const categoryValid = category.length > 0;
  const shortDescValid = shortDesc.trim().length > 0;
  const typeValid = selectedType !== null;
  const descTextLen = description.replace(/<[^>]*>/g, "").trim().length;
  const descValid = descTextLen >= 20;
  const curriculumValid = modules.some((m) => m.title.trim() && m.lessons.some((l) => l.title.trim()));
  const priceValid = isFree || price > 0;

  const canProceed = (() => {
    if (step === 1) return typeValid && titleValid && categoryValid;
    if (step === 2) return descValid;
    if (isFormation && step === 3) return curriculumValid;
    if (!isFormation && step === 3) return true; // File upload optional
    if (step === lastStep - 1) return priceValid;
    return true;
  })();

  /** Raison textuelle pour le tooltip du bouton "Continuer" désactivé. */
  const missingReason = (() => {
    if (step === 1) {
      const missing: string[] = [];
      if (!typeValid) missing.push("le type de produit");
      if (!titleValid) missing.push("le titre");
      if (!categoryValid) missing.push("la catégorie");
      return missing.length ? `Remplis ${missing.join(", ")} pour continuer` : "";
    }
    if (step === 2 && !descValid) return `Description trop courte (${descTextLen}/20 caractères minimum)`;
    if (isFormation && step === 3 && !curriculumValid) return "Ajoute au moins un module avec une leçon titrée";
    if (step === lastStep - 1 && !priceValid) return "Choisis un prix > 0 ou active le mode gratuit";
    return "";
  })();

  const progress = ((step - 1) / (lastStep - 1)) * 100;
  const currentStepMeta = steps.find((s) => s.num === step);
  const remainingMin = steps.filter((s) => s.num >= step).reduce((acc, s) => acc + s.estMin, 0);

  /** Score "prêt à publier" — somme pondérée des champs requis remplis. */
  const readinessPct = useMemo(() => {
    const checks: boolean[] = [
      typeValid,
      titleValid,
      categoryValid,
      shortDescValid,
      Boolean(thumbnail || banner),
      descValid,
      isFormation ? curriculumValid : files.length > 0,
      priceValid,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [
    typeValid, titleValid, categoryValid, shortDescValid,
    thumbnail, banner, descValid, isFormation, curriculumValid,
    files.length, priceValid,
  ]);

  // ─── Toast d'étape franchie — déclenché à chaque incrément de step ───────
  useEffect(() => {
    if (step > announcedStepRef.current && step <= lastStep) {
      const justFinished = steps.find((s) => s.num === step - 1);
      if (justFinished) push(`Étape "${justFinished.label}" validée`, "success");
    }
    announcedStepRef.current = step;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ─── Navigation entre étapes ────────────────────────────────────────────
  const goNext = useCallback(() => {
    setStep((s) => {
      if (s >= lastStep) return s;
      if (!canProceed) return s;
      return s + 1;
    });
  }, [canProceed, lastStep, setStep]);

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, [setStep]);

  const skipStep = useCallback(() => {
    if (currentStepMeta?.optional) {
      setStep((s) => Math.min(lastStep, s + 1));
      push("Étape sautée — tu pourras revenir dessus plus tard", "info");
    }
  }, [currentStepMeta, lastStep, setStep, push]);

  // ─── Raccourcis clavier ─────────────────────────────────────────────────
  // Ctrl/Cmd + → : étape suivante · Ctrl/Cmd + ← : étape précédente
  // Cmd/Ctrl + S : pas besoin (auto-save) mais on affiche un toast
  // Esc : sortir (avec confirmation)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ne pas hijacker si l'utilisateur tape dans un input/textarea
      const target = e.target as HTMLElement | null;
      const inEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      const meta = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + S → toast "déjà sauvegardé" (l'auto-save est continu)
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        push("Brouillon déjà sauvegardé automatiquement", "info");
        return;
      }

      // Ctrl/Cmd + flèches → navigation (ok même dans un input — chord explicite)
      if (meta && e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
        return;
      }
      if (meta && e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        return;
      }

      // Esc → sortir (uniquement hors champ texte)
      if (e.key === "Escape" && !inEditable) {
        if (window.confirm("Quitter la création du produit ? Le brouillon est sauvegardé.")) {
          router.push("/vendeur/produits");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, push, router]);

  // ─── Smart defaults — bouton "Suggérer" sur les champs vides ────────────
  const applySmartDefaults = useCallback(() => {
    if (!selectedType) return;
    const d = SMART_DEFAULTS[selectedType];
    let applied = 0;
    if (!shortDesc.trim()) { setShortDesc(d.shortDesc); applied++; }
    if (!description.replace(/<[^>]*>/g, "").trim()) { setDescription(d.description); applied++; }
    if (!price || price === 45000) { setPrice(d.price); applied++; }
    if (applied > 0) push(`${applied} champ${applied > 1 ? "s" : ""} pré-rempli${applied > 1 ? "s" : ""} — modifie librement`, "success");
    else push("Tous les champs sont déjà remplis", "info");
  }, [selectedType, shortDesc, description, price, setShortDesc, setDescription, setPrice, push]);

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

  // ─── Aperçu live de la page produit (drawer droit) ──────────────────────
  const livePreview = (
    <div
      className={`bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden ${
        previewMode === "mobile" ? "max-w-[340px] mx-auto" : "w-full"
      }`}
    >
      {/* Bannière */}
      <div className={`relative bg-slate-100 ${previewMode === "mobile" ? "aspect-video" : "aspect-[21/9]"}`}>
        {banner || thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner || thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}
        {selected && (
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white shadow-md"
          >
            {selected.label}
          </span>
        )}
      </div>
      <div className="p-5">
        {category && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">{category}</p>
        )}
        <h3 className="text-lg font-extrabold text-[#13241b] leading-tight">
          {title || <span className="text-slate-300">Titre du produit…</span>}
        </h3>
        {shortDesc && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{shortDesc}</p>}
        <div className="flex items-end gap-2 mt-4">
          {isFree ? (
            <p className="text-2xl font-extrabold text-emerald-600">Gratuit</p>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-[#13241b] tabular-nums">{formatFCFA(price)} FCFA</p>
              {originalPrice > price && (
                <p className="text-sm font-bold text-slate-400 line-through tabular-nums mb-0.5">{formatFCFA(originalPrice)}</p>
              )}
            </>
          )}
        </div>
        {isFormation && totalLessons > 0 && (
          <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="font-semibold">{totalLessons} leçons</span>
            <span>·</span>
            <span className="font-semibold">{totalDuration} min</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto">
        {/* ═══════════════════════════════════════════════════════════════
            ONBOARDING — première création de produit
            ═══════════════════════════════════════════════════════════════ */}
        {showOnboarding && (
          <div className="mb-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-2 border-emerald-200 p-5 md:p-6 relative">
            <button
              onClick={dismissOnboarding}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Fermer le guide"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">
                  Bienvenue · Premier produit
                </p>
                <h3 className="text-lg md:text-xl font-extrabold text-[#13241b] tracking-tight">
                  {onboardingStep === 0 && "Trois étapes pour publier en moins de 10 minutes"}
                  {onboardingStep === 1 && "Astuce 1/3 — Le brouillon est sauvegardé tout seul"}
                  {onboardingStep === 2 && "Astuce 2/3 — Active l'aperçu live à droite"}
                </h3>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                  {onboardingStep === 0 && "Choisis ton type, remplis ton contenu, fixe ton prix. À chaque étape on te dit ce qui manque pour publier. Utilise Ctrl+→ et Ctrl+← pour naviguer."}
                  {onboardingStep === 1 && "Tu peux fermer l'onglet, refresh, partir manger. Tout est conservé pendant 14 jours. Cherche le point vert qui clignote en bas — c'est ta confirmation."}
                  {onboardingStep === 2 && "Sur grand écran, clique sur \"Aperçu\" en haut à droite pour voir ta page produit telle que les acheteurs la verront. Mise à jour en temps réel."}
                </p>
                <div className="flex items-center gap-2 mt-4">
                  {onboardingStep < 2 ? (
                    <button
                      onClick={() => setOnboardingStep((s) => s + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                    >
                      Astuce suivante
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={dismissOnboarding}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                    >
                      C&apos;est parti
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={dismissOnboarding}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2 transition-colors"
                  >
                    Ne plus afficher
                  </button>
                  <div className="ml-auto flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`block h-1.5 rounded-full transition-all ${
                          i === onboardingStep ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            HERO HEADER — KAZA navy gradient + indicateur "Prêt à publier"
            ═══════════════════════════════════════════════════════════════ */}
        <header
          className="relative overflow-hidden rounded-3xl mb-8 p-7 md:p-10 text-white"
          style={{
            background:
              "linear-gradient(135deg,#006e2f,#22c55e)",
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

              {/* Indicateur "Prêt à publier" — barre de progression dynamique */}
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-200 inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Prêt à publier
                  </p>
                  <p className="text-[11px] font-bold tabular-nums text-white">{readinessPct}%</p>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-500"
                    style={{ width: `${readinessPct}%` }}
                  />
                </div>
              </div>

              <div className="inline-flex flex-wrap items-center gap-2 mt-4">
                {draftLabel && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-emerald-200">
                    <Cloud className="w-3.5 h-3.5" />
                    Brouillon sauvegardé {draftLabel}
                  </div>
                )}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-slate-200">
                  <Timer className="w-3.5 h-3.5" />
                  ~{remainingMin} min restantes
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {/* Bouton "Aperçu" — collapsible drawer en desktop */}
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                aria-pressed={showPreview}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? "Masquer aperçu" : "Aperçu live"}
              </button>

              <Link
                href="/vendeur/produits"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
                Sortir
              </Link>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            STEPPER VISUEL — cercles connectés + sous-badge "X min restantes"
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
                          ? "bg-[#006e2f] text-white border-[#006e2f]"
                          : "bg-white text-slate-400 border-slate-200"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <div className="hidden md:block">
                      <p
                        className={`text-[11px] font-bold uppercase tracking-wider leading-tight ${
                          active ? "text-[#13241b]" : done ? "text-slate-700" : "text-slate-400"
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

          {/* Bandeau bas : étape courante + estimation temps + indicateurs clavier */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#006e2f] text-white text-[10px] font-bold uppercase tracking-widest">
                <CircleDot className="w-3 h-3" />
                Étape {step}/{lastStep}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-200">
                <Timer className="w-3 h-3" />
                ~{currentStepMeta?.estMin ?? 1} min
              </span>
              {currentStepMeta?.optional && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-200">
                  Optionnel
                </span>
              )}
            </div>
            <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-500 font-medium">
              <Keyboard className="w-3.5 h-3.5" />
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">Ctrl</kbd>
                {" + "}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">→</kbd>
                {" suivant · "}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">Esc</kbd>
                {" quitter"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            CONTAINER 2 COLONNES — formulaire + preview drawer
            ═══════════════════════════════════════════════════════════════ */}
        <div className={`grid gap-6 transition-all duration-300 ${showPreview ? "lg:grid-cols-[1fr_400px]" : "grid-cols-1"}`}>
          <div
            key={step}
            className="min-w-0 transition-all duration-300 motion-safe:animate-[fadeSlide_220ms_ease-out]"
            style={{
              animation: "fadeSlide 240ms ease-out",
            }}
          >

        {/* ── STEP 1 — Type & Identité ── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#13241b] tracking-tight">
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
                      <p className={`text-base font-bold tracking-tight ${isSel ? "text-emerald-900" : "text-[#13241b]"}`}>
                        {pt.label}
                      </p>
                      <p className={`text-xs mt-1 leading-relaxed ${isSel ? "text-emerald-700" : "text-slate-500"}`}>
                        {pt.description}
                      </p>
                      <p className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${isSel ? "text-emerald-600" : "text-slate-400"}`}>
                        {pt.hint}
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
                <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#13241b] tracking-tight mb-1">Identité du produit</h3>
                    <p className="text-sm text-slate-500">Titre, catégorie, accroche et visuels.</p>
                  </div>
                  <button
                    type="button"
                    onClick={applySmartDefaults}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Suggérer des valeurs
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Colonne gauche — champs texte */}
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>Titre du produit</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ex : Maîtrisez le Marketing Digital"
                          className={`${inputClass} ${titleValid ? "pr-10" : ""}`}
                        />
                        {titleValid && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>
                      <p className={helperClass}>Soyez précis et inspirant — ce titre s&apos;affiche partout.</p>
                    </div>

                    <div>
                      <label className={labelClass}>Catégorie</label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className={`${inputClass} appearance-none cursor-pointer ${categoryValid ? "pr-10" : ""}`}
                        >
                          <option value="">Sélectionner une catégorie…</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        {categoryValid && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Description courte</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={shortDesc}
                          onChange={(e) => setShortDesc(e.target.value)}
                          placeholder={selectedType ? SMART_DEFAULTS[selectedType].shortDesc.slice(0, 60) + "…" : "Une phrase qui accroche"}
                          maxLength={150}
                          className={`${inputClass} ${shortDescValid ? "pr-10" : ""}`}
                        />
                        {shortDescValid && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>
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
            <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#13241b] tracking-tight">
                  {isFormation ? "Contenu pédagogique" : "Contenu du produit"}
                </h2>
                <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                  {isFormation
                    ? "Présentez ce que les apprenants vont apprendre, pour qui c'est fait et les prérequis."
                    : "Détaillez ce que contient votre produit, pour qui il est fait et ce qui le rend unique."}
                </p>
              </div>
              {selectedType && (
                <button
                  type="button"
                  onClick={applySmartDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Pré-remplir un modèle
                </button>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {isFormation ? "Décrivez votre formation" : "Décrivez votre produit"}
              </label>
              <div className={`rounded-xl overflow-hidden border-2 transition-all ${
                descValid
                  ? "border-emerald-300 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100"
                  : "border-slate-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100"
              }`}>
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
                  !descValid ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {!descValid && <AlertCircle className="w-3.5 h-3.5" />}
                {descValid && <CheckCircle2 className="w-3.5 h-3.5" />}
                {descTextLen} caractères
                {!descValid && " · minimum 20 requis"}
                {descValid && " · description suffisante"}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Curriculum (formations) ── */}
        {step === 3 && isFormation && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#13241b] tracking-tight">
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
                      className="flex-1 bg-transparent border-none text-base font-bold tracking-tight text-[#13241b] placeholder:text-slate-400 outline-none"
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
                  <p className="text-2xl font-extrabold tabular-nums text-[#13241b]">
                    {modules.filter((m) => m.title.trim()).length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Leçons</p>
                  <p className="text-2xl font-extrabold tabular-nums text-[#13241b]">{totalLessons}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Durée totale</p>
                  <p className="text-2xl font-extrabold tabular-nums text-[#13241b]">
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest border border-amber-200">
                Étape optionnelle
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#13241b] tracking-tight">
                Fichier téléchargeable
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {selected?.productType === "EBOOK" && "L'apprenant téléchargera ce fichier après achat."}
                {selected?.productType === "PDF" && "L'apprenant téléchargera ce PDF après achat."}
                {selected?.productType === "TEMPLATE" && "L'apprenant téléchargera ce template (ZIP recommandé)."}
                {selected?.productType === "AUDIO" && "L'apprenant téléchargera ce fichier audio."}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Vous pouvez sauter cette étape et uploader le fichier plus tard depuis l&apos;édition du produit.
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
            <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#13241b] tracking-tight">
                  Tarification
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Choisissez un prix juste pour vous et vos acheteurs. Vous touchez 90&nbsp;% du prix de vente.
                </p>
              </div>
              {selectedType && (
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedType) return;
                    setPrice(SMART_DEFAULTS[selectedType].price);
                    push(`Prix suggéré appliqué : ${formatFCFA(SMART_DEFAULTS[selectedType].price)} FCFA`, "success");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Prix suggéré
                </button>
              )}
            </div>

            {/* Toggle Gratuit / Payant */}
            <div
              className={`flex items-center justify-between gap-4 p-5 rounded-2xl border-2 mb-8 transition-colors ${
                isFree ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <p className="text-base font-bold text-[#13241b]">
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
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      min="0"
                      disabled={isFree}
                      className={`${inputClass} text-2xl font-extrabold tabular-nums py-4 ${price > 0 ? "pr-12" : ""}`}
                    />
                    {price > 0 && !isFree && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                  {!isFree && price === 0 && (
                    <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Indique un prix &gt; 0 ou active le mode gratuit
                    </p>
                  )}
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
                    "linear-gradient(135deg,#006e2f,#22c55e)",
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

            {/* ── Affiliation — opt-in vendeur ── */}
            <div className={`mt-8 p-5 rounded-2xl border-2 transition-colors ${affiliateEnabled ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-[#13241b] flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    Mettre ce produit en affiliation
                  </p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">
                    Autorisez les affiliés à promouvoir ce produit. Il apparaîtra dans leur catalogue et ils toucheront la commission ci-dessous sur chaque vente qu&apos;ils apportent. Désactivé par défaut : vous seul décidez.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAffiliateEnabled((v) => !v)}
                  className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${affiliateEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                  aria-pressed={affiliateEnabled}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${affiliateEnabled ? "left-7" : "left-0.5"}`} />
                </button>
              </div>
              {affiliateEnabled && (
                <div className="mt-4 pt-4 border-t border-emerald-200/70">
                  <label className={labelClass}>Commission affilié (% du prix)</label>
                  <div className="flex items-center gap-3 max-w-xs">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={affiliateCommissionPct}
                      onChange={(e) => setAffiliateCommissionPct(Math.max(1, Math.min(90, Number(e.target.value))))}
                      className={`${inputClass} font-extrabold tabular-nums`}
                    />
                    <span className="text-lg font-bold text-slate-500">%</span>
                  </div>
                  {!isFree && price > 0 && (
                    <p className="mt-2 text-xs text-slate-600">
                      L&apos;affilié touchera <strong className="text-emerald-700">{formatFCFA(Math.round(price * (Number(affiliateCommissionPct) || 0) / 100))} FCFA</strong> par vente.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 5 — Summary ── */}
        {step === 5 && (
          <div className="space-y-6 mb-8">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6 md:p-10">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#13241b] tracking-tight">
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
                      value: isFree ? "Gratuit" : `${formatFCFA(price)} FCFA`,
                    },
                  ].map((row) => (
                    <div key={row.label} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{row.label}</dt>
                      <dd className="text-sm font-bold text-[#13241b] break-words">{row.value}</dd>
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

          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SIDEBAR PREVIEW LIVE — drawer collapsible (lg only)
              ═══════════════════════════════════════════════════════════════ */}
          {showPreview && (
            <aside className="hidden lg:block">
              <div className="sticky top-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Aperçu live
                  </p>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
                    <button
                      onClick={() => setPreviewMode("desktop")}
                      className={`p-1.5 rounded-md transition-colors ${
                        previewMode === "desktop" ? "bg-[#006e2f] text-white" : "text-slate-400 hover:text-slate-700"
                      }`}
                      aria-label="Aperçu desktop"
                      aria-pressed={previewMode === "desktop"}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewMode("mobile")}
                      className={`p-1.5 rounded-md transition-colors ${
                        previewMode === "mobile" ? "bg-[#006e2f] text-white" : "text-slate-400 hover:text-slate-700"
                      }`}
                      aria-label="Aperçu mobile"
                      aria-pressed={previewMode === "mobile"}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {livePreview}
                <p className="text-[11px] text-slate-400 text-center px-2">
                  Cet aperçu se met à jour automatiquement à chaque modification.
                </p>
              </div>
            </aside>
          )}
        </div>
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
            {/* Bouton "Sauter pour l'instant" — uniquement étapes optionnelles, hors dernière */}
            {currentStepMeta?.optional && step < lastStep && (
              <button
                onClick={skipStep}
                className="inline-flex items-center gap-2 px-3 md:px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-800 text-xs md:text-sm font-bold hover:bg-amber-100 transition-all"
                title="Passer cette étape — tu pourras la compléter plus tard"
              >
                <SkipForward className="w-4 h-4" />
                <span className="hidden sm:inline">Sauter pour l&apos;instant</span>
              </button>
            )}

            {step < lastStep ? (
              <button
                onClick={goNext}
                disabled={!canProceed}
                title={!canProceed ? missingReason : "Continuer vers l'étape suivante"}
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

        {/* Sous-bandeau "Manque pour continuer" — visible uniquement si bloqué */}
        {!canProceed && step < lastStep && missingReason && (
          <div className="border-t border-amber-100 bg-amber-50">
            <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-2 flex items-center gap-2 text-[11px] font-semibold text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{missingReason}</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TOASTS STACK — confirmations d'étapes franchies
          ═══════════════════════════════════════════════════════════════ */}
      <div className="fixed top-6 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all motion-safe:animate-[slideInRight_220ms_ease-out] ${
              t.kind === "success"
                ? "bg-emerald-500 text-white border-emerald-600"
                : "bg-[#006e2f] text-white border-slate-700"
            }`}
            style={{ animation: "slideInRight 220ms ease-out" }}
          >
            {t.kind === "success" ? <CheckCircle2 className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Animations inline — pas de dépendance externe nécessaire */}
      <style jsx global>{`
        @keyframes fadeSlide {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Suppress unused warning if needed
void slugify;
