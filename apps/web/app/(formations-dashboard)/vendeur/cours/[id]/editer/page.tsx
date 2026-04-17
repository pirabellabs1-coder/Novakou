"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Lesson = {
  id: string;
  title: string;
  desc: string | null;
  type: string;
  duration: number | null;
  order: number;
  isFree: boolean;
  videoUrl: string | null;
};

type Section = {
  id: string;
  title: string;
  desc: string | null;
  order: number;
  lessons: Lesson[];
};

type Formation = {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  description: string | null;
  thumbnail: string | null;
  price: number;
  originalPrice: number | null;
  customCategory: string | null;
  status: string;
  rating: number;
  studentsCount: number;
  reviewsCount: number;
  hiddenFromMarketplace?: boolean;
  sections: Section[];
};

const STATUS_MAP: Record<string, { label: string; accent: string }> = {
  BROUILLON: { label: "Draft", accent: "text-zinc-400" },
  EN_ATTENTE: { label: "Review", accent: "text-amber-600" },
  ACTIF: { label: "Live", accent: "text-[#006e2f]" },
  ARCHIVE: { label: "Archived", accent: "text-zinc-400" },
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export default function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [price, setPrice] = useState(0);
  const [thumbnail, setThumbnail] = useState("");
  const [hiddenFromMarketplace, setHiddenFromMarketplace] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const { data: response, isLoading } = useQuery<{ data: Formation }>({
    queryKey: ["formation", id],
    queryFn: () => fetch(`/api/formations/vendeur/formations/${id}`).then((r) => r.json()),
    staleTime: 30_000,
  });

  const formation = response?.data;

  useEffect(() => {
    if (formation) {
      setTitle(formation.title);
      setShortDesc(formation.shortDesc ?? "");
      setPrice(formation.price);
      setThumbnail(formation.thumbnail ?? "");
      setHiddenFromMarketplace(!!formation.hiddenFromMarketplace);
      setDirty(false);
      if (formation.sections[0]?.lessons[0]) {
        setSelectedLessonId(formation.sections[0].lessons[0].id);
      }
    }
  }, [formation]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/formations/vendeur/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["formation", id] });
      setDirty(false);
      setLastSavedAt(new Date());
    },
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/formations/vendeur/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "EN_ATTENTE" }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["formation", id] }),
  });

  function onFieldChange<T>(setter: (v: T) => void, v: T) {
    setter(v);
    setDirty(true);
  }

  function saveDraft() {
    saveMutation.mutate({ title, shortDesc, price, thumbnail, hiddenFromMarketplace });
  }

  const status = STATUS_MAP[formation?.status ?? "BROUILLON"] ?? STATUS_MAP.BROUILLON;
  const selectedLesson = formation?.sections
    .flatMap((s) => s.lessons)
    .find((l) => l.id === selectedLessonId);

  const totalLessons = formation?.sections.reduce((s, sec) => s + sec.lessons.length, 0) ?? 0;
  const totalDuration = formation?.sections
    .flatMap((s) => s.lessons)
    .reduce((s, l) => s + (l.duration ?? 0), 0) ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] p-12">
        <div className="max-w-[1400px] mx-auto space-y-8">
          <div className="h-4 bg-zinc-200 w-32 animate-pulse" />
          <div className="h-12 bg-zinc-200 w-96 animate-pulse" />
          <div className="h-64 bg-zinc-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!formation) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 mb-2">Formation introuvable</p>
          <Link href="/vendeur/produits" className="text-[#006e2f] underline text-sm">
            Retour aux produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-12">
        <Link
          href="/vendeur/produits"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors mb-8"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Mes produits
        </Link>

        <div className="flex flex-col lg:flex-row gap-10 md:gap-12">
          {/* ── Sidebar: Curriculum ── */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[#006e2f] font-bold text-[10px] tracking-[0.15em] uppercase block mb-1">
                    Structure
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900">Curriculum</h2>
                </div>
                <button className="text-[#22c55e] hover:bg-[#e8e8e8] p-1 transition-colors">
                  <span className="material-symbols-outlined">add_box</span>
                </button>
              </div>

              {formation.sections.length === 0 ? (
                <div className="p-6 bg-[#f3f3f4] border-l-4 border-[#bccbb9]">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Aucun module pour l&apos;instant. Cliquez sur <span className="font-bold">+</span> pour créer votre premier module.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formation.sections.map((section, sIdx) => (
                    <div key={section.id} className="space-y-3">
                      <div className="flex items-center justify-between group">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          Module {String(sIdx + 1).padStart(2, "0")}
                        </span>
                        <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 cursor-grab text-zinc-400">
                          drag_indicator
                        </span>
                      </div>
                      <div className="bg-white p-4 border-l-4 border-[#22c55e] shadow-sm">
                        <p className="text-sm font-bold text-zinc-900 leading-tight">{section.title}</p>
                      </div>
                      <div className="pl-4 space-y-1">
                        {section.lessons.map((lesson) => {
                          const active = selectedLessonId === lesson.id;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLessonId(lesson.id)}
                              className={`w-full flex items-center gap-3 p-2 text-left transition-colors group ${
                                active ? "bg-[#f3f3f4]" : "hover:bg-[#f3f3f4]"
                              }`}
                            >
                              <span className={`material-symbols-outlined text-sm ${active ? "text-[#006e2f]" : "text-zinc-400"}`}>
                                {lesson.type === "VIDEO" ? "play_circle" : lesson.type === "QUIZ" ? "quiz" : "description"}
                              </span>
                              <span className="text-xs font-medium text-zinc-600 flex-1 truncate">{lesson.title}</span>
                              {lesson.isFree && (
                                <span className="text-[8px] font-bold uppercase tracking-widest text-[#006e2f] flex-shrink-0">
                                  Free
                                </span>
                              )}
                            </button>
                          );
                        })}
                        <button className="flex items-center gap-2 text-[10px] font-bold text-[#006e2f] uppercase tracking-widest hover:underline mt-2 py-1">
                          <span className="material-symbols-outlined text-xs">add</span>
                          Ajouter leçon
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="mt-10 p-5 bg-zinc-900 text-white space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6bff8f]">Aperçu</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Modules</p>
                    <p className="text-2xl font-extrabold tabular-nums">{String(formation.sections.length).padStart(2, "0")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Leçons</p>
                    <p className="text-2xl font-extrabold tabular-nums">{String(totalLessons).padStart(2, "0")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Durée</p>
                    <p className="text-2xl font-extrabold tabular-nums">{totalDuration}<span className="text-sm">m</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Ventes</p>
                    <p className="text-2xl font-extrabold tabular-nums">{formation.studentsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Editor Canvas ── */}
          <div className="flex-1 min-w-0 space-y-12">
            {/* Header */}
            <header className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-[10px] tracking-[0.15em] uppercase ${status.accent}`}>
                  {status.label} Mode
                </span>
                <div className="w-1 h-1 rounded-full bg-zinc-400" />
                <span className="text-zinc-400 font-bold text-[10px] tracking-[0.15em] uppercase italic">
                  {formation.customCategory ?? "Édition"}
                </span>
                {dirty && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-zinc-400" />
                    <span className="text-amber-600 font-bold text-[10px] tracking-[0.15em] uppercase">Unsaved</span>
                  </>
                )}
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => onFieldChange(setTitle, e.target.value)}
                placeholder="Titre de la formation"
                className="w-full text-3xl md:text-5xl font-black tracking-tighter text-zinc-900 max-w-3xl leading-[0.95] bg-transparent outline-none focus:bg-white focus:px-2 focus:-mx-2 transition-all"
              />
            </header>

            {/* Video upload / preview for selected lesson */}
            <section className="bg-[#f3f3f4] p-8 md:p-12 border-2 border-dashed border-[#bccbb9] flex flex-col items-center justify-center text-center space-y-6 min-h-[400px] group hover:border-[#22c55e] transition-colors duration-500">
              <div className="w-20 h-20 bg-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-4xl text-[#22c55e]">
                  {selectedLesson?.videoUrl ? "play_circle" : "upload_file"}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900">
                  {selectedLesson ? `Leçon : ${selectedLesson.title}` : "Upload vidéo de leçon"}
                </h3>
                <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                  4K ou 1080p recommandé. Upload illimité inclus dans votre plan.
                </p>
              </div>
              <button className="bg-zinc-900 text-white px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-extrabold hover:bg-[#006e2f] transition-all duration-300">
                {selectedLesson?.videoUrl ? "Remplacer vidéo" : "Sélectionner vidéo"}
              </button>
            </section>

            {/* Bento grid: Lesson Details + Cover Preview */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Lesson / Formation metadata */}
              <div className="bg-[#f3f3f4] p-6 md:p-8 space-y-6">
                <span className="text-[#006e2f] font-bold text-[10px] tracking-[0.15em] uppercase block">
                  Détails du produit
                </span>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Résumé court</label>
                    <input
                      type="text"
                      value={shortDesc}
                      onChange={(e) => onFieldChange(setShortDesc, e.target.value)}
                      placeholder="Une phrase qui accroche"
                      className="w-full bg-transparent border-b border-[#bccbb9] py-2 focus:border-[#22c55e] outline-none text-base font-semibold transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Prix (FCFA)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => onFieldChange(setPrice, Number(e.target.value))}
                      className="w-full bg-transparent border-b border-[#bccbb9] py-2 focus:border-[#22c55e] outline-none tabular-nums text-lg font-bold transition-colors"
                    />
                    <p className="text-[10px] text-zinc-400 tabular-nums">≈ {formatFCFA(price / 655.957)} €</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">URL Thumbnail</label>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => onFieldChange(setThumbnail, e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-transparent border-b border-[#bccbb9] py-2 focus:border-[#22c55e] outline-none tabular-nums text-xs transition-colors"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Visibilité marketplace</label>
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#bccbb9]">
                      <span className="text-xs text-zinc-700">
                        {hiddenFromMarketplace ? "Caché du marketplace public" : "Visible sur /explorer + Best-sellers"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onFieldChange(setHiddenFromMarketplace, !hiddenFromMarketplace)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${hiddenFromMarketplace ? "bg-[#006e2f]" : "bg-zinc-300"}`}
                        aria-pressed={hiddenFromMarketplace}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${hiddenFromMarketplace ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover preview */}
              <div className="relative bg-zinc-900 aspect-video md:aspect-auto md:min-h-full group overflow-hidden">
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbnail} alt="Cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-white/20">image</span>
                  </div>
                )}
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                  <span className="text-white font-bold text-[10px] tracking-[0.15em] uppercase bg-black/40 self-start px-2 py-1">
                    Aperçu Couverture
                  </span>
                  <div className="flex gap-3">
                    <button className="bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#22c55e] transition-colors">
                      Remplacer
                    </button>
                    <button className="border border-white/30 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                      Éditer
                    </button>
                  </div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#22c55e]" />
              </div>
            </section>

            {/* Stats row */}
            <section className="bg-white p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Apprenants", value: formation.studentsCount.toLocaleString("fr-FR") },
                { label: "Avis", value: formation.reviewsCount.toLocaleString("fr-FR") },
                { label: "Note", value: formation.rating > 0 ? `${formation.rating.toFixed(1)}/5` : "—" },
                { label: "Statut", value: status.label },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-extrabold tabular-nums text-zinc-900">{stat.value}</p>
                </div>
              ))}
            </section>

            {/* Footer action bar */}
            <div className="flex flex-col md:flex-row justify-between items-center py-8 md:py-12 border-t border-[#e8e8e8] gap-6">
              <p className="text-zinc-500 text-xs italic">
                {saveMutation.isPending
                  ? "Sauvegarde en cours…"
                  : lastSavedAt
                  ? `Enregistré à ${lastSavedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                  : dirty
                  ? "Modifications non enregistrées"
                  : "À jour"}
              </p>
              <div className="flex gap-0 w-full md:w-auto">
                <button
                  onClick={saveDraft}
                  disabled={!dirty || saveMutation.isPending}
                  className="flex-1 md:flex-none bg-[#e8e8e8] text-zinc-900 px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#dadada] transition-colors disabled:opacity-40"
                >
                  {saveMutation.isPending ? "…" : "Enregistrer"}
                </button>
                <button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending || formation.status === "ACTIF"}
                  className="flex-1 md:flex-none bg-[#22c55e] text-[#004b1e] px-12 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#4ae176] transition-all disabled:opacity-40"
                >
                  {publishMutation.isPending
                    ? "…"
                    : formation.status === "ACTIF"
                    ? "Déjà publié"
                    : formation.status === "EN_ATTENTE"
                    ? "En validation"
                    : "Publier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
