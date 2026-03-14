"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import {
  Play, FileText, BookOpen, CheckCircle, Circle,
  ChevronDown, ChevronUp, X, StickyNote, MessageCircle,
  Award, List, Volume2, Maximize, AlignLeft,
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
  const [globalProgress, setGlobalProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const markCompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated") return;

    // Load formation + enrollment
    Promise.all([
      fetch(`/api/formations/${id}`).then((r) => r.json()),
      fetch(`/api/formations/${id}/progress`).then((r) => r.json()),
    ]).then(([formData, progressData]) => {
      if (!progressData.enrollment) {
        // Not enrolled — redirect to formation page
        router.replace(`/formations/${formData.slug || id}`);
        return;
      }
      setFormation(formData);
      setEnrollment(progressData.enrollment);
      setIsInstructor(progressData.isInstructor ?? false);
      setLessonProgress(progressData.lessonProgress ?? []);
      setGlobalProgress(progressData.enrollment.progress ?? 0);

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
    if (!enrollment || markingComplete) return;
    const alreadyDone = lessonProgress.find((p) => p.lessonId === lessonId)?.completed;
    if (alreadyDone) return;

    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/formations/${id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: true }),
      });
      const data = await res.json();
      setLessonProgress(data.lessonProgress ?? []);
      setGlobalProgress(data.progress ?? globalProgress);
      // Check if certificate was generated
      if (data.certificateGenerated) {
        // Show congrats notification
      }
    } catch {}
    finally { setMarkingComplete(false); }
  }, [enrollment, id, lessonProgress, globalProgress, markingComplete]);

  const handleVideoProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!currentLesson) return;
    const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
    if (pct >= 90) {
      if (markCompleteTimer.current) return;
      markCompleteTimer.current = setTimeout(() => {
        markLessonComplete(currentLesson.id);
        markCompleteTimer.current = null;
      }, 1000);
    }
  };

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
          timestamp: videoRef.current ? Math.floor(videoRef.current.currentTime) : null,
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

  if (!formation || !currentLesson) return null;

  const formationTitle = fr ? formation.titleFr : (formation.titleEn || formation.titleFr);
  const lessonTitle = fr ? currentLesson.titleFr : (currentLesson.titleEn || currentLesson.titleFr);
  const totalLessons = formation.sections.reduce((s, sec) => s + sec.lessons.length, 0);
  const completedLessons = lessonProgress.filter((p) => p.completed).length;
  const isCurrentComplete = lessonProgress.find((p) => p.lessonId === currentLesson.id)?.completed ?? false;

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
                      if (duration > 0 && (currentTime / duration) >= 0.9) {
                        if (!markCompleteTimer.current) {
                          markCompleteTimer.current = setTimeout(() => {
                            markLessonComplete(currentLesson.id);
                            markCompleteTimer.current = null;
                          }, 1000);
                        }
                      }
                    }}
                    onEnded={() => markLessonComplete(currentLesson.id)}
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
                  <p className="text-xl font-bold mb-2">{fr ? currentLesson.quiz.titleFr : currentLesson.titleEn}</p>
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
            <p className="text-sm text-slate-300">
              {completedLessons}/{totalLessons} {fr ? "leçons" : "lessons"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {formation.sections.sort((a, b) => a.order - b.order).map((section) => {
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
                      {section.lessons.sort((a, b) => a.order - b.order).map((lesson) => {
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
    </div>
  );
}
