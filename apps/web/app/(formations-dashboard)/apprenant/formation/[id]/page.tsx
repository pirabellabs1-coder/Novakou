"use client";

import Link from "next/link";
import { useState } from "react";

const course = {
  title: "Maîtrisez les algorithmes pour doubler vos ventes",
  instructor: "Thomas Eko",
  totalLessons: 12,
  completedLessons: 7,
};

type LessonStatus = "done" | "current" | "locked";

interface Lesson {
  id: number;
  title: string;
  duration: string;
  status: LessonStatus;
}

interface Chapter {
  id: number;
  title: string;
  lessons: Lesson[];
}

const curriculum: Chapter[] = [
  {
    id: 1,
    title: "Introduction & Fondamentaux",
    lessons: [
      { id: 1, title: "Bienvenue dans la formation", duration: "3:12", status: "done" },
      { id: 2, title: "Comprendre les algorithmes de vente", duration: "8:45", status: "done" },
      { id: 3, title: "Pourquoi 80% des freelances échouent", duration: "11:20", status: "done" },
      { id: 4, title: "La méthode FH en 5 étapes", duration: "14:07", status: "done" },
    ],
  },
  {
    id: 2,
    title: "Construire votre offre irrésistible",
    lessons: [
      { id: 5, title: "Identifier votre niche premium", duration: "9:33", status: "done" },
      { id: 6, title: "La pyramide de valeur perçue", duration: "12:18", status: "done" },
      { id: 7, title: "Rédiger une proposition de valeur percutante", duration: "16:42", status: "current" },
      { id: 8, title: "Tester et valider votre offre", duration: "10:05", status: "locked" },
    ],
  },
  {
    id: 3,
    title: "Convertir et fidéliser",
    lessons: [
      { id: 9, title: "Les 7 objections classiques et comment les traiter", duration: "18:30", status: "locked" },
      { id: 10, title: "Techniques de closing sans pression", duration: "13:55", status: "locked" },
      { id: 11, title: "Upsell et récurrence client", duration: "11:40", status: "locked" },
      { id: 12, title: "Projet final : Votre plan de vente complet", duration: "20:00", status: "locked" },
    ],
  },
];

type TabType = "description" | "notes" | "ressources";

const currentLesson = curriculum[1].lessons[2];

export default function FormationPlayerPage({
  params: _params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [expandedChapters, setExpandedChapters] = useState<number[]>([1, 2]);
  const [note, setNote] = useState("");

  const toggleChapter = (id: number) => {
    setExpandedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const progress = Math.round((course.completedLessons / course.totalLessons) * 100);

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
          <p className="text-white font-semibold text-sm truncate">{course.title}</p>
        </div>

        {/* Progress */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <div className="text-xs text-white/50 font-medium">
            {course.completedLessons}/{course.totalLessons} leçons
          </div>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            />
          </div>
          <span className="text-xs font-bold text-[#22c55e]">{progress}%</span>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <button className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            AR
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">

        {/* Left: Video + description */}
        <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden">

          {/* Video player area */}
          <div
            className="relative w-full bg-black flex items-center justify-center"
            style={{ aspectRatio: "16/9", maxHeight: "60vh" }}
          >
            {/* Dark gradient backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #1a2e1a 100%)" }}
            />

            {/* Large decorative icon */}
            <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-white/5 text-[200px] select-none">
              play_circle
            </span>

            {/* Play button overlay */}
            <button className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/40 hover:bg-white/30 transition-all hover:scale-105 group">
              <span
                className="material-symbols-outlined text-white text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                play_arrow
              </span>
            </button>

            {/* Top controls */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                Leçon 7 / 12
              </span>
            </div>

            {/* Bottom progress bar */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
              {/* Time scrubber */}
              <div className="w-full h-1 bg-white/20 rounded-full mb-2 cursor-pointer hover:h-1.5 transition-all">
                <div className="h-full w-[38%] bg-white rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="text-white/80 hover:text-white">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      skip_previous
                    </span>
                  </button>
                  <button className="text-white hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_circle
                    </span>
                  </button>
                  <button className="text-white/80 hover:text-white">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      skip_next
                    </span>
                  </button>
                  <span className="text-white/60 text-xs font-medium">6:21 / 16:42</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-white/80 hover:text-white">
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                  </button>
                  <button className="text-white/80 hover:text-white text-xs font-bold">1×</button>
                  <button className="text-white/80 hover:text-white">
                    <span className="material-symbols-outlined text-[18px]">subtitles</span>
                  </button>
                  <button className="text-white/80 hover:text-white">
                    <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson info & tabs */}
          <div className="flex-1 bg-[#f7f9fb] overflow-y-auto">
            {/* Lesson title */}
            <div className="p-5 md:p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] text-[#5c647a] font-medium mb-1 uppercase tracking-wider">
                    Chapitre 2 · Leçon 7
                  </p>
                  <h2 className="text-lg font-extrabold text-[#191c1e] leading-snug">
                    {currentLesson.title}
                  </h2>
                </div>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006e2f]/10 text-[#006e2f] text-xs font-bold hover:bg-[#006e2f]/20 transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  Marquer terminée
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
                    ressources: "Ressources",
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
                  <p className="text-sm text-[#191c1e] leading-relaxed">
                    Dans cette leçon, vous apprendrez à formuler une proposition de valeur qui résonne immédiatement avec votre client idéal. Une bonne proposition de valeur répond à trois questions fondamentales : Qu&apos;est-ce que vous faites ? Pour qui ? Et quel résultat concret obtenez-vous ?
                  </p>
                  <p className="text-sm text-[#5c647a] leading-relaxed">
                    Nous allons décortiquer des exemples réels de freelances africains qui ont multiplié leurs revenus par 3 simplement en reformulant leur offre. Vous repartirez avec un template prêt à l&apos;emploi.
                  </p>
                  <div className="bg-[#006e2f]/5 rounded-xl p-4 border border-[#006e2f]/10">
                    <p className="text-xs font-bold text-[#006e2f] mb-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        lightbulb
                      </span>
                      Objectif de la leçon
                    </p>
                    <p className="text-sm text-[#191c1e]">
                      Rédiger votre proposition de valeur en moins de 2 lignes, testable immédiatement sur vos clients potentiels.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div>
                  <p className="text-xs text-[#5c647a] mb-3">Vos notes personnelles — visibles uniquement par vous</p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Écrivez vos notes ici..."
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none bg-white transition-all"
                  />
                  <button
                    className="mt-3 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                  >
                    Sauvegarder les notes
                  </button>
                </div>
              )}

              {activeTab === "ressources" && (
                <div className="space-y-3">
                  {[
                    { icon: "description", name: "Template — Proposition de valeur.pdf", size: "245 KB", type: "PDF" },
                    { icon: "table_chart", name: "Tableau d'analyse concurrentielle.xlsx", size: "89 KB", type: "Excel" },
                    { icon: "link", name: "Article : Les 12 meilleures propositions de valeur en 2026", size: null, type: "Lien" },
                  ].map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#006e2f]/20 hover:bg-[#006e2f]/5 transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[#006e2f] text-[18px]">{res.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#191c1e] truncate">{res.name}</p>
                        <p className="text-[10px] text-[#5c647a]">
                          {res.type}{res.size ? ` · ${res.size}` : ""}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[#5c647a] text-[18px] group-hover:text-[#006e2f] transition-colors">
                        {res.type === "Lien" ? "open_in_new" : "download"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right sidebar: curriculum ─────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="font-bold text-[#191c1e] text-sm mb-1">{course.title}</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                />
              </div>
              <span className="text-xs font-bold text-[#006e2f] flex-shrink-0">{progress}%</span>
            </div>
          </div>

          {/* Curriculum list */}
          <div className="flex-1 overflow-y-auto">
            {curriculum.map((chapter) => {
              const isExpanded = expandedChapters.includes(chapter.id);
              return (
                <div key={chapter.id}>
                  {/* Chapter header */}
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-[#5c647a] flex-shrink-0">
                        Ch. {chapter.id}
                      </span>
                      <span className="text-sm font-semibold text-[#191c1e] leading-snug truncate">
                        {chapter.title}
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
                      {chapter.lessons.map((lesson) => {
                        const isCurrent = lesson.status === "current";
                        const isDone = lesson.status === "done";
                        const isLocked = lesson.status === "locked";

                        return (
                          <button
                            key={lesson.id}
                            disabled={isLocked}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-50 last:border-0 ${
                              isCurrent
                                ? "bg-[#006e2f]/8 hover:bg-[#006e2f]/10"
                                : isLocked
                                ? "opacity-50 cursor-not-allowed"
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
                                {isDone
                                  ? "check_circle"
                                  : isCurrent
                                  ? "play_arrow"
                                  : "lock"}
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
                                {lesson.duration}
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
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                skip_next
              </span>
              Leçon suivante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
