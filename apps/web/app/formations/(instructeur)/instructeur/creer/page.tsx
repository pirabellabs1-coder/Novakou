"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Check, BookOpen, Image, DollarSign,
  Layout, Send, Plus, Trash2, GripVertical, Play, FileText, Headphones,
  HelpCircle, X, ChevronDown, ChevronUp, Upload, Clock,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import dynamic from "next/dynamic";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const FormationRichEditor = dynamic(
  () => import("@/components/formations/FormationRichEditor").then((m) => m.FormationRichEditor),
  { ssr: false, loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" /> }
);

interface Category {
  id: string;
  nameFr: string;
  nameEn: string;
}

interface LearningPoint { fr: string; en: string }
interface Prerequisite { fr: string; en: string }

interface QuizQuestion {
  type: "CHOIX_UNIQUE" | "CHOIX_MULTIPLE" | "VRAI_FAUX" | "TEXTE_LIBRE";
  textFr: string;
  textEn: string;
  options: { fr: string; en: string }[];
  correctAnswer: string;
  explanationFr: string;
}

interface VideoChapter {
  title: string;
  timestamp: number; // seconds
}

interface Lesson {
  id: string;
  titleFr: string;
  titleEn: string;
  type: "VIDEO" | "PDF" | "TEXTE" | "AUDIO" | "QUIZ";
  content?: string;
  videoUrl?: string;
  duration?: number;
  isFree: boolean;
  subtitleUrl?: string;
  subtitleStoragePath?: string;
  subtitleLabel?: string;
  chapters?: VideoChapter[];
  quiz?: {
    titleFr: string;
    titleEn: string;
    passingScore: number;
    timeLimit?: number;
    questions: QuizQuestion[];
  };
}

interface Section {
  id: string;
  titleFr: string;
  titleEn: string;
  lessons: Lesson[];
  expanded: boolean;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { num: 1, label: "Informations" },
  { num: 2, label: "Médias" },
  { num: 3, label: "Prix" },
  { num: 4, label: "Curriculum" },
  { num: 5, label: "Publication" },
] as { num: number; label: string }[];

const LESSON_TYPES = [
  { value: "VIDEO", label: "Vidéo", icon: Play },
  { value: "PDF", label: "PDF", icon: FileText },
  { value: "TEXTE", label: "Texte", icon: BookOpen },
  { value: "AUDIO", label: "Audio", icon: Headphones },
  { value: "QUIZ", label: "Quiz", icon: HelpCircle },
] as const;

const generateId = () => Math.random().toString(36).substring(2, 9);

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTimestamp(str: string): number {
  const parts = str.split(":").map(Number);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  return 0;
}

// Sortable section wrapper
function SortableSectionItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div data-drag-handle {...listeners} className="absolute left-2 top-4 cursor-grab active:cursor-grabbing z-10">
        <GripVertical className="w-4 h-4 text-slate-600" />
      </div>
      {children}
    </div>
  );
}

// Sortable lesson wrapper
function SortableLessonItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div data-drag-handle {...listeners} className="absolute left-1 top-3 cursor-grab active:cursor-grabbing z-10">
        <GripVertical className="w-3.5 h-3.5 text-slate-600" />
      </div>
      {children}
    </div>
  );
}

export default function CreateFormationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [formationId, setFormationId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Step 1 - Informations
  const [titleFr, setTitleFr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descFr, setDescFr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [shortDescFr, setShortDescFr] = useState("");
  const [shortDescEn, setShortDescEn] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("TOUS_NIVEAUX");
  const [duration, setDuration] = useState(60);

  // Step 2 - Médias
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [learningPoints, setLearningPoints] = useState<LearningPoint[]>([
    { fr: "", en: "" }, { fr: "", en: "" }, { fr: "", en: "" }, { fr: "", en: "" },
  ]);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([{ fr: "", en: "" }]);

  // Step 3 - Prix
  const [price, setPrice] = useState(29);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [maxStudents, setMaxStudents] = useState<number | null>(null);
  const [hasMaxStudents, setHasMaxStudents] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(true);
  const [minScore, setMinScore] = useState(80);

  // Step 4 - Curriculum
  const [sections, setSections] = useState<Section[]>([
    { id: generateId(), titleFr: "Introduction", titleEn: "Introduction", lessons: [], expanded: true },
  ]);
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [newLessonType, setNewLessonType] = useState<Lesson["type"]>("VIDEO");

  // CSV import state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ sections: Section[]; stats: { sectionsCount: number; lessonsCount: number } } | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetch("/api/formations/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  // Auto-save as draft
  const saveDraft = async (data: Record<string, unknown>) => {
    const url = formationId
      ? `/api/instructeur/formations/${formationId}`
      : "/api/instructeur/formations";
    const method = formationId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: "BROUILLON" }),
    });
    const d = await res.json();
    if (d.formation?.id && !formationId) setFormationId(d.formation.id);
  };

  const handleNext = async () => {
    if (step < 5) {
      setSaving(true);
      await saveDraft(buildPayload());
      setSaving(false);
      setStep((step + 1) as Step);
    }
  };

  const buildPayload = () => ({
    titleFr, titleEn, descriptionFr: descFr, descriptionEn: descEn, descriptionFormat: "tiptap",
    shortDescriptionFr: shortDescFr, shortDescriptionEn: shortDescEn,
    categoryId, level, duration,
    thumbnail: thumbnailUrl, previewVideo: previewVideoUrl,
    learningPointsFr: learningPoints.map((lp) => lp.fr).filter(Boolean),
    learningPointsEn: learningPoints.map((lp) => lp.en).filter(Boolean),
    prerequisitesFr: prerequisites.map((p) => p.fr).filter(Boolean),
    prerequisitesEn: prerequisites.map((p) => p.en).filter(Boolean),
    price: isFree ? 0 : price, originalPrice: originalPrice || null, isFree,
    maxStudents: hasMaxStudents ? maxStudents : null,
    hasCertificate, minScore,
    sections: sections.map((s, sIdx) => ({
      titleFr: s.titleFr, titleEn: s.titleEn, order: sIdx,
      lessons: s.lessons.map((l, lIdx) => ({
        titleFr: l.titleFr, titleEn: l.titleEn, type: l.type,
        videoUrl: l.videoUrl, content: l.content, duration: l.duration,
        isFree: l.isFree, order: lIdx, quiz: l.quiz,
        subtitleUrl: l.subtitleUrl, subtitleStoragePath: l.subtitleStoragePath,
        subtitleLabel: l.subtitleLabel,
        chapters: l.chapters && l.chapters.length > 0 ? l.chapters : null,
      })),
    })),
  });

  const publish = async () => {
    setSaving(true);
    await saveDraft({ ...buildPayload(), status: "EN_ATTENTE" });
    setSaving(false);
    router.push("/formations/instructeur/mes-formations");
  };

  // Section / Lesson management
  const addSection = () => {
    setSections([...sections, {
      id: generateId(), titleFr: "Nouvelle section", titleEn: "New section",
      lessons: [], expanded: true,
    }]);
  };

  const removeSection = (id: string) => setSections(sections.filter((s) => s.id !== id));

  const toggleSection = (id: string) => setSections(sections.map((s) =>
    s.id === id ? { ...s, expanded: !s.expanded } : s
  ));

  const updateSection = (id: string, field: "titleFr" | "titleEn", val: string) =>
    setSections(sections.map((s) => s.id === id ? { ...s, [field]: val } : s));

  const addLesson = (sectionId: string) => {
    const newLesson: Lesson = {
      id: generateId(), titleFr: "", titleEn: "", type: newLessonType, isFree: false,
      ...(newLessonType === "QUIZ" ? {
        quiz: {
          titleFr: "Quiz", titleEn: "Quiz", passingScore: 80,
          questions: [],
        },
      } : {}),
    };
    setSections(sections.map((s) =>
      s.id === sectionId ? { ...s, lessons: [...s.lessons, newLesson] } : s
    ));
    setAddingLesson(null);
  };

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) =>
    setSections(sections.map((s) =>
      s.id === sectionId ? {
        ...s, lessons: s.lessons.map((l) => l.id === lessonId ? { ...l, ...updates } : l),
      } : s
    ));

  const removeLesson = (sectionId: string, lessonId: string) =>
    setSections(sections.map((s) =>
      s.id === sectionId ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) } : s
    ));

  const addQuizQuestion = (sectionId: string, lessonId: string) => {
    const newQ: QuizQuestion = {
      type: "CHOIX_UNIQUE", textFr: "", textEn: "",
      options: [{ fr: "", en: "" }, { fr: "", en: "" }, { fr: "", en: "" }, { fr: "", en: "" }],
      correctAnswer: "0", explanationFr: "",
    };
    setSections(sections.map((s) =>
      s.id === sectionId ? {
        ...s, lessons: s.lessons.map((l) =>
          l.id === lessonId && l.quiz ? {
            ...l, quiz: { ...l.quiz, questions: [...l.quiz.questions, newQ] },
          } : l
        ),
      } : s
    ));
  };

  // Section drag-and-drop
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setSections(arrayMove(sections, oldIndex, newIndex));
    }
  };

  // Lesson drag-and-drop within a section
  const handleLessonDragEnd = (sectionId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections(sections.map((s) => {
      if (s.id !== sectionId) return s;
      const oldIndex = s.lessons.findIndex((l) => l.id === active.id);
      const newIndex = s.lessons.findIndex((l) => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return s;
      return { ...s, lessons: arrayMove(s.lessons, oldIndex, newIndex) };
    }));
  };

  // CSV import handlers
  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvImporting(true);
    setCsvErrors([]);
    setCsvPreview(null);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await fetch("/api/instructeur/formations/import-csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setCsvErrors(data.details ?? [data.error]);
      } else {
        const importedSections: Section[] = data.sections.map((s: { titleFr: string; titleEn: string; lessons: { titleFr: string; titleEn: string; type: string; videoUrl: string; duration: number; isFree: boolean }[] }) => ({
          id: generateId(),
          titleFr: s.titleFr,
          titleEn: s.titleEn,
          expanded: true,
          lessons: s.lessons.map((l: { titleFr: string; titleEn: string; type: string; videoUrl: string; duration: number; isFree: boolean }) => ({
            id: generateId(),
            titleFr: l.titleFr,
            titleEn: l.titleEn,
            type: l.type as Lesson["type"],
            videoUrl: l.videoUrl || undefined,
            duration: l.duration || undefined,
            isFree: l.isFree,
            ...(l.type === "QUIZ" ? { quiz: { titleFr: "Quiz", titleEn: "Quiz", passingScore: 80, questions: [] } } : {}),
          })),
        }));
        setCsvPreview({ sections: importedSections, stats: data.stats });
      }
    } catch {
      setCsvErrors(["Erreur réseau"]);
    }
    setCsvImporting(false);
  };

  const applyCsvImport = () => {
    if (!csvPreview) return;
    setSections(csvPreview.sections);
    setShowCsvImport(false);
    setCsvFile(null);
    setCsvPreview(null);
    setCsvErrors([]);
  };

  // Subtitle upload handler (SRT → VTT conversion done server-side or client-side)
  const handleSubtitleUpload = (sectionId: string, lessonId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      let content = reader.result as string;
      // Convert SRT to VTT if needed
      if (file.name.toLowerCase().endsWith(".srt")) {
        content = "WEBVTT\n\n" + content
          .replace(/\r\n/g, "\n")
          .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, "$1:$2:$3.$4");
      }
      // Create a blob URL for preview
      const blob = new Blob([content], { type: "text/vtt" });
      const url = URL.createObjectURL(blob);
      updateLesson(sectionId, lessonId, {
        subtitleUrl: url,
        subtitleLabel: file.name.replace(/\.(vtt|srt)$/i, ""),
      });
    };
    reader.readAsText(file);
  };

  // Checklist for step 5
  const checklist = [
    { label: "Titre FR + EN renseignés", ok: !!(titleFr && titleEn) },
    { label: "Description complète", ok: !!(descFr && descEn) },
    { label: "Image de couverture", ok: !!thumbnailUrl },
    { label: "Au moins 3 sections", ok: sections.length >= 3 },
    { label: "Au moins 5 leçons", ok: sections.reduce((acc, s) => acc + s.lessons.length, 0) >= 5 },
    { label: "Prix défini", ok: isFree || price > 0 },
    { label: "Catégorie sélectionnée", ok: !!categoryId },
  ];

  const allChecked = checklist.every((c) => c.ok);

  return (
    <div className="flex min-h-screen bg-neutral-900">
      {/* Sidebar steps */}
      <div className="w-56 bg-neutral-dark border-r border-border-dark flex-shrink-0 p-6">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-semibold text-white text-sm">Créer une formation</span>
        </div>
        <div className="space-y-1">
          {STEPS.map((s) => (
            <button
              key={s.num}
              onClick={() => step > s.num || formationId ? setStep(s.num as Step) : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                step === s.num
                  ? "bg-primary/10 text-primary font-medium"
                  : step > s.num
                  ? "text-green-400 hover:bg-border-dark/50 cursor-pointer"
                  : "text-slate-500 cursor-default"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step > s.num ? "bg-green-500/20 text-green-400" : step === s.num ? "bg-primary/20 text-primary" : "bg-border-dark text-slate-500"
              }`}>
                {step > s.num ? <Check className="w-3 h-3" /> : s.num}
              </div>
              {s.label}
            </button>
          ))}
        </div>
        {saving && (
          <p className="text-xs text-slate-500 mt-6 text-center">Sauvegarde...</p>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">

          {/* STEP 1 — Informations */}
          {step === 1 && (
            <div className="space-y-6">
              <h1 className="text-xl font-bold text-white">Informations de base</h1>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Titre FR * (max 80 car.)</label>
                  <input
                    value={titleFr}
                    onChange={(e) => setTitleFr(e.target.value)}
                    maxLength={80}
                    className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Titre de la formation en français"
                  />
                  <p className="text-xs text-slate-600 mt-1 text-right">{titleFr.length}/80</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Title EN * (max 80)</label>
                  <input
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    maxLength={80}
                    className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Course title in English"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Description courte FR (max 200)</label>
                  <textarea
                    value={shortDescFr}
                    onChange={(e) => setShortDescFr(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Description courte visible dans les cards"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Short description EN (max 200)</label>
                  <textarea
                    value={shortDescEn}
                    onChange={(e) => setShortDescEn(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Short description visible in cards"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description complète FR</label>
                <FormationRichEditor
                  content={descFr}
                  onChange={setDescFr}
                  placeholder="Description détaillée de la formation..."
                  minHeight={250}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Full description EN</label>
                <FormationRichEditor
                  content={descEn}
                  onChange={setDescEn}
                  placeholder="Full course description..."
                  minHeight={250}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Catégorie *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameFr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Niveau</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="TOUS_NIVEAUX">Tous niveaux</option>
                    <option value="DEBUTANT">Débutant</option>
                    <option value="INTERMEDIAIRE">Intermédiaire</option>
                    <option value="AVANCE">Avancé</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Durée estimée (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    min={10}
                    className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Médias */}
          {step === 2 && (
            <div className="space-y-6">
              <h1 className="text-xl font-bold text-white">Médias & contenu</h1>

              <div>
                <label className="text-xs text-slate-400 mb-2 block">Image de couverture (1280×720px)</label>
                <ImageUpload
                  currentImage={thumbnailUrl}
                  onUpload={(url) => setThumbnailUrl(url)}
                  aspectRatio="aspect-video"
                  placeholder="Cliquez pour ajouter une image de couverture"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">URL vidéo de prévisualisation (YouTube ou Vimeo)</label>
                <input
                  value={previewVideoUrl}
                  onChange={(e) => setPreviewVideoUrl(e.target.value)}
                  className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              {/* Learning points */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Ce que vous apprendrez (min 4 points)</label>
                <div className="space-y-2">
                  {learningPoints.map((lp, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex-shrink-0 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-400" />
                      </div>
                      <input
                        value={lp.fr}
                        onChange={(e) => {
                          const updated = [...learningPoints];
                          updated[i] = { ...updated[i], fr: e.target.value };
                          setLearningPoints(updated);
                        }}
                        className="flex-1 bg-neutral-dark border border-border-dark rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={`Point ${i + 1} (FR)`}
                      />
                      <input
                        value={lp.en}
                        onChange={(e) => {
                          const updated = [...learningPoints];
                          updated[i] = { ...updated[i], en: e.target.value };
                          setLearningPoints(updated);
                        }}
                        className="flex-1 bg-neutral-dark border border-border-dark rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={`Point ${i + 1} (EN)`}
                      />
                      {learningPoints.length > 4 && (
                        <button onClick={() => setLearningPoints(learningPoints.filter((_, j) => j !== i))}>
                          <X className="w-4 h-4 text-slate-500 hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {learningPoints.length < 8 && (
                  <button
                    onClick={() => setLearningPoints([...learningPoints, { fr: "", en: "" }])}
                    className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Ajouter un point
                  </button>
                )}
              </div>

              {/* Prerequisites */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Prérequis</label>
                <div className="space-y-2">
                  {prerequisites.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={p.fr}
                        onChange={(e) => {
                          const updated = [...prerequisites];
                          updated[i] = { ...updated[i], fr: e.target.value };
                          setPrerequisites(updated);
                        }}
                        className="flex-1 bg-neutral-dark border border-border-dark rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Prérequis (FR)"
                      />
                      <input
                        value={p.en}
                        onChange={(e) => {
                          const updated = [...prerequisites];
                          updated[i] = { ...updated[i], en: e.target.value };
                          setPrerequisites(updated);
                        }}
                        className="flex-1 bg-neutral-dark border border-border-dark rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Prerequisite (EN)"
                      />
                      {prerequisites.length > 1 && (
                        <button onClick={() => setPrerequisites(prerequisites.filter((_, j) => j !== i))}>
                          <X className="w-4 h-4 text-slate-500 hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setPrerequisites([...prerequisites, { fr: "", en: "" }])}
                  className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Ajouter un prérequis
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Prix */}
          {step === 3 && (
            <div className="space-y-6">
              <h1 className="text-xl font-bold text-white">Prix & certificat</h1>

              {/* Free toggle */}
              <div className="flex items-center justify-between bg-neutral-dark border border-border-dark rounded-xl p-4">
                <div>
                  <p className="text-white font-medium text-sm">Formation gratuite</p>
                  <p className="text-xs text-slate-400">Accessible sans paiement</p>
                </div>
                <button
                  onClick={() => setIsFree(!isFree)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isFree ? "bg-primary" : "bg-border-dark"}`}
                >
                  <div className={`w-5 h-5 bg-white dark:bg-slate-900 rounded-full absolute top-0.5 transition-transform ${isFree ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              {!isFree && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Prix (EUR) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        min={5}
                        max={500}
                        className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Prix original (promo)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
                        min={0}
                        className="w-full bg-neutral-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue preview */}
              {!isFree && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Prix de vente :</span>
                    <span className="text-white font-medium">{price.toFixed(0)}€</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 mt-1">
                    <span>Commission FreelanceHigh (30%) :</span>
                    <span className="text-red-400">-{(price * 0.3).toFixed(0)}€</span>
                  </div>
                  <div className="flex items-center justify-between font-bold mt-2 pt-2 border-t border-primary/20">
                    <span className="text-white">Votre revenu net (70%) :</span>
                    <span className="text-green-400">{(price * 0.7).toFixed(0)}€</span>
                  </div>
                </div>
              )}

              {/* Max students */}
              <div>
                <div className="flex items-center justify-between bg-neutral-dark border border-border-dark rounded-xl p-4">
                  <div>
                    <p className="text-white font-medium text-sm">Limiter le nombre d&apos;étudiants</p>
                    <p className="text-xs text-slate-400">Crée un effet d&apos;urgence et motive l&apos;achat</p>
                  </div>
                  <button
                    onClick={() => { setHasMaxStudents(!hasMaxStudents); if (!hasMaxStudents) setMaxStudents(100); }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${hasMaxStudents ? "bg-primary" : "bg-border-dark"}`}
                  >
                    <div className={`w-5 h-5 bg-white dark:bg-slate-900 rounded-full absolute top-0.5 transition-transform ${hasMaxStudents ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {hasMaxStudents && (
                  <div className="mt-3 bg-neutral-dark border border-border-dark rounded-xl p-4">
                    <label className="text-xs text-slate-400 mb-2 block">Nombre maximum d&apos;étudiants</label>
                    <input
                      type="number"
                      value={maxStudents ?? 100}
                      onChange={(e) => setMaxStudents(parseInt(e.target.value) || null)}
                      min={1}
                      max={10000}
                      className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* Certificate */}
              <div>
                <div className="flex items-center justify-between bg-neutral-dark border border-border-dark rounded-xl p-4">
                  <div>
                    <p className="text-white font-medium text-sm">Certificat d&apos;accomplissement</p>
                    <p className="text-xs text-slate-400">Délivré automatiquement à la complétion</p>
                  </div>
                  <button
                    onClick={() => setHasCertificate(!hasCertificate)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${hasCertificate ? "bg-primary" : "bg-border-dark"}`}
                  >
                    <div className={`w-5 h-5 bg-white dark:bg-slate-900 rounded-full absolute top-0.5 transition-transform ${hasCertificate ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {hasCertificate && (
                  <div className="mt-3 bg-neutral-dark border border-border-dark rounded-xl p-4">
                    <label className="text-xs text-slate-400 mb-2 block">Score minimum pour obtenir le certificat</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        value={minScore}
                        onChange={(e) => setMinScore(parseInt(e.target.value))}
                        min={50}
                        max={100}
                        step={5}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-white font-bold text-lg w-12 text-right">{minScore}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Refund policy */}
              <div className="bg-neutral-dark border border-border-dark rounded-xl p-4 text-sm text-slate-400">
                <p className="text-white font-medium mb-1">Politique de remboursement</p>
                <p>✅ Satisfait ou remboursé 30 jours — Appliqué automatiquement à toutes les formations FreelanceHigh.</p>
              </div>
            </div>
          )}

          {/* STEP 4 — Curriculum */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">Curriculum</h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCsvImport(true)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-border-dark hover:border-primary/50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Importer CSV
                  </button>
                  <span className="text-xs text-slate-400">
                    {sections.length} section{sections.length > 1 ? "s" : ""} ·{" "}
                    {sections.reduce((acc, s) => acc + s.lessons.length, 0)} leçon{sections.reduce((acc, s) => acc + s.lessons.length, 0) > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* CSV Import Modal */}
              {showCsvImport && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCsvImport(false)}>
                  <div className="bg-neutral-dark border border-border-dark rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-white">Importer un curriculum CSV</h2>
                      <button onClick={() => setShowCsvImport(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Importez vos sections et leçons depuis un fichier CSV.{" "}
                      <a href="/api/instructeur/formations/csv-template" className="text-primary hover:underline" download>
                        Télécharger le modèle
                      </a>
                    </p>
                    <div className="border-2 border-dashed border-border-dark hover:border-primary/40 rounded-xl p-6 text-center transition-colors">
                      <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => { setCsvFile(e.target.files?.[0] ?? null); setCsvPreview(null); setCsvErrors([]); }}
                      />
                      <button onClick={() => csvInputRef.current?.click()} className="text-sm text-slate-300 hover:text-white">
                        {csvFile ? csvFile.name : "Choisir un fichier CSV"}
                      </button>
                    </div>
                    {csvFile && !csvPreview && (
                      <button onClick={handleCsvUpload} disabled={csvImporting} className="w-full bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50">
                        {csvImporting ? "Analyse en cours..." : "Analyser le fichier"}
                      </button>
                    )}
                    {csvErrors.length > 0 && (
                      <div className="bg-red-900/20 border border-red-900/30 rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
                        {csvErrors.map((err, i) => (
                          <p key={i} className="text-xs text-red-400">{err}</p>
                        ))}
                      </div>
                    )}
                    {csvPreview && (
                      <div className="space-y-3">
                        <div className="bg-green-900/20 border border-green-900/30 rounded-xl p-3">
                          <p className="text-sm text-green-400 font-medium">
                            {csvPreview.stats.sectionsCount} sections, {csvPreview.stats.lessonsCount} leçons détectées
                          </p>
                          <p className="text-xs text-slate-400 mt-1">Cela remplacera le curriculum actuel.</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setShowCsvImport(false); setCsvFile(null); setCsvPreview(null); }} className="flex-1 border border-border-dark text-slate-300 py-2 rounded-xl hover:bg-border-dark/50">Annuler</button>
                          <button onClick={applyCsvImport} className="flex-1 bg-primary text-white py-2 rounded-xl font-medium hover:bg-primary/90">Appliquer</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sections with DnD */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {sections.map((section) => (
                    <SortableSectionItem key={section.id} id={section.id}>
                      <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden relative pl-6">
                        {/* Section header */}
                        <div className="flex items-center gap-3 p-4 border-b border-border-dark">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              value={section.titleFr}
                              onChange={(e) => updateSection(section.id, "titleFr", e.target.value)}
                              className="bg-border-dark border border-border-dark/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Titre section FR"
                            />
                            <input
                              value={section.titleEn}
                              onChange={(e) => updateSection(section.id, "titleEn", e.target.value)}
                              className="bg-border-dark border border-border-dark/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Section title EN"
                            />
                          </div>
                          <button onClick={() => toggleSection(section.id)} className="text-slate-400 hover:text-white">
                            {section.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {sections.length > 1 && (
                            <button onClick={() => removeSection(section.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Lessons with DnD */}
                        {section.expanded && (
                          <div className="p-4 space-y-3">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleLessonDragEnd(section.id, event)}>
                              <SortableContext items={section.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                                {section.lessons.map((lesson) => {
                                  const TypeIcon = LESSON_TYPES.find((t) => t.value === lesson.type)?.icon ?? Play;
                                  return (
                                    <SortableLessonItem key={lesson.id} id={lesson.id}>
                                      <div className="bg-border-dark/30 border border-border-dark/50 rounded-xl p-3 relative pl-6">
                                        <div className="flex items-center gap-3 mb-2">
                                          <TypeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                          <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input
                                              value={lesson.titleFr}
                                              onChange={(e) => updateLesson(section.id, lesson.id, { titleFr: e.target.value })}
                                              className="bg-neutral-dark border border-border-dark/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                              placeholder="Titre leçon FR"
                                            />
                                            <input
                                              value={lesson.titleEn}
                                              onChange={(e) => updateLesson(section.id, lesson.id, { titleEn: e.target.value })}
                                              className="bg-neutral-dark border border-border-dark/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                              placeholder="Lesson title EN"
                                            />
                                          </div>
                                          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={lesson.isFree}
                                              onChange={(e) => updateLesson(section.id, lesson.id, { isFree: e.target.checked })}
                                              className="accent-primary"
                                            />
                                            Gratuite
                                          </label>
                                          <button onClick={() => removeLesson(section.id, lesson.id)} className="text-slate-500 hover:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        {/* VIDEO fields */}
                                        {lesson.type === "VIDEO" && (
                                          <div className="space-y-2">
                                            <input
                                              value={lesson.videoUrl ?? ""}
                                              onChange={(e) => updateLesson(section.id, lesson.id, { videoUrl: e.target.value })}
                                              className="w-full bg-neutral-dark border border-border-dark/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                              placeholder="URL YouTube/Vimeo ou lien vidéo"
                                            />

                                            {/* Subtitles upload */}
                                            <div className="flex items-center gap-2">
                                              <label className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer border border-border-dark/60 rounded-lg px-2.5 py-1.5 hover:border-primary/40 transition-colors">
                                                <FileText className="w-3.5 h-3.5" />
                                                {lesson.subtitleUrl ? (lesson.subtitleLabel || "Sous-titres") : "Sous-titres (.vtt/.srt)"}
                                                <input
                                                  type="file"
                                                  accept=".vtt,.srt"
                                                  className="hidden"
                                                  onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleSubtitleUpload(section.id, lesson.id, file);
                                                  }}
                                                />
                                              </label>
                                              {lesson.subtitleUrl && (
                                                <button
                                                  onClick={() => updateLesson(section.id, lesson.id, { subtitleUrl: undefined, subtitleLabel: undefined })}
                                                  className="text-xs text-red-400 hover:text-red-300"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>

                                            {/* Chapters */}
                                            <div className="space-y-1.5">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Chapitres</span>
                                                <button
                                                  onClick={() => updateLesson(section.id, lesson.id, {
                                                    chapters: [...(lesson.chapters ?? []), { title: "", timestamp: 0 }],
                                                  })}
                                                  className="text-[10px] text-primary hover:text-primary/80"
                                                >
                                                  + Ajouter
                                                </button>
                                              </div>
                                              {lesson.chapters?.map((ch, chIdx) => (
                                                <div key={chIdx} className="flex items-center gap-2">
                                                  <input
                                                    value={formatTimestamp(ch.timestamp)}
                                                    onChange={(e) => {
                                                      const newChapters = [...(lesson.chapters ?? [])];
                                                      newChapters[chIdx] = { ...ch, timestamp: parseTimestamp(e.target.value) };
                                                      updateLesson(section.id, lesson.id, { chapters: newChapters });
                                                    }}
                                                    className="w-16 bg-neutral-dark border border-border-dark/60 rounded px-2 py-1 text-[10px] text-white text-center tabular-nums"
                                                    placeholder="0:00"
                                                  />
                                                  <input
                                                    value={ch.title}
                                                    onChange={(e) => {
                                                      const newChapters = [...(lesson.chapters ?? [])];
                                                      newChapters[chIdx] = { ...ch, title: e.target.value };
                                                      updateLesson(section.id, lesson.id, { chapters: newChapters });
                                                    }}
                                                    className="flex-1 bg-neutral-dark border border-border-dark/60 rounded px-2 py-1 text-[10px] text-white"
                                                    placeholder="Nom du chapitre"
                                                  />
                                                  <button
                                                    onClick={() => {
                                                      const newChapters = (lesson.chapters ?? []).filter((_, i) => i !== chIdx);
                                                      updateLesson(section.id, lesson.id, { chapters: newChapters });
                                                    }}
                                                    className="text-slate-500 hover:text-red-400"
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {lesson.type === "TEXTE" && (
                                          <FormationRichEditor
                                            content={lesson.content ?? ""}
                                            onChange={(html) => updateLesson(section.id, lesson.id, { content: html })}
                                            placeholder="Contenu texte de la leçon..."
                                            minHeight={150}
                                          />
                                        )}

                                        {/* Quiz questions builder */}
                                        {lesson.type === "QUIZ" && lesson.quiz && (
                              <div className="mt-2 space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-slate-400">Score passage :</span>
                                  <input
                                    type="number"
                                    value={lesson.quiz.passingScore}
                                    onChange={(e) => updateLesson(section.id, lesson.id, {
                                      quiz: { ...lesson.quiz!, passingScore: parseInt(e.target.value) || 80 },
                                    })}
                                    min={50}
                                    max={100}
                                    className="w-16 bg-neutral-dark border border-border-dark/60 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                                  />
                                  <span className="text-xs text-slate-400">%</span>
                                </div>

                                {lesson.quiz.questions.map((q, qIdx) => (
                                  <div key={qIdx} className="bg-neutral-900/50 rounded-xl p-3 text-xs">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-slate-500">Q{qIdx + 1}</span>
                                      <select
                                        value={q.type}
                                        onChange={(e) => {
                                          const updatedQ = { ...q, type: e.target.value as QuizQuestion["type"] };
                                          const updatedQuiz = { ...lesson.quiz!, questions: lesson.quiz!.questions.map((qq, i) => i === qIdx ? updatedQ : qq) };
                                          updateLesson(section.id, lesson.id, { quiz: updatedQuiz });
                                        }}
                                        className="bg-neutral-dark border border-border-dark/60 rounded-lg px-2 py-1 text-xs text-white"
                                      >
                                        <option value="CHOIX_UNIQUE">Choix unique</option>
                                        <option value="CHOIX_MULTIPLE">Choix multiple</option>
                                        <option value="VRAI_FAUX">Vrai/Faux</option>
                                        <option value="TEXTE_LIBRE">Texte libre</option>
                                      </select>
                                    </div>
                                    <input
                                      value={q.textFr}
                                      onChange={(e) => {
                                        const updatedQ = { ...q, textFr: e.target.value };
                                        const updatedQuiz = { ...lesson.quiz!, questions: lesson.quiz!.questions.map((qq, i) => i === qIdx ? updatedQ : qq) };
                                        updateLesson(section.id, lesson.id, { quiz: updatedQuiz });
                                      }}
                                      className="w-full bg-neutral-dark border border-border-dark/60 rounded-lg px-2 py-1 text-white mb-1"
                                      placeholder="Question (FR)"
                                    />
                                    {q.type === "CHOIX_UNIQUE" && q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2 mb-1">
                                        <input
                                          type="radio"
                                          name={`q${qIdx}-correct`}
                                          checked={q.correctAnswer === String(oIdx)}
                                          onChange={() => {
                                            const updatedQ = { ...q, correctAnswer: String(oIdx) };
                                            const updatedQuiz = { ...lesson.quiz!, questions: lesson.quiz!.questions.map((qq, i) => i === qIdx ? updatedQ : qq) };
                                            updateLesson(section.id, lesson.id, { quiz: updatedQuiz });
                                          }}
                                          className="accent-green-500"
                                        />
                                        <input
                                          value={opt.fr}
                                          onChange={(e) => {
                                            const updatedOpts = q.options.map((o, i) => i === oIdx ? { ...o, fr: e.target.value } : o);
                                            const updatedQ = { ...q, options: updatedOpts };
                                            const updatedQuiz = { ...lesson.quiz!, questions: lesson.quiz!.questions.map((qq, i) => i === qIdx ? updatedQ : qq) };
                                            updateLesson(section.id, lesson.id, { quiz: updatedQuiz });
                                          }}
                                          className="flex-1 bg-neutral-dark border border-border-dark/60 rounded px-2 py-0.5 text-white"
                                          placeholder={`Option ${oIdx + 1}`}
                                        />
                                      </div>
                                    ))}
                                    {q.type === "VRAI_FAUX" && (
                                      <div className="flex gap-3 mt-1">
                                        {["Vrai", "Faux"].map((v) => (
                                          <button
                                            key={v}
                                            onClick={() => {
                                              const updatedQ = { ...q, correctAnswer: v };
                                              const updatedQuiz = { ...lesson.quiz!, questions: lesson.quiz!.questions.map((qq, i) => i === qIdx ? updatedQ : qq) };
                                              updateLesson(section.id, lesson.id, { quiz: updatedQuiz });
                                            }}
                                            className={`px-3 py-1 rounded-lg border text-xs ${q.correctAnswer === v ? "bg-green-600 border-green-600 text-white" : "border-border-dark text-slate-400"}`}
                                          >
                                            {v}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    {q.type === "TEXTE_LIBRE" && (
                                      <input
                                        value={q.correctAnswer}
                                        onChange={(e) => {
                                          const updatedQ = { ...q, correctAnswer: e.target.value };
                                          const updatedQuiz = { ...lesson.quiz!, questions: lesson.quiz!.questions.map((qq, i) => i === qIdx ? updatedQ : qq) };
                                          updateLesson(section.id, lesson.id, { quiz: updatedQuiz });
                                        }}
                                        className="w-full bg-neutral-dark border border-border-dark/60 rounded-lg px-2 py-1 text-white mt-1"
                                        placeholder="Réponse attendue"
                                      />
                                    )}
                                  </div>
                                ))}

                                <button
                                  onClick={() => addQuizQuestion(section.id, lesson.id)}
                                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Ajouter une question
                                </button>
                              </div>
                            )}
                                      </div>
                                    </SortableLessonItem>
                                  );
                                })}
                              </SortableContext>
                            </DndContext>

                            {/* Add lesson */}
                            {addingLesson === section.id ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                {LESSON_TYPES.map((t) => {
                                  const Icon = t.icon;
                                  return (
                                    <button
                                      key={t.value}
                                      onClick={() => { setNewLessonType(t.value); addLesson(section.id); }}
                                      className="flex items-center gap-1.5 text-xs bg-border-dark hover:bg-border-dark/70 text-slate-300 px-3 py-2 rounded-lg transition-colors"
                                    >
                                      <Icon className="w-3.5 h-3.5" /> {t.label}
                                    </button>
                                  );
                                })}
                                <button onClick={() => setAddingLesson(null)} className="text-xs text-slate-500 hover:text-white px-2">Annuler</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingLesson(section.id)}
                                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white border border-dashed border-border-dark hover:border-primary/50 py-2.5 rounded-xl transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Ajouter une leçon
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </SortableSectionItem>
                  ))}
                </SortableContext>
              </DndContext>

              <button
                onClick={addSection}
                className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/40 py-3 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Ajouter une section
              </button>
            </div>
          )}

          {/* STEP 5 — Publication */}
          {step === 5 && (
            <div className="space-y-6">
              <h1 className="text-xl font-bold text-white">Publication</h1>

              {/* Checklist */}
              <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
                <h2 className="font-semibold text-white mb-4">Checklist de validation</h2>
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? "bg-green-500/20 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {item.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </div>
                      <span className={`text-sm ${item.ok ? "text-slate-300" : "text-slate-500"}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-neutral-dark border border-border-dark rounded-xl p-6 space-y-3 text-sm">
                <h2 className="font-semibold text-white">Récapitulatif</h2>
                <div className="flex justify-between text-slate-400"><span>Titre FR</span><span className="text-white truncate max-w-xs">{titleFr || "—"}</span></div>
                <div className="flex justify-between text-slate-400"><span>Catégorie</span><span className="text-white">{categories.find((c) => c.id === categoryId)?.nameFr || "—"}</span></div>
                <div className="flex justify-between text-slate-400"><span>Niveau</span><span className="text-white">{level}</span></div>
                <div className="flex justify-between text-slate-400"><span>Prix</span><span className="text-white">{isFree ? "Gratuit" : `${price}€`}</span></div>
                <div className="flex justify-between text-slate-400"><span>Sections</span><span className="text-white">{sections.length}</span></div>
                <div className="flex justify-between text-slate-400"><span>Leçons</span><span className="text-white">{sections.reduce((acc, s) => acc + s.lessons.length, 0)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Certificat</span><span className={hasCertificate ? "text-green-400" : "text-slate-500"}>{hasCertificate ? `Oui (${minScore}%)` : "Non"}</span></div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={publish}
                  disabled={!allChecked || saving}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  {saving ? "Envoi en cours..." : "Soumettre pour modération"}
                </button>
                <button
                  onClick={async () => { setSaving(true); await saveDraft(buildPayload()); setSaving(false); router.push("/formations/instructeur/mes-formations"); }}
                  className="w-full flex items-center justify-center gap-2 border border-border-dark text-slate-300 hover:text-white hover:bg-border-dark/50 font-medium py-3 rounded-xl transition-colors"
                >
                  {saving ? "Sauvegarde..." : "Sauvegarder en brouillon"}
                </button>
              </div>

              {!allChecked && (
                <p className="text-xs text-red-400 text-center">
                  Complétez tous les éléments de la checklist avant de soumettre.
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-dark">
            <button
              onClick={() => step > 1 && setStep((step - 1) as Step)}
              disabled={step === 1}
              className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>

            {step < 5 && (
              <button
                onClick={handleNext}
                disabled={saving || (step === 1 && !titleFr)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "Sauvegarde..." : "Suivant"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
