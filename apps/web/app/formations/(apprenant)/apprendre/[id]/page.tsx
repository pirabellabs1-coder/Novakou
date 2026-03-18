"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import {
  Play, FileText, CheckCircle, Circle,
  ChevronDown, ChevronUp, X, StickyNote, MessageCircle,
  Award, Volume2, AlignLeft,
  ChevronLeft, ChevronRight, User,
} from "lucide-react";
import { VideoPlayer } from "@/components/formations/VideoPlayer";
import { DiscussionThread } from "@/components/formations/DiscussionThread";

// ── Types ──────────────────────────────────────────────────────

interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score?: number;
}

interface Lesson {
  id: string;
  titleFr: string;
  titleEn: string;
  type: string;
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  audioUrl: string | null;
  subtitleUrl: string | null;
  subtitleLabel: string | null;
  chapters: { title: string; timestamp: number }[] | null;
  duration: number | null;
  isFree: boolean;
  order: number;
  resources: { id: string; titleFr: string; titleEn: string; url: string; fileType: string }[];
  quiz: { id: string; titleFr: string; passingScore: number } | null;
}

interface Section {
  id: string;
  titleFr: string;
  titleEn: string;
  order: number;
  lessons: Lesson[];
}

interface Formation {
  id: string;
  titleFr: string;
  titleEn: string;
  hasCertificate: boolean;
  sections: Section[];
  instructeur?: {
    id: string;
    user: {
      name: string | null;
      image: string | null;
      avatar: string | null;
    };
  };
}

interface Note {
  id: string;
  content: string;
  timestamp: number | null;
  createdAt: string;
  lessonId: string;
}

// ── Helpers ────────────────────────────────────────────────────

function formatDuration(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}min`;
  return `${h}h${min > 0 ? ` ${min}min` : ""}`;
}

// ── Main Page ──────────────────────────────────────────────────

export default function CoursePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [formation, setFormation] = useState<Formation | null>(null);
  const [enrollment, setEnrollment] = useState<{ id: string; progress: number } | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showDiscussions, setShowDiscussions] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const markingRef = useRef(false);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const markCompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track current video time for note timestamps (updated by VideoPlayer onProgress)
  const currentVideoTime = useRef<number>(0);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated") return;

    // Load formation + enrollment
    Promise.all([
      fetch(`/api/formations/${id}`).then((r) => {
        if (!r.ok) throw new Error("Formation not found");
        return r.json();
      }),
      fetch(`/api/formations/${id}/progress`).then((r) => {
        if (!r.ok) return null; // Not enrolled or error
        return r.json();
      }),
    ]).then(([formData, progressData]) => {
      // The progress API returns the enrollment object directly (with lessonProgress nested)
      // or null if the request failed (not enrolled)
      if (!progressData || progressData.error) {
        // Not enrolled — redirect to formation page
        router.replace(`/formations/${formData.slug || id}`);
        return;
      }
      setFormation(formData);
      setEnrollment({ id: progressData.id, progress: progressData.progress ?? 0 });
      setIsInstructor(progressData.isInstructor ?? false);
      setLessonProgress(progressData.lessonProgress ?? []);
      setGlobalProgress(progressData.progress ?? 0);

      // Open all sections
      if (formData.sections) {
        setExpandedSections(new Set(formData.sections.map((s: Section) => s.id)));
        // Find first incomplete lesson
        const allLessons = formData.sections
          .sort((a: Section, b: Section) => a.order - b.order)
          .flatMap((s: Section) => s.lessons.sort((a: Lesson, b: Lesson) => a.order - b.order));
        const completedIds = new Set((progressData.lessonProgress ?? []).filter((p: LessonProgress) => p.completed).map((p: LessonProgress) => p.lessonId));
        const firstIncomplete = allLessons.find((l: Lesson) => !completedIds.has(l.id));
        setCurrentLesson(firstIncomplete ?? allLessons[0] ?? null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, status, router]);

  useEffect(() => {
    if (!currentLesson || !enrollment) return;
    // Load notes for current lesson
    fetch(`/api/apprenant/notes?lessonId=${currentLesson.id}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []))
      .catch(() => {});
  }, [currentLesson, enrollment]);

  const markLessonComplete = useCallback(async (lessonId: string) => {
    if (!enrollment || markingRef.current) return;
    const alreadyDone = lessonProgress.find((p) => p.lessonId === lessonId)?.completed;
    if (alreadyDone) return;

    markingRef.current = true;
    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/formations/${id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: true }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setLessonProgress((prev) => {
          const existing = prev.find((p) => p.lessonId === lessonId);
          if (existing) {
            return prev.map((p) => p.lessonId === lessonId ? { ...p, completed: true } : p);
          }
          return [...prev, { lessonId, completed: true }];
        });
        setGlobalProgress(data.progress ?? globalProgress);
      }
    } catch { /* network error — silently fail */ }
    finally {
      markingRef.current = false;
      setMarkingComplete(false);
    }
  }, [enrollment, id, lessonProgress, globalProgress]);

  const saveNote = async () => {
    if (!noteText.trim() || !currentLesson) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/apprenant/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: currentLesson.id,
          content: noteText,
          timestamp: currentVideoTime.current > 0 ? Math.floor(currentVideoTime.current) : null,
        }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setNoteText("");
      }
    } catch {}
    finally { setSavingNote(false); }
  };

  // ── Auto-advance helpers ──────────────────────────────────────
  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearInterval(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setAutoAdvanceCountdown(null);
  }, []);

  const startAutoAdvance = useCallback(() => {
    // Cancel any existing timer
    cancelAutoAdvance();
    setAutoAdvanceCountdown(3);
    let count = 3;
    autoAdvanceTimer.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        cancelAutoAdvance();
        // Navigate to next lesson (need allLessons computed at call time)
        setCurrentLesson((prev) => {
          if (!prev || !formation) return prev;
          const all = formation.sections
            .slice()
            .sort((a, b) => a.order - b.order)
            .flatMap((s) => s.lessons.slice().sort((a, b) => a.order - b.order));
          const idx = all.findIndex((l) => l.id === prev.id);
          return idx < all.length - 1 ? all[idx + 1] : prev;
        });
      } else {
        setAutoAdvanceCountdown(count);
      }
    }, 1000);
  }, [cancelAutoAdvance, formation]);

  // Clean up auto-advance and mark-complete timer on lesson change or unmount
  useEffect(() => {
    return () => {
      cancelAutoAdvance();
      // Clear pending mark-complete timer to prevent marking the wrong lesson
      if (markCompleteTimer.current) {
        clearTimeout(markCompleteTimer.current);
        markCompleteTimer.current = null;
      }
      // Reset video time tracking for notes
      currentVideoTime.current = 0;
    };
  }, [currentLesson, cancelAutoAdvance]);

  // ── Keyboard shortcuts: N → next, P → previous ──────────────
  useEffect(() => {
    if (!formation || !currentLesson) return;
    const all = formation.sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .flatMap((s) => s.lessons.slice().sort((a, b) => a.order - b.order));
    const idx = all.findIndex((l) => l.id === currentLesson.id);

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (e.target as HTMLElement)?.isContentEditable) return;
      // Use Shift+N / Shift+P to avoid conflict with VideoPlayer's "p" (PiP) shortcut
      if (e.shiftKey && (e.key === "N")) {
        e.preventDefault();
        if (idx < all.length - 1) setCurrentLesson(all[idx + 1]);
      } else if (e.shiftKey && (e.key === "P")) {
        e.preventDefault();
        if (idx > 0) setCurrentLesson(all[idx - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formation, currentLesson]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">{fr ? "Chargement..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!formation || !currentLesson) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-white font-semibold mb-2">
            {fr ? "Formation introuvable" : "Course not found"}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            {fr ? "Cette formation n'existe pas ou vous n'y avez pas accès." : "This course does not exist or you don't have access."}
          </p>
          <Link href="/formations/mes-formations" className="text-primary hover:underline text-sm">
            {fr ? "Retour aux formations" : "Back to my courses"}
          </Link>
        </div>
      </div>
    );
  }

  const formationTitle = fr ? formation.titleFr : (formation.titleEn || formation.titleFr);
  const lessonTitle = fr ? currentLesson.titleFr : (currentLesson.titleEn || currentLesson.titleFr);
  const totalLessons = formation.sections.reduce((s, sec) => s + sec.lessons.length, 0);
  const completedLessons = lessonProgress.filter((p) => p.completed).length;
  const isCurrentComplete = lessonProgress.find((p) => p.lessonId === currentLesson.id)?.completed ?? false;

  // ── Flat lesson list & navigation helpers ──
  const allLessons = formation.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((s) => s.lessons.slice().sort((a, b) => a.order - b.order));
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isLastLesson = currentIndex === allLessons.length - 1;
  const computedProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 flex-shrink-0 z-10">
        <Link href="/formations/mes-formations" className="flex items-center gap-2">
          <X className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-black text-white">
            Freelance<span className="text-primary">High</span>
          </span>
        </Link>
        <div className="flex-1 text-center mx-4 hidden sm:block">
          <p className="text-sm text-slate-300 truncate max-w-xs mx-auto">{formationTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Global progress */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${globalProgress}%` }} />
            </div>
            <span>{Math.round(globalProgress)}%</span>
          </div>
          {/* Discussions toggle */}
          <button
            onClick={() => { setShowDiscussions(!showDiscussions); if (!showDiscussions) setShowNotes(false); }}
            className={`p-2 rounded-lg transition-colors ${showDiscussions ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-800"}`}
            title={fr ? "Discussions" : "Discussions"}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          {/* Notes toggle */}
          <button
            onClick={() => { setShowNotes(!showNotes); if (!showNotes) setShowDiscussions(false); }}
            className={`p-2 rounded-lg transition-colors ${showNotes ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-800"}`}
          >
            <StickyNote className="w-4 h-4" />
          </button>
          {/* Certificate */}
          {globalProgress >= 100 && formation.hasCertificate && (
            <Link href="/formations/certificats" className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
              <Award className="w-3.5 h-3.5" />
              {fr ? "Certificat" : "Certificate"}
            </Link>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video / Content area */}
          <div className="flex-1 bg-black relative overflow-hidden">
            {currentLesson.type === "VIDEO" && currentLesson.videoUrl && (
              (() => {
                const isYouTube = currentLesson.videoUrl.includes("youtube") || currentLesson.videoUrl.includes("youtu.be");
                const isVimeo = currentLesson.videoUrl.includes("vimeo");
                if (isYouTube || isVimeo) {
                  const embedUrl = isYouTube
                    ? currentLesson.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")
                    : currentLesson.videoUrl.replace("vimeo.com/", "player.vimeo.com/video/");
                  return (
                    <iframe
                      src={`${embedUrl}?autoplay=1`}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; encrypted-media"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <VideoPlayer
                    src={currentLesson.videoUrl}
                    subtitleUrl={currentLesson.subtitleUrl}
                    subtitleLabel={currentLesson.subtitleLabel ?? undefined}
                    chapters={currentLesson.chapters ?? []}
                    onProgress={(currentTime, duration) => {
                      // Track time for note timestamps
                      currentVideoTime.current = currentTime;
                      if (duration > 0 && (currentTime / duration) >= 0.9) {
                        if (!markCompleteTimer.current) {
                          markCompleteTimer.current = setTimeout(() => {
                            markLessonComplete(currentLesson.id);
                            markCompleteTimer.current = null;
                          }, 1000);
                        }
                      }
                    }}
                    onEnded={() => {
                      markLessonComplete(currentLesson.id);
                      if (!isLastLesson) {
                        startAutoAdvance();
                      }
                    }}
                    autoPlay
                  />
                );
              })()
            )}

            {currentLesson.type === "PDF" && currentLesson.pdfUrl && (
              <iframe src={currentLesson.pdfUrl} className="w-full h-full" />
            )}

            {currentLesson.type === "AUDIO" && currentLesson.audioUrl && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Volume2 className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-lg font-semibold mb-4">{lessonTitle}</p>
                  <audio controls src={currentLesson.audioUrl} className="w-64" />
                </div>
              </div>
            )}

            {currentLesson.type === "TEXTE" && currentLesson.content && (
              <div className="h-full overflow-y-auto p-8">
                <div
                  className="prose prose-invert max-w-3xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentLesson.content) }}
                />
              </div>
            )}

            {currentLesson.type === "QUIZ" && currentLesson.quiz && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <AlignLeft className="w-10 h-10 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold mb-2">{fr ? currentLesson.quiz.titleFr : (currentLesson.titleEn || currentLesson.quiz.titleFr)}</p>
                  <p className="text-slate-400 text-sm mb-6">
                    {fr ? `Score minimum : ${currentLesson.quiz.passingScore}%` : `Passing score: ${currentLesson.quiz.passingScore}%`}
                  </p>
                  <Link
                    href={`/formations/apprendre/${id}/quiz/${currentLesson.quiz.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
                  >
                    {fr ? "Commencer le quiz" : "Start quiz"}
                  </Link>
                </div>
              </div>
            )}

            {/* Auto-advance countdown overlay */}
            {autoAdvanceCountdown !== null && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                <div className="text-center">
                  <p className="text-xl font-bold text-white mb-2">
                    {nextLesson
                      ? `${fr ? "Prochaine leçon dans" : "Next lesson in"} ${autoAdvanceCountdown}...`
                      : (fr ? "Formation terminée !" : "Course completed!")}
                  </p>
                  {nextLesson && (
                    <p className="text-sm text-slate-300 mb-4 max-w-xs mx-auto truncate">
                      {fr ? nextLesson.titleFr : (nextLesson.titleEn || nextLesson.titleFr)}
                    </p>
                  )}
                  <button
                    onClick={cancelAutoAdvance}
                    className="px-6 py-2 rounded-lg border border-slate-500 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    {fr ? "Annuler" : "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* Formation completed overlay (last lesson, no next) */}
            {autoAdvanceCountdown === null && isLastLesson && isCurrentComplete && currentLesson.type === "VIDEO" && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-600/90 text-white text-sm font-medium px-4 py-2 rounded-lg z-20 pointer-events-none">
                {fr ? "Formation terminée !" : "Course completed!"}
              </div>
            )}
          </div>

          {/* Below video: title + resources + mark complete */}
          <div className="bg-slate-900 px-6 py-4 flex-shrink-0 overflow-y-auto max-h-40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-white mb-1">{lessonTitle}</h2>
                {currentLesson.resources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentLesson.resources.map((r) => (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-slate-800 px-2 py-1 rounded"
                      >
                        <FileText className="w-3 h-3" />
                        {fr ? r.titleFr : r.titleEn}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {!isCurrentComplete && currentLesson.type !== "QUIZ" && (
                <button
                  onClick={() => markLessonComplete(currentLesson.id)}
                  disabled={markingComplete}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <CheckCircle className="w-4 h-4" />
                  {fr ? "Marquer complétée" : "Mark complete"}
                </button>
              )}
              {isCurrentComplete && (
                <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium flex-shrink-0">
                  <CheckCircle className="w-4 h-4" />
                  {fr ? "Complétée" : "Completed"}
                </span>
              )}
            </div>
          </div>

          {/* Previous / Next lesson navigation */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                disabled={!prevLesson}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-sm font-medium transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-1/2 justify-start"
              >
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-left">
                  {prevLesson
                    ? `${fr ? "Leçon précédente" : "Previous lesson"}: ${fr ? prevLesson.titleFr : (prevLesson.titleEn || prevLesson.titleFr)}`
                    : (fr ? "Leçon précédente" : "Previous lesson")}
                </span>
              </button>
              <button
                onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                disabled={!nextLesson}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-sm font-medium transition-colors hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-1/2 justify-end"
              >
                <span className="truncate text-right">
                  {nextLesson
                    ? `${fr ? "Leçon suivante" : "Next lesson"}: ${fr ? nextLesson.titleFr : (nextLesson.titleEn || nextLesson.titleFr)}`
                    : (fr ? "Leçon suivante" : "Next lesson")}
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm">{fr ? "Mes notes" : "My notes"}</h3>
              <button onClick={() => setShowNotes(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-4 border-b border-slate-800">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder={fr ? "Ajouter une note..." : "Add a note..."}
                className="w-full bg-slate-800 text-sm text-white placeholder-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <button
                onClick={saveNote}
                disabled={savingNote || !noteText.trim()}
                className="mt-2 w-full bg-primary text-white text-sm font-medium py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {savingNote ? "..." : (fr ? "Sauvegarder" : "Save")}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="bg-slate-800 rounded-lg p-3">
                  {note.timestamp !== null && (
                    <p className="text-xs text-primary mb-1">
                      ⏱ {Math.floor(note.timestamp / 60)}:{String(note.timestamp % 60).padStart(2, "0")}
                    </p>
                  )}
                  <p className="text-sm text-slate-300">{note.content}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(note.createdAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-slate-500 text-center mt-8">
                  {fr ? "Aucune note pour cette leçon" : "No notes for this lesson"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Discussions panel */}
        {showDiscussions && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm">{fr ? "Discussions" : "Discussions"}</h3>
              <button onClick={() => setShowDiscussions(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <DiscussionThread
                formationId={id}
                currentUserId={session?.user?.id ?? ""}
                isInstructor={isInstructor}
                locale={locale}
              />
            </div>
          </div>
        )}

        {/* Curriculum sidebar */}
        <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col flex-shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-slate-800">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
              {fr ? "Contenu du cours" : "Course content"}
            </p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-300">
                {completedLessons}/{totalLessons} {fr ? "leçons" : "lessons"}
              </p>
              <span className="text-xs text-primary font-medium">{computedProgress}% {fr ? "complété" : "completed"}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${computedProgress}%` }}
              />
            </div>
          </div>
          {/* Instructor link */}
          {formation.instructeur && (
            <Link
              href={`/formations/instructeurs/${formation.instructeur.id}`}
              className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors group"
            >
              {formation.instructeur.user.image || formation.instructeur.user.avatar ? (
                <img
                  src={formation.instructeur.user.image || formation.instructeur.user.avatar || ""}
                  alt={formation.instructeur.user.name || ""}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {formation.instructeur.user.name ? (
                    <span className="text-xs font-semibold text-primary">
                      {formation.instructeur.user.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 leading-none mb-0.5">
                  {fr ? "Instructeur" : "Instructor"}
                </p>
                <p className="text-sm text-slate-200 font-medium truncate group-hover:text-primary transition-colors">
                  {formation.instructeur.user.name || (fr ? "Instructeur" : "Instructor")}
                </p>
              </div>
              <span className="text-xs text-slate-500 group-hover:text-primary transition-colors flex-shrink-0">
                {fr ? "Voir le profil" : "View profile"}
              </span>
            </Link>
          )}
          <div className="flex-1 overflow-y-auto">
            {formation.sections.slice().sort((a, b) => a.order - b.order).map((section) => {
              const sTitle = fr ? section.titleFr : (section.titleEn || section.titleFr);
              const isExpanded = expandedSections.has(section.id);
              const sCompleted = section.lessons.filter((l) => lessonProgress.find((p) => p.lessonId === l.id)?.completed).length;

              return (
                <div key={section.id} className="border-b border-slate-800">
                  <button
                    onClick={() => {
                      const next = new Set(expandedSections);
                      isExpanded ? next.delete(section.id) : next.add(section.id);
                      setExpandedSections(next);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200 line-clamp-2">{sTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{sCompleted}/{section.lessons.length}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 ml-2" />}
                  </button>
                  {isExpanded && (
                    <div>
                      {section.lessons.slice().sort((a, b) => a.order - b.order).map((lesson) => {
                        const lTitle = fr ? lesson.titleFr : (lesson.titleEn || lesson.titleFr);
                        const isDone = lessonProgress.find((p) => p.lessonId === lesson.id)?.completed ?? false;
                        const isCurrent = currentLesson?.id === lesson.id;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setCurrentLesson(lesson)}
                            className={`w-full flex items-start gap-2 px-4 py-2.5 text-left transition-colors ${
                              isCurrent ? "bg-primary/20 border-r-2 border-primary" : "hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {isDone ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : isCurrent ? (
                                <Play className="w-4 h-4 text-primary" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-tight ${isCurrent ? "text-white font-medium" : isDone ? "text-slate-400" : "text-slate-300"}`}>
                                {lTitle}
                              </p>
                              {lesson.duration && (
                                <p className="text-xs text-slate-600 mt-0.5">{formatDuration(lesson.duration)}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="hidden lg:flex items-center justify-center gap-4 px-4 py-1.5 bg-slate-900 border-t border-slate-800 flex-shrink-0">
        <p className="text-xs text-slate-600">
          {fr
            ? "Raccourcis : Shift+N suivante, Shift+P précédente"
            : "Shortcuts: Shift+N next, Shift+P previous"}
        </p>
      </div>
    </div>
  );
}
