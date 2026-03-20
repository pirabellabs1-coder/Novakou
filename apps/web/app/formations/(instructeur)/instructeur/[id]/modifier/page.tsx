"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowLeft, Save, AlertCircle, Loader2, ChevronRight,
  Plus, Trash2, GripVertical, Play, FileText, BookOpen,
  Headphones, HelpCircle, ChevronDown, ChevronUp, Home,
} from "lucide-react";
import dynamic from "next/dynamic";
import { ImageUpload } from "@/components/ui/image-upload";

const FormationRichEditor = dynamic(
  () => import("@/components/formations/FormationRichEditor").then((m) => m.FormationRichEditor),
  { ssr: false, loading: () => <div className="h-[200px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
}

interface QuizQuestion {
  type: "CHOIX_UNIQUE" | "CHOIX_MULTIPLE" | "VRAI_FAUX" | "TEXTE_LIBRE";
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  type: "VIDEO" | "PDF" | "TEXTE" | "AUDIO" | "QUIZ";
  content?: string;
  videoUrl?: string;
  duration?: number;
  isFree: boolean;
  quiz?: {
    title: string;
    passingScore: number;
    timeLimit?: number;
    questions: QuizQuestion[];
  };
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
  expanded: boolean;
}

interface FormationData {
  id: string;
  title: string;
  shortDesc: string;
  description: string;
  thumbnail: string;
  previewVideo: string;
  price: number;
  isFree: boolean;
  level: string;
  duration: number;
  hasCertificate: boolean;
  minScore: number;
  status: string;
  categoryId: string;
  sections?: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      type: string;
      content?: string;
      videoUrl?: string;
      duration?: number;
      isFree: boolean;
      order: number;
      quiz?: {
        title: string;
        passingScore: number;
        timeLimit?: number;
        questions: QuizQuestion[];
      };
    }>;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LESSON_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  VIDEO: Play,
  PDF: FileText,
  TEXTE: BookOpen,
  AUDIO: Headphones,
  QUIZ: HelpCircle,
};

const LESSON_TYPE_LABELS: Record<string, { fr: string; en: string }> = {
  VIDEO: { fr: "Vidéo", en: "Video" },
  PDF: { fr: "PDF", en: "PDF" },
  TEXTE: { fr: "Texte", en: "Text" },
  AUDIO: { fr: "Audio", en: "Audio" },
  QUIZ: { fr: "Quiz", en: "Quiz" },
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModifierFormationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const fr = locale === "fr";

  const [formation, setFormation] = useState<FormationData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [previewVideo, setPreviewVideo] = useState("");
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [level, setLevel] = useState("TOUS_NIVEAUX");
  const [duration, setDuration] = useState(60);
  const [hasCertificate, setHasCertificate] = useState(true);
  const [minScore, setMinScore] = useState(80);
  const [categoryId, setCategoryId] = useState("");

  // ── Sections/lessons state ──────────────────────────────────────────────────
  const [sections, setSections] = useState<Section[]>([]);
  const [addingLessonInSection, setAddingLessonInSection] = useState<string | null>(null);
  const [newLessonType, setNewLessonType] = useState<Lesson["type"]>("VIDEO");

  // ── Load formation data ─────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(`/api/instructeur/formations/${id}`).then((r) => r.json()),
      fetch("/api/formations/categories").then((r) => r.json()),
    ])
      .then(([formationData, catData]) => {
        setCategories(catData.categories ?? []);

        if (formationData.formation) {
          const f: FormationData = formationData.formation;
          setFormation(f);
          setTitle(f.title || "");
          setShortDesc(f.shortDesc || "");
          setDescription(f.description || "");
          setThumbnail(f.thumbnail || "");
          setPreviewVideo(f.previewVideo || "");
          setPrice(f.price || 0);
          setIsFree(f.isFree || false);
          setLevel(f.level || "TOUS_NIVEAUX");
          setDuration(f.duration || 60);
          setHasCertificate(f.hasCertificate ?? true);
          setMinScore(f.minScore || 80);
          setCategoryId(f.categoryId || "");

          // Map API sections/lessons to local state
          if (f.sections && Array.isArray(f.sections)) {
            setSections(
              f.sections.map((s) => ({
                id: s.id || generateId(),
                title: s.title || "",
                expanded: true,
                lessons: (s.lessons || []).map((l) => ({
                  id: l.id || generateId(),
                  title: l.title || "",
                  type: (l.type as Lesson["type"]) || "VIDEO",
                  content: l.content ?? undefined,
                  videoUrl: l.videoUrl ?? undefined,
                  duration: l.duration ?? undefined,
                  isFree: l.isFree || false,
                  quiz: l.quiz ?? undefined,
                })),
              }))
            );
          }
        } else {
          setError(fr ? "Formation introuvable" : "Course not found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError(fr ? "Erreur de chargement" : "Loading error");
        setLoading(false);
      });
  }, [id, fr]);

  // ── Section helpers ─────────────────────────────────────────────────────────
  const addSection = () => {
    setSections([
      ...sections,
      {
        id: generateId(),
        title: fr ? "Nouvelle section" : "New section",
        lessons: [],
        expanded: true,
      },
    ]);
  };

  const removeSection = (sectionId: string) =>
    setSections(sections.filter((s) => s.id !== sectionId));

  const toggleSection = (sectionId: string) =>
    setSections(sections.map((s) =>
      s.id === sectionId ? { ...s, expanded: !s.expanded } : s
    ));

  const updateSection = (sectionId: string, field: "title", val: string) =>
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, [field]: val } : s)));

  // ── Lesson helpers ──────────────────────────────────────────────────────────
  const addLesson = (sectionId: string) => {
    const newLesson: Lesson = {
      id: generateId(),
      title: "",
      type: newLessonType,
      isFree: false,
      ...(newLessonType === "QUIZ"
        ? { quiz: { title: "Quiz", passingScore: 80, questions: [] } }
        : {}),
    };
    setSections(sections.map((s) =>
      s.id === sectionId ? { ...s, lessons: [...s.lessons, newLesson] } : s
    ));
    setAddingLessonInSection(null);
  };

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) =>
    setSections(sections.map((s) =>
      s.id === sectionId
        ? { ...s, lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)) }
        : s
    ));

  const removeLesson = (sectionId: string, lessonId: string) =>
    setSections(sections.map((s) =>
      s.id === sectionId
        ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
        : s
    ));

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (submitForReview = false) => {
    if (!title.trim()) {
      setError(fr ? "Le titre FR est obligatoire" : "French title is required");
      return;
    }
    if (!isFree && price < 5) {
      setError(fr ? "Le prix minimum est de 5€" : "Minimum price is 5€");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/instructeur/formations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          shortDesc,
          description,
          thumbnail,
          previewVideo,
          price: isFree ? 0 : price,
          isFree,
          level,
          duration,
          hasCertificate,
          minScore,
          categoryId: categoryId || undefined,
          status: submitForReview ? "EN_ATTENTE" : "BROUILLON",
          sections: sections.map((s, sIdx) => ({
            title: s.title,
            order: sIdx,
            lessons: s.lessons.map((l, lIdx) => ({
              title: l.title,
              type: l.type,
              videoUrl: l.videoUrl ?? null,
              content: l.content ?? null,
              duration: l.duration ?? null,
              isFree: l.isFree,
              order: lIdx,
              quiz: l.quiz ?? null,
            })),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || (fr ? "Erreur lors de la sauvegarde" : "Error saving"));
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/formations/instructeur/mes-formations");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : (fr ? "Erreur inconnue" : "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inputClasses =
    "w-full bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary";
  const sectionClasses =
    "bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl p-6 space-y-4";
  const labelClasses = "text-xs text-slate-500 dark:text-slate-400 mb-1.5 block";
  const headingClasses = "font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide";

  // ── Render states ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !formation) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <Link
          href="/formations/instructeur/mes-formations"
          className="text-primary text-sm mt-4 inline-block"
        >
          {fr ? "← Retour à mes formations" : "← Back to my courses"}
        </Link>
      </div>
    );
  }

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link
          href="/formations/instructeur/dashboard"
          className="flex items-center gap-1 hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors"
        >
          <Home className="w-3 h-3" />
          {fr ? "Accueil" : "Home"}
        </Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <Link
          href="/formations/instructeur/mes-formations"
          className="hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors"
        >
          {fr ? "Mes formations" : "My courses"}
        </Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <span className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]">
          {formation?.title || (fr ? "Modifier" : "Edit")}
        </span>
      </nav>

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link
          href="/formations/instructeur/mes-formations"
          className="text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {fr ? "Modifier la formation" : "Edit course"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {sections.length} {fr ? "section(s)" : "section(s)"} · {totalLessons} {fr ? "leçon(s)" : "lesson(s)"}
          </p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {success && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4 text-green-700 dark:text-green-400 text-sm">
          {fr
            ? "Formation sauvegardee avec succes. Redirection en cours..."
            : "Course saved successfully. Redirecting..."}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Informations de base
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={sectionClasses}>
        <h2 className={headingClasses}>{fr ? "Informations de base" : "Basic information"}</h2>

        {/* Titles */}
        <div>
          <label className={labelClasses}>{fr ? "Titre *" : "Title *"}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className={inputClasses}
          />
          <p className="text-xs text-slate-500 mt-1 text-right">{title.length}/80</p>
        </div>

        {/* Short description */}
        <div>
          <label className={labelClasses}>{fr ? "Description courte" : "Short description"}</label>
          <textarea
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            rows={3}
            maxLength={200}
            className={`${inputClasses} resize-none`}
          />
        </div>

        {/* Full description */}
        <div>
          <label className={labelClasses}>{fr ? "Description complete" : "Full description"}</label>
          <FormationRichEditor
            content={description}
            onChange={setDescription}
            placeholder={
              fr
                ? "Description detaillee de la formation..."
                : "Detailed course description..."
            }
            minHeight={200}
          />
        </div>

        {/* Category + Level + Duration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>{fr ? "Catégorie" : "Category"}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClasses}
            >
              <option value="">{fr ? "Sélectionner..." : "Select..."}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>{fr ? "Niveau" : "Level"}</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={inputClasses}
            >
              <option value="DEBUTANT">{fr ? "Débutant" : "Beginner"}</option>
              <option value="INTERMEDIAIRE">{fr ? "Intermédiaire" : "Intermediate"}</option>
              <option value="AVANCE">{fr ? "Avancé" : "Advanced"}</option>
              <option value="TOUS_NIVEAUX">{fr ? "Tous niveaux" : "All levels"}</option>
            </select>
          </div>
          <div>
            <label className={labelClasses}>{fr ? "Durée (min)" : "Duration (min)"}</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              min={10}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Médias
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={sectionClasses}>
        <h2 className={headingClasses}>{fr ? "Médias" : "Media"}</h2>

        <div>
          <label className={labelClasses}>
            {fr ? "Image de couverture (1280×720px)" : "Cover image (1280×720px)"}
          </label>
          <ImageUpload
            currentImage={thumbnail}
            onUpload={(url) => setThumbnail(url)}
            aspectRatio="aspect-video"
            placeholder={
              fr
                ? "Cliquez pour ajouter une image de couverture"
                : "Click to add a cover image"
            }
          />
        </div>

        <div>
          <label className={labelClasses}>
            {fr ? "URL vidéo de prévisualisation" : "Preview video URL"}
          </label>
          <input
            value={previewVideo}
            onChange={(e) => setPreviewVideo(e.target.value)}
            placeholder="https://youtube.com/... ou https://vimeo.com/..."
            className={inputClasses}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Prix et certification
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={sectionClasses}>
        <h2 className={headingClasses}>{fr ? "Prix et certification" : "Pricing & certificate"}</h2>

        {/* Free toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsFree(!isFree)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              isFree ? "bg-primary" : "bg-slate-200 dark:bg-border-dark"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full transition-all ${
                isFree ? "left-5" : "left-1"
              }`}
            />
          </div>
          <span className="text-sm text-slate-900 dark:text-white">
            {fr ? "Formation gratuite" : "Free course"}
          </span>
        </label>

        {!isFree && (
          <div>
            <label className={labelClasses}>{fr ? "Prix (EUR)" : "Price (EUR)"}</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              min={5}
              max={500}
              step={0.01}
              className={inputClasses}
            />
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {fr ? "Votre revenu net" : "Your net revenue"}:{" "}
              <strong>{(price * 0.7).toFixed(2)} EUR</strong> (70%)
            </p>
          </div>
        )}

        {/* Certificate toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setHasCertificate(!hasCertificate)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              hasCertificate ? "bg-primary" : "bg-slate-200 dark:bg-border-dark"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full transition-all ${
                hasCertificate ? "left-5" : "left-1"
              }`}
            />
          </div>
          <span className="text-sm text-slate-900 dark:text-white">
            {fr ? "Certificat disponible" : "Certificate available"}
          </span>
        </label>

        {hasCertificate && (
          <div>
            <label className={labelClasses}>
              {fr
                ? `Score minimum pour le certificat : ${minScore}%`
                : `Minimum score for certificate: ${minScore}%`}
            </label>
            <input
              type="range"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              min={50}
              max={100}
              step={5}
              className="w-full accent-primary"
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — Contenu du cours (Sections & Leçons)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 dark:border-border-dark">
          <div>
            <h2 className={headingClasses}>{fr ? "Contenu du cours" : "Course content"}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {sections.length} {fr ? "section(s)" : "section(s)"} · {totalLessons}{" "}
              {fr ? "leçon(s)" : "lesson(s)"}
            </p>
          </div>
          <button
            onClick={addSection}
            className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {fr ? "Ajouter une section" : "Add section"}
          </button>
        </div>

        {/* Sections list */}
        <div className="p-4 space-y-3">
          {sections.length === 0 && (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              {fr
                ? "Aucune section. Cliquez sur « Ajouter une section » pour commencer."
                : "No sections yet. Click « Add section » to get started."}
            </div>
          )}

          {sections.map((section, sIdx) => (
            <div
              key={section.id}
              className="border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-xl overflow-hidden"
            >
              {/* Section header */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 dark:bg-border-dark/30 px-4 py-3">
                <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0 cursor-grab" />

                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5 flex-shrink-0">
                  {sIdx + 1}
                </span>

                <input
                  value={section.title}
                  onChange={(e) => updateSection(section.id, "title", e.target.value)}
                  placeholder={fr ? "Titre de la section" : "Section title"}
                  className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 dark:border-border-dark text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary py-0.5"
                />

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white transition-colors"
                  >
                    {section.expanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => removeSection(section.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lessons */}
              {section.expanded && (
                <div className="px-4 py-3 space-y-2">
                  {section.lessons.length === 0 && (
                    <p className="text-xs text-slate-400 py-2 text-center">
                      {fr ? "Aucune leçon dans cette section." : "No lessons in this section."}
                    </p>
                  )}

                  {section.lessons.map((lesson, lIdx) => {
                    const Icon = LESSON_TYPE_ICONS[lesson.type] ?? BookOpen;
                    const typeLabel = fr
                      ? LESSON_TYPE_LABELS[lesson.type]?.fr
                      : LESSON_TYPE_LABELS[lesson.type]?.en;

                    return (
                      <div
                        key={lesson.id}
                        className="border border-slate-100 dark:border-border-dark/60 rounded-lg overflow-hidden"
                      >
                        {/* Lesson row */}
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-900 dark:bg-neutral-dark">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 cursor-grab" />
                          <span className="text-xs text-slate-400 w-4 flex-shrink-0">{lIdx + 1}</span>

                          {/* Type badge */}
                          <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0">
                            <Icon className="w-3 h-3" />
                            <span>{typeLabel}</span>
                          </div>

                          {/* Title input */}
                          <input
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(section.id, lesson.id, { title: e.target.value })
                            }
                            placeholder={fr ? "Titre de la leçon" : "Lesson title"}
                            className="flex-1 text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 dark:focus:border-border-dark py-0.5"
                          />

                          {/* Free badge */}
                          <button
                            onClick={() =>
                              updateLesson(section.id, lesson.id, { isFree: !lesson.isFree })
                            }
                            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 transition-colors ${
                              lesson.isFree
                                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:bg-border-dark dark:text-slate-400"
                            }`}
                          >
                            {lesson.isFree ? (fr ? "Libre" : "Free") : (fr ? "Payant" : "Paid")}
                          </button>

                          <button
                            onClick={() => removeLesson(section.id, lesson.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Lesson content fields */}
                        <div className="px-3 pb-3 pt-1 bg-slate-50 dark:bg-slate-800/50 dark:bg-border-dark/20 space-y-2">
                          {(lesson.type === "VIDEO" || lesson.type === "AUDIO") && (
                            <div>
                              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                {lesson.type === "VIDEO"
                                  ? (fr ? "URL de la vidéo" : "Video URL")
                                  : (fr ? "URL de l'audio" : "Audio URL")}
                              </label>
                              <input
                                value={lesson.videoUrl ?? ""}
                                onChange={(e) =>
                                  updateLesson(section.id, lesson.id, { videoUrl: e.target.value })
                                }
                                placeholder="https://..."
                                className="w-full text-xs bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-md px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                              />
                            </div>
                          )}

                          {lesson.type === "TEXTE" && (
                            <div>
                              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                {fr ? "Contenu de la leçon" : "Lesson content"}
                              </label>
                              <FormationRichEditor
                                content={lesson.content ?? ""}
                                onChange={(val) =>
                                  updateLesson(section.id, lesson.id, { content: val })
                                }
                                placeholder={fr ? "Contenu de la leçon..." : "Lesson content..."}
                                minHeight={120}
                              />
                            </div>
                          )}

                          {lesson.type === "PDF" && (
                            <div>
                              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                {fr ? "URL du PDF" : "PDF URL"}
                              </label>
                              <input
                                value={lesson.videoUrl ?? ""}
                                onChange={(e) =>
                                  updateLesson(section.id, lesson.id, { videoUrl: e.target.value })
                                }
                                placeholder="https://..."
                                className="w-full text-xs bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded-md px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
                              />
                            </div>
                          )}

                          {lesson.type === "QUIZ" && (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {fr
                                  ? `Quiz · ${lesson.quiz?.questions?.length ?? 0} question(s) · Score minimum : ${lesson.quiz?.passingScore ?? 80}%`
                                  : `Quiz · ${lesson.quiz?.questions?.length ?? 0} question(s) · Min score: ${lesson.quiz?.passingScore ?? 80}%`}
                              </p>
                              <div className="flex items-center gap-3">
                                <label className="text-xs text-slate-500">
                                  {fr ? "Score min :" : "Min score:"}
                                </label>
                                <input
                                  type="number"
                                  value={lesson.quiz?.passingScore ?? 80}
                                  onChange={(e) =>
                                    updateLesson(section.id, lesson.id, {
                                      quiz: {
                                        ...(lesson.quiz ?? {
                                          title: "Quiz",
                                          questions: [],
                                        }),
                                        passingScore: parseInt(e.target.value) || 80,
                                      },
                                    })
                                  }
                                  min={50}
                                  max={100}
                                  className="w-16 text-xs bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded px-2 py-1 text-slate-900 dark:text-white focus:outline-none"
                                />
                                <span className="text-xs text-slate-500">%</span>
                              </div>
                            </div>
                          )}

                          {/* Duration field for video/audio */}
                          {(lesson.type === "VIDEO" || lesson.type === "AUDIO") && (
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-slate-500">
                                {fr ? "Durée (min) :" : "Duration (min):"}
                              </label>
                              <input
                                type="number"
                                value={lesson.duration ?? ""}
                                onChange={(e) =>
                                  updateLesson(section.id, lesson.id, {
                                    duration: parseInt(e.target.value) || undefined,
                                  })
                                }
                                min={1}
                                placeholder="0"
                                className="w-16 text-xs bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark rounded px-2 py-1 text-slate-900 dark:text-white focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add lesson panel */}
                  {addingLessonInSection === section.id ? (
                    <div className="border border-primary/30 rounded-lg p-3 bg-primary/5 dark:bg-primary/10 space-y-2">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {fr ? "Type de leçon :" : "Lesson type:"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(["VIDEO", "PDF", "TEXTE", "AUDIO", "QUIZ"] as const).map((t) => {
                          const Icon = LESSON_TYPE_ICONS[t];
                          return (
                            <button
                              key={t}
                              onClick={() => setNewLessonType(t)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                newLessonType === t
                                  ? "bg-primary text-white"
                                  : "bg-white dark:bg-slate-900 dark:bg-neutral-dark border border-slate-200 dark:border-slate-700 dark:border-border-dark text-slate-700 dark:text-slate-300 hover:border-primary"
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {fr ? LESSON_TYPE_LABELS[t]?.fr : LESSON_TYPE_LABELS[t]?.en}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => addLesson(section.id)}
                          className="flex-1 bg-primary text-white text-xs py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                          {fr ? "Ajouter" : "Add"}
                        </button>
                        <button
                          onClick={() => setAddingLessonInSection(null)}
                          className="px-3 bg-slate-100 dark:bg-slate-800 dark:bg-border-dark text-slate-600 dark:text-slate-400 text-xs py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-border-dark/70 transition-colors"
                        >
                          {fr ? "Annuler" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingLessonInSection(section.id);
                        setNewLessonType("VIDEO");
                      }}
                      className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-300 dark:border-border-dark text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary py-2 rounded-lg text-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {fr ? "Ajouter une leçon" : "Add a lesson"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add section button (bottom) */}
          {sections.length > 0 && (
            <button
              onClick={addSection}
              className="w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-300 dark:border-border-dark text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary py-3 rounded-xl text-sm transition-colors mt-2"
            >
              <Plus className="w-4 h-4" />
              {fr ? "Ajouter une section" : "Add a section"}
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Actions
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-8">
        <Link
          href="/formations/instructeur/mes-formations"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-white px-4 py-2 rounded-lg transition-colors"
        >
          {fr ? "Annuler" : "Cancel"}
        </Link>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 dark:bg-border-dark hover:bg-slate-200 dark:hover:bg-border-dark/70 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {fr ? "Sauvegarder brouillon" : "Save draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || !title}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {fr ? "Soumettre pour modération" : "Submit for review"}
        </button>
      </div>
    </div>
  );
}
