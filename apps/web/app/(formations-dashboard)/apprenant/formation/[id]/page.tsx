"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import LessonVideoPlayer from "@/components/formations/LessonVideoPlayer";

// ── Types ────────────────────────────────────────────────────────────────
interface ApiResource {
  id: string;
  name: string;
  url: string;
  fileSize: number | null;
  mimeType: string | null;
}
interface ApiLesson {
  id: string;
  title: string;
  desc: string | null;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  audioUrl: string | null;
  duration: number | null;
  order: number;
  isFree: boolean;
  type: string;
  allowDownload: boolean;
  resources: ApiResource[];
  completed: boolean;
}
interface ApiSection {
  id: string;
  title: string;
  desc: string | null;
  order: number;
  lessons: ApiLesson[];
}
interface ApiFormation {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  hasAccess: boolean;
  enrollmentId: string | null;
  progressPct: number;
  instructeur: { user: { name: string | null; image: string | null } } | null;
  sections: ApiSection[];
}

type TabType = "description" | "notes" | "ressources";

// ── Helpers ──────────────────────────────────────────────────────────────
function formatDuration(min: number | null): string {
  if (!min || min <= 0) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function resourceIcon(mime: string | null, name: string): string {
  const lower = (mime || name || "").toLowerCase();
  if (lower.includes("pdf")) return "picture_as_pdf";
  if (lower.includes("sheet") || lower.includes("excel") || /\.xlsx?$/.test(lower)) return "table_chart";
  if (lower.includes("word") || /\.docx?$/.test(lower)) return "description";
  if (lower.includes("zip") || lower.includes("archive")) return "folder_zip";
  if (lower.startsWith("image/")) return "image";
  if (lower.startsWith("video/")) return "movie";
  if (lower.startsWith("audio/")) return "headphones";
  if (lower.startsWith("http")) return "link";
  return "attach_file";
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function FormationPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: formationId } = use(params);
  const router = useRouter();

  const [formation, setFormation] = useState<ApiFormation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [marking, setMarking] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Load formation + progress ────────────────────────────────────────
  async function refresh() {
    try {
      const res = await fetch(`/api/formations/apprenant/formation/${formationId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const j = await res.json();
      const f = (j.data ?? j) as ApiFormation;
      setFormation(f);

      // Auto-expand sections containing the current lesson + first section
      if (f.sections && f.sections.length > 0) {
        setExpandedSections((prev) => {
          if (prev.size > 0) return prev;
          return new Set([f.sections[0].id]);
        });
      }

      // Auto-select first non-completed lesson, or first lesson
      if (!selectedLessonId && f.sections) {
        const allLessons = f.sections.flatMap((s) => s.lessons);
        const firstUndone = allLessons.find((l) => !l.completed);
        const target = firstUndone ?? allLessons[0];
        if (target) {
          setSelectedLessonId(target.id);
          // Make sure its section is expanded
          const sec = f.sections.find((s) => s.lessons.some((l) => l.id === target.id));
          if (sec) setExpandedSections((prev) => new Set([...prev, sec.id]));
        }
      }
    } catch (err) {
      console.error("[formation-player] load error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formationId]);

  // Load lesson note from localStorage when lesson changes
  useEffect(() => {
    if (!selectedLessonId) return;
    try {
      const saved = localStorage.getItem(`nk-note:${selectedLessonId}`);
      setNote(saved ?? "");
    } catch {
      setNote("");
    }
    setActiveTab("description");
  }, [selectedLessonId]);

  // ── Derived state ────────────────────────────────────────────────────
  const allLessons: ApiLesson[] = useMemo(() => {
    if (!formation) return [];
    return formation.sections.flatMap((s) => s.lessons);
  }, [formation]);

  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.completed).length;
  const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  const activeLesson = allLessons.find((l) => l.id === selectedLessonId) ?? null;
  const activeIndex = activeLesson ? allLessons.findIndex((l) => l.id === activeLesson.id) : -1;
  const activeSection = formation?.sections.find((s) =>
    s.lessons.some((l) => l.id === selectedLessonId),
  ) ?? null;
  const activeSectionIndex = activeSection
    ? formation!.sections.findIndex((s) => s.id === activeSection.id) + 1
    : 0;
  const activeLessonIndexInSection = activeSection && activeLesson
    ? activeSection.lessons.findIndex((l) => l.id === activeLesson.id) + 1
    : 0;

  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1
    ? allLessons[activeIndex + 1]
    : null;

  // ── Actions ──────────────────────────────────────────────────────────
  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleMarkComplete() {
    if (!activeLesson || marking) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/formations/apprenant/lessons/${activeLesson.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchedPct: 100 }),
      });
      const json = await res.json();
      if (!res.ok) {
        flashToast(json?.error || "Erreur lors du marquage");
        setMarking(false);
        return;
      }
      // Update local state immediately
      setFormation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map((s) => ({
            ...s,
            lessons: s.lessons.map((l) =>
              l.id === activeLesson.id ? { ...l, completed: true } : l,
            ),
          })),
        };
      });
      // If a certificate just got issued → toast + navigate
      if (json?.data?.certificate?.code) {
        flashToast("🎉 Félicitations ! Votre certificat vient d'être émis.");
        setTimeout(() => {
          router.push(`/certificat/${json.data.certificate.code}`);
        }, 1500);
      } else if (nextLesson) {
        flashToast("Leçon terminée ✓");
        setSelectedLessonId(nextLesson.id);
      } else {
        flashToast("Leçon terminée ✓");
      }
    } catch (err) {
      console.error(err);
      flashToast("Erreur réseau");
    } finally {
      setMarking(false);
    }
  }

  function handleSaveNote() {
    if (!activeLesson) return;
    setSavingNote(true);
    try {
      localStorage.setItem(`nk-note:${activeLesson.id}`, note);
      flashToast("Notes sauvegardées ✓");
    } catch {
      flashToast("Impossible de sauvegarder");
    } finally {
      setSavingNote(false);
    }
  }

  function handleNext() {
    if (nextLesson) setSelectedLessonId(nextLesson.id);
  }
  function handlePrev() {
    if (prevLesson) setSelectedLessonId(prevLesson.id);
  }

  // ── Render ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center text-white/60">
          <span className="material-symbols-outlined text-[40px] animate-spin">progress_activity</span>
          <p className="text-sm mt-3">Chargement de la formation…</p>
        </div>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
        <div className="text-center text-white/80 max-w-sm">
          <span className="material-symbols-outlined text-[40px] text-white/40">error</span>
          <h2 className="text-lg font-bold mt-3 mb-1">Formation introuvable</h2>
          <p className="text-sm text-white/60 mb-5">Cette formation n&apos;existe plus ou vous n&apos;y avez pas accès.</p>
          <Link
            href="/apprenant/mes-formations"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Mes formations
          </Link>
        </div>
      </div>
    );
  }

  const instructorName = formation.instructeur?.user?.name ?? "Instructeur";

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-14 bg-[#1a1d27] border-b border-white/10 flex items-center px-4 gap-3 z-10">
        <Link
          href="/apprenant/mes-formations"
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="hidden sm:inline">Mes formations</span>
        </Link>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{formation.title}</p>
          <p className="text-white/50 text-[10px] truncate">par {instructorName}</p>
        </div>

        {/* Progress */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <div className="text-xs text-white/50 font-medium">
            {completedLessons}/{totalLessons} leçons
          </div>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            />
          </div>
          <span className="text-xs font-bold text-[#22c55e]">{progress}%</span>
        </div>
      </header>

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d27] border border-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">

        {/* Left: Video + lesson info */}
        <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden">

          {/* Video player area — lecteur Novakou (masque le branding YouTube/Vimeo) */}
          <div className="relative w-full bg-black" style={{ maxHeight: "60vh" }}>
            {activeLesson?.videoUrl ? (
              <LessonVideoPlayer
                videoUrl={activeLesson.videoUrl}
                title={activeLesson.title}
                locked
                className="w-full"
              />
            ) : activeLesson ? (
              // Lesson without video (TEXT, PDF, AUDIO)
              <div
                className="relative w-full flex items-center justify-center"
                style={{ aspectRatio: "16/9" }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #1a2e1a 100%)" }}
                />
                <div className="relative z-10 text-center text-white/90 px-6">
                  <span className="material-symbols-outlined text-[64px] mb-3 block">
                    {activeLesson.type === "PDF" ? "picture_as_pdf"
                      : activeLesson.type === "AUDIO" ? "headphones"
                      : activeLesson.type === "QUIZ" ? "quiz"
                      : "article"}
                  </span>
                  <p className="text-base font-bold mb-1">{activeLesson.title}</p>
                  <p className="text-sm text-white/70">
                    {activeLesson.type === "PDF" ? "Leçon PDF — voir l'onglet Ressources"
                      : activeLesson.type === "AUDIO" ? "Leçon audio"
                      : activeLesson.type === "QUIZ" ? "Quiz interactif"
                      : "Leçon écrite — voir le contenu ci-dessous"}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="relative w-full flex items-center justify-center"
                style={{ aspectRatio: "16/9" }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #1a2e1a 100%)" }}
                />
                <div className="relative z-10 text-center text-white/80">
                  <span className="material-symbols-outlined text-5xl mb-2">smart_display</span>
                  <p className="text-sm font-semibold">Sélectionnez une leçon</p>
                </div>
              </div>
            )}

            {/* Top badge: lesson number */}
            {activeLesson && totalLessons > 0 && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Leçon {activeIndex + 1} / {totalLessons}
                </span>
                {activeLesson.completed && (
                  <span className="bg-[#006e2f] text-white text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Terminée
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Lesson info & tabs */}
          <div className="flex-1 bg-[#f7f9fb] overflow-y-auto">
            {activeLesson && (
              <>
                {/* Lesson title */}
                <div className="p-5 md:p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-[#5c647a] font-medium mb-1 uppercase tracking-wider">
                        Chapitre {activeSectionIndex} · Leçon {activeLessonIndexInSection}
                        {activeLesson.duration ? ` · ${formatDuration(activeLesson.duration)}` : ""}
                      </p>
                      <h2 className="text-lg md:text-xl font-extrabold text-[#191c1e] leading-snug">
                        {activeLesson.title}
                      </h2>
                    </div>
                    <button
                      onClick={handleMarkComplete}
                      disabled={marking || activeLesson.completed}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex-shrink-0 disabled:cursor-not-allowed ${
                        activeLesson.completed
                          ? "bg-[#006e2f] text-white"
                          : "bg-[#006e2f]/10 text-[#006e2f] hover:bg-[#006e2f]/20 disabled:opacity-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {marking ? "progress_activity" : activeLesson.completed ? "check_circle" : "check_circle"}
                      </span>
                      {activeLesson.completed ? "Terminée" : marking ? "..." : "Marquer terminée"}
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-100 bg-white">
                  <div className="flex px-5 md:px-6 gap-1">
                    {(["description", "notes", "ressources"] as TabType[]).map((tab) => {
                      const labels: Record<TabType, string> = {
                        description: "Description",
                        notes: "Notes",
                        ressources: `Ressources${activeLesson.resources.length > 0 ? ` (${activeLesson.resources.length})` : ""}`,
                      };
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === tab
                              ? "border-[#006e2f] text-[#006e2f]"
                              : "border-transparent text-[#5c647a] hover:text-[#191c1e]"
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab content */}
                <div className="p-5 md:p-6">
                  {activeTab === "description" && (
                    <div className="space-y-4">
                      {activeLesson.desc ? (
                        <p className="text-sm text-[#191c1e] leading-relaxed whitespace-pre-line">
                          {activeLesson.desc}
                        </p>
                      ) : null}
                      {activeLesson.content ? (
                        <div
                          className="prose prose-sm max-w-none text-[#191c1e]"
                          dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                        />
                      ) : null}
                      {!activeLesson.desc && !activeLesson.content && (
                        <p className="text-sm text-[#5c647a] italic">
                          Aucune description fournie pour cette leçon.
                        </p>
                      )}
                      {activeSection?.desc && (
                        <div className="bg-[#006e2f]/5 rounded-xl p-4 border border-[#006e2f]/10 mt-4">
                          <p className="text-xs font-bold text-[#006e2f] mb-1.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              menu_book
                            </span>
                            À propos du chapitre
                          </p>
                          <p className="text-sm text-[#191c1e]">{activeSection.desc}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "notes" && (
                    <div>
                      <p className="text-xs text-[#5c647a] mb-3">
                        Vos notes personnelles — sauvegardées localement, visibles uniquement par vous
                      </p>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Écrivez vos notes ici..."
                        rows={8}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none bg-white transition-all"
                      />
                      <button
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="mt-3 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                      >
                        {savingNote ? "Sauvegarde…" : "Sauvegarder les notes"}
                      </button>
                    </div>
                  )}

                  {activeTab === "ressources" && (
                    <div className="space-y-3">
                      {activeLesson.pdfUrl && (
                        <a
                          href={activeLesson.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#006e2f]/20 hover:bg-[#006e2f]/5 transition-all cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-red-600 text-[18px]">picture_as_pdf</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#191c1e] truncate">Document PDF de la leçon</p>
                            <p className="text-[10px] text-[#5c647a]">PDF · Cliquez pour ouvrir</p>
                          </div>
                          <span className="material-symbols-outlined text-[#5c647a] text-[18px] group-hover:text-[#006e2f] transition-colors">
                            open_in_new
                          </span>
                        </a>
                      )}
                      {activeLesson.audioUrl && (
                        <a
                          href={activeLesson.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#006e2f]/20 hover:bg-[#006e2f]/5 transition-all cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-blue-600 text-[18px]">headphones</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#191c1e] truncate">Audio de la leçon</p>
                            <p className="text-[10px] text-[#5c647a]">MP3 · Cliquez pour écouter</p>
                          </div>
                          <span className="material-symbols-outlined text-[#5c647a] text-[18px] group-hover:text-[#006e2f] transition-colors">
                            open_in_new
                          </span>
                        </a>
                      )}
                      {activeLesson.resources.length === 0 && !activeLesson.pdfUrl && !activeLesson.audioUrl ? (
                        <p className="text-sm text-[#5c647a] italic text-center py-6">
                          Aucune ressource attachée à cette leçon.
                        </p>
                      ) : (
                        activeLesson.resources.map((res) => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#006e2f]/20 hover:bg-[#006e2f]/5 transition-all cursor-pointer group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-[#006e2f] text-[18px]">{resourceIcon(res.mimeType, res.name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#191c1e] truncate">{res.name}</p>
                              <p className="text-[10px] text-[#5c647a]">
                                {res.mimeType ?? "Fichier"}{formatFileSize(res.fileSize) ? ` · ${formatFileSize(res.fileSize)}` : ""}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-[#5c647a] text-[18px] group-hover:text-[#006e2f] transition-colors">
                              {res.url.startsWith("http") && !res.mimeType ? "open_in_new" : "download"}
                            </span>
                          </a>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Prev / Next nav */}
                <div className="px-5 md:px-6 pb-6 flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={!prevLesson}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-[#191c1e] hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span className="hidden sm:inline">Leçon précédente</span>
                    <span className="sm:hidden">Préc.</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!nextLesson}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                  >
                    <span className="hidden sm:inline">Leçon suivante</span>
                    <span className="sm:hidden">Suiv.</span>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>skip_next</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right sidebar: curriculum ─────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-bold text-[#191c1e] text-sm mb-1 truncate">{formation.title}</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                />
              </div>
              <span className="text-xs font-bold text-[#006e2f] flex-shrink-0">{progress}%</span>
            </div>
            <p className="text-[10px] text-[#5c647a] mt-1.5">
              {completedLessons}/{totalLessons} leçons terminées
              {progress === 100 && " · Certificat débloqué 🎉"}
            </p>
          </div>

          {/* Curriculum list */}
          <div className="flex-1 overflow-y-auto">
            {formation.sections.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#5c647a]">
                Aucun chapitre disponible.
              </div>
            ) : (
              formation.sections.map((section, sIdx) => {
                const isExpanded = expandedSections.has(section.id);
                const sectionDone = section.lessons.length > 0 && section.lessons.every((l) => l.completed);
                return (
                  <div key={section.id}>
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`text-xs font-bold flex-shrink-0 ${sectionDone ? "text-[#006e2f]" : "text-[#5c647a]"}`}>
                          Ch. {sIdx + 1}
                        </span>
                        <span className="text-sm font-semibold text-[#191c1e] leading-snug truncate">
                          {section.title}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-[#5c647a] flex-shrink-0 ml-2 transition-transform duration-200"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        expand_more
                      </span>
                    </button>

                    {/* Lessons */}
                    {isExpanded && (
                      <div className="bg-gray-50/50">
                        {section.lessons.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-[#5c647a] italic">Aucune leçon dans ce chapitre.</p>
                        ) : (
                          section.lessons.map((lesson) => {
                            const isCurrent = lesson.id === selectedLessonId;
                            const isDone = lesson.completed;
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => setSelectedLessonId(lesson.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-50 last:border-0 ${
                                  isCurrent
                                    ? "bg-[#006e2f]/8 hover:bg-[#006e2f]/10"
                                    : "hover:bg-gray-100/80"
                                }`}
                              >
                                {/* Status icon */}
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isCurrent
                                      ? "bg-[#006e2f]"
                                      : isDone
                                      ? "bg-[#006e2f]/15"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  <span
                                    className={`material-symbols-outlined text-[14px] ${
                                      isCurrent
                                        ? "text-white"
                                        : isDone
                                        ? "text-[#006e2f]"
                                        : "text-[#5c647a]"
                                    }`}
                                    style={{ fontVariationSettings: isDone || isCurrent ? "'FILL' 1" : "'FILL' 0" }}
                                  >
                                    {isDone ? "check_circle" : isCurrent ? "play_arrow" : "play_circle"}
                                  </span>
                                </div>

                                {/* Lesson info */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-xs font-semibold leading-snug truncate ${
                                      isCurrent ? "text-[#006e2f]" : "text-[#191c1e]"
                                    }`}
                                  >
                                    {lesson.title}
                                  </p>
                                  <p className="text-[10px] text-[#5c647a] flex items-center gap-1 mt-0.5">
                                    <span className="material-symbols-outlined text-[10px]">schedule</span>
                                    {formatDuration(lesson.duration)}
                                    {lesson.isFree && (
                                      <span className="ml-1.5 text-[8px] font-bold text-amber-600 uppercase tracking-wide">Gratuit</span>
                                    )}
                                  </p>
                                </div>

                                {/* Current indicator */}
                                {isCurrent && (
                                  <span className="text-[9px] font-bold bg-[#006e2f] text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    EN COURS
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom CTA */}
          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            {progress === 100 ? (
              <Link
                href="/apprenant/certificats"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
                Voir mon certificat
              </Link>
            ) : (
              <button
                onClick={handleNext}
                disabled={!nextLesson}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  skip_next
                </span>
                {nextLesson ? "Leçon suivante" : "Toutes les leçons sont vues"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
