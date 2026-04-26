"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LessonVideoPlayer, { isValidVideoUrl, getVideoProviderLabel } from "@/components/formations/LessonVideoPlayer";
import { useToastStore } from "@/store/toast";
import { ImageUploader } from "@/components/formations/ImageUploader";
import { confirmAction } from "@/store/confirm";
import { promptAction } from "@/store/prompt";

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
  const [isFree, setIsFree] = useState(false);
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
      setIsFree(!!formation.isFree);
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

  const toast = useToastStore.getState().addToast;

  const publishMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/formations/vendeur/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIF" }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["formation", id] });
      if (res?.error) toast("error", res.error);
      else toast("success", "Formation publiée 🎉");
    },
    onError: () => toast("error", "Publication impossible"),
  });

  const createSectionMutation = useMutation({
    mutationFn: (title?: string) =>
      fetch("/api/formations/vendeur/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId: id, title: title?.trim() || undefined }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res?.error) {
        toast("error", res.error);
        return;
      }
      qc.invalidateQueries({ queryKey: ["formation", id] });
      toast("success", "Module ajouté");
    },
    onError: () => toast("error", "Création du module impossible"),
  });

  const createLessonMutation = useMutation({
    mutationFn: (sectionId: string) =>
      fetch("/api/formations/vendeur/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res?.error) {
        toast("error", res.error);
        return;
      }
      qc.invalidateQueries({ queryKey: ["formation", id] });
      // Sélectionne la nouvelle leçon automatiquement
      if (res?.data?.id) setSelectedLessonId(res.data.id);
      toast("success", "Leçon ajoutée");
    },
    onError: () => toast("error", "Création de la leçon impossible"),
  });

  async function addModule() {
    const title = await promptAction({
      title: "Nouveau module",
      message: "Donnez un titre clair à votre module (chapitre / partie de la formation).",
      placeholder: "Ex : Introduction, Fondamentaux, Pratique…",
      defaultValue: `Module ${(formation?.sections.length ?? 0) + 1}`,
      confirmLabel: "Créer le module",
      icon: "library_add",
      validate: (v) => (v.length < 1 ? "Le titre ne peut pas être vide" : v.length > 200 ? "Maximum 200 caractères" : null),
    });
    if (title === null) return; // Annulé
    createSectionMutation.mutate(title);
  }

  function addLesson(sectionId: string) {
    createLessonMutation.mutate(sectionId);
  }

  // Mise à jour du thumbnail via l'ImageUploader (auto-save)
  const thumbnailMutation = useMutation({
    mutationFn: (url: string | null) =>
      fetch(`/api/formations/vendeur/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnail: url }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["formation", id] });
      toast("success", "Couverture mise à jour");
    },
    onError: () => toast("error", "Échec de la mise à jour de la couverture"),
  });

  const [coverEditorOpen, setCoverEditorOpen] = useState(false);

  function onFieldChange<T>(setter: (v: T) => void, v: T) {
    setter(v);
    setDirty(true);
  }

  function saveDraft() {
    saveMutation.mutate({
      title,
      shortDesc,
      price: isFree ? 0 : price,
      isFree,
      thumbnail,
      hiddenFromMarketplace,
    });
  }

  // Mutations rapides : changer le statut sans toucher au reste du formulaire
  const statusMutation = useMutation({
    mutationFn: (newStatus: "BROUILLON" | "ACTIF" | "ARCHIVE") =>
      fetch(`/api/formations/vendeur/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }).then((r) => r.json()),
    onSuccess: (res, status) => {
      qc.invalidateQueries({ queryKey: ["formation", id] });
      if (res?.error) toast("error", res.error);
      else if (status === "BROUILLON") toast("success", "Repassée en brouillon");
      else if (status === "ARCHIVE") toast("success", "Formation archivée");
    },
    onError: () => toast("error", "Changement de statut impossible"),
  });

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
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
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
                <button
                  onClick={addModule}
                  disabled={createSectionMutation.isPending}
                  title="Ajouter un module"
                  className="text-[#22c55e] hover:bg-[#e8e8e8] p-1 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">add_box</span>
                </button>
              </div>

              {formation.sections.length === 0 ? (
                <div className="p-6 bg-[#f3f3f4] border-l-4 border-[#bccbb9] space-y-3">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Aucun module pour l&apos;instant. Créez votre premier module pour commencer à structurer la formation.
                  </p>
                  <button
                    onClick={addModule}
                    disabled={createSectionMutation.isPending}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-[#006e2f] hover:bg-[#22c55e] transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    {createSectionMutation.isPending ? "Création…" : "Créer un module"}
                  </button>
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
                        <button
                          onClick={() => addLesson(section.id)}
                          disabled={createLessonMutation.isPending}
                          className="flex items-center gap-2 text-[10px] font-bold text-[#006e2f] uppercase tracking-widest hover:underline mt-2 py-1 disabled:opacity-50"
                        >
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

            {/* Video for selected lesson */}
            <LessonVideoEditorSection
              selectedLesson={selectedLesson}
              onSaved={() => {
                // Re-fetch formation pour refléter la nouvelle URL
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("novakou:lesson-updated"));
                }
              }}
            />

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

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tarification</label>

                    {/* Toggle Gratuit / Payant */}
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#bccbb9]">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-zinc-700">
                          {isFree ? "Formation gratuite" : "Formation payante"}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {isFree
                            ? "Accessible sans paiement à tous les apprenants"
                            : "Les apprenants paient pour accéder au contenu"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onFieldChange(setIsFree, !isFree);
                          if (!isFree) onFieldChange(setPrice, 0);
                        }}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isFree ? "bg-[#006e2f]" : "bg-zinc-300"}`}
                        aria-pressed={isFree}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isFree ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>

                    {/* Prix (uniquement si payant) */}
                    {!isFree && (
                      <div className="pt-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Prix (FCFA)</label>
                        <input
                          type="number"
                          value={price}
                          min={0}
                          onChange={(e) => onFieldChange(setPrice, Number(e.target.value))}
                          className="w-full bg-transparent border-b border-[#bccbb9] py-2 focus:border-[#22c55e] outline-none tabular-nums text-lg font-bold transition-colors"
                        />
                        <p className="text-[10px] text-zinc-400 tabular-nums">≈ {formatFCFA(price / 655.957)} €</p>
                      </div>
                    )}
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
                {coverEditorOpen ? (
                  <div className="absolute inset-0 bg-white p-6 md:p-8 overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">
                        Modifier la couverture
                      </p>
                      <button
                        onClick={() => setCoverEditorOpen(false)}
                        className="p-1 text-zinc-400 hover:text-zinc-700"
                        title="Fermer"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                    <ImageUploader
                      value={thumbnail}
                      onChange={(url) => {
                        setThumbnail(url);
                        thumbnailMutation.mutate(url || null);
                      }}
                      folder="portfolio"
                      aspectClass="aspect-video"
                      helper="Recommandé : 1280×720px · JPG ou PNG · Max 5 MB"
                    />
                  </div>
                ) : (
                  <>
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
                        <button
                          onClick={() => setCoverEditorOpen(true)}
                          className="bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#22c55e] transition-colors"
                        >
                          {thumbnail ? "Remplacer" : "Ajouter"}
                        </button>
                        {thumbnail && (
                          <button
                            onClick={async () => {
                              const ok = await confirmAction({
                                title: "Supprimer la couverture ?",
                                message: "L'image de couverture sera retirée de la formation. Vous pourrez en remettre une à tout moment.",
                                confirmLabel: "Supprimer",
                                confirmVariant: "danger",
                                icon: "image_not_supported",
                              });
                              if (ok) {
                                setThumbnail("");
                                thumbnailMutation.mutate(null);
                              }
                            }}
                            className="border border-white/30 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
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
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={saveDraft}
                  disabled={!dirty || saveMutation.isPending}
                  className="flex-1 md:flex-none bg-[#e8e8e8] text-zinc-900 px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#dadada] transition-colors disabled:opacity-40"
                >
                  {saveMutation.isPending ? "…" : "Enregistrer"}
                </button>

                {/* Si publié → bouton "Repasser en brouillon" (dépublier) */}
                {formation.status === "ACTIF" && (
                  <button
                    onClick={async () => {
                      const ok = await confirmAction({
                        title: "Repasser en brouillon ?",
                        message: "Votre formation ne sera plus visible publiquement. Vous pourrez la republier à tout moment.",
                        confirmLabel: "Repasser en brouillon",
                        cancelLabel: "Annuler",
                        confirmVariant: "warning",
                        icon: "edit_note",
                      });
                      if (ok) statusMutation.mutate("BROUILLON");
                    }}
                    disabled={statusMutation.isPending}
                    className="flex-1 md:flex-none bg-amber-100 text-amber-900 px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors disabled:opacity-40"
                  >
                    {statusMutation.isPending ? "…" : "Brouillon"}
                  </button>
                )}

                {/* Archiver (toujours sauf si déjà archivé) */}
                {formation.status !== "ARCHIVE" && (
                  <button
                    onClick={async () => {
                      const ok = await confirmAction({
                        title: "Archiver cette formation ?",
                        message: "Elle ne sera plus accessible aux nouveaux apprenants. Les inscrits actuels gardent l'accès.",
                        confirmLabel: "Archiver",
                        cancelLabel: "Annuler",
                        confirmVariant: "warning",
                        icon: "archive",
                      });
                      if (ok) statusMutation.mutate("ARCHIVE");
                    }}
                    disabled={statusMutation.isPending}
                    className="flex-1 md:flex-none bg-zinc-200 text-zinc-700 px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-40"
                  >
                    Archiver
                  </button>
                )}

                {/* Publier (visible quand pas ACTIF) */}
                {formation.status !== "ACTIF" && (
                  <button
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="flex-1 md:flex-none bg-[#22c55e] text-[#004b1e] px-10 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#4ae176] transition-all disabled:opacity-40"
                  >
                    {publishMutation.isPending ? "…" : "Publier"}
                  </button>
                )}

                {formation.status === "ACTIF" && (
                  <span className="flex items-center gap-1.5 px-4 py-4 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Publié
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LessonVideoEditorSection — Zone vidéo de la leçon (URL + preview + save)
// ─────────────────────────────────────────────────────────────────────

function LessonVideoEditorSection({
  selectedLesson,
  onSaved,
}: {
  selectedLesson: Lesson | undefined;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToastStore.getState().addToast;
  const [url, setUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Sync local state with selected lesson
  useEffect(() => {
    setUrl(selectedLesson?.videoUrl ?? "");
  }, [selectedLesson?.id, selectedLesson?.videoUrl]);

  if (!selectedLesson) {
    return (
      <section className="bg-[#f3f3f4] p-8 md:p-12 border-2 border-dashed border-[#bccbb9] flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
        <span className="material-symbols-outlined text-5xl text-[#22c55e]">list_alt</span>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-zinc-900">
            Sélectionnez une leçon
          </h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto mt-1">
            Choisissez une leçon dans la sidebar à gauche pour ajouter ou modifier sa vidéo.
          </p>
        </div>
      </section>
    );
  }

  const urlTrimmed = url.trim();
  const valid = urlTrimmed === "" || isValidVideoUrl(urlTrimmed);
  const changed = urlTrimmed !== (selectedLesson.videoUrl ?? "");
  const provider = urlTrimmed ? getVideoProviderLabel(urlTrimmed) : null;

  async function save() {
    if (!valid) {
      toast("warning", "URL vidéo invalide — YouTube, Vimeo ou lien MP4 direct");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/formations/vendeur/lessons/${selectedLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: urlTrimmed || null }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error ?? "Erreur lors de la sauvegarde");
        return;
      }
      toast("success", urlTrimmed ? "Vidéo mise à jour ✓" : "Vidéo supprimée");
      qc.invalidateQueries({ queryKey: ["formation"] });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[#006e2f] font-bold text-[10px] tracking-[0.15em] uppercase block">
            Vidéo de la leçon
          </span>
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 mt-1 truncate max-w-[28ch]">
            {selectedLesson.title}
          </h3>
        </div>
        {provider && valid && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[12px]">check_circle</span>
            {provider}
          </span>
        )}
      </div>

      {/* Live preview */}
      {urlTrimmed && valid ? (
        <LessonVideoPlayer
          videoUrl={urlTrimmed}
          title={selectedLesson.title}
          className="w-full"
        />
      ) : (
        <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-2">smart_display</span>
            <p className="text-sm font-semibold">Aucune vidéo pour l'instant</p>
            <p className="text-xs">Collez une URL YouTube, Vimeo ou un lien MP4 ci-dessous</p>
          </div>
        </div>
      )}

      {/* URL input */}
      <div>
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
          URL de la vidéo
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/... ou lien MP4 direct"
            className={`flex-1 px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none ${
              !valid ? "border-rose-300 focus:border-rose-500" : "border-zinc-200 focus:border-emerald-500"
            }`}
          />
          <button
            type="button"
            onClick={save}
            disabled={saving || !valid || !changed}
            className="px-5 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 shadow-md shadow-emerald-500/20"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            {saving ? "Sauvegarde…" : changed ? "Enregistrer" : "Enregistré"}
          </button>
        </div>
        {!valid && urlTrimmed && (
          <p className="text-xs text-rose-600 font-medium mt-1.5">
            Format non reconnu. Utilisez une URL YouTube, Vimeo, ou un lien direct .mp4/.webm/.mov.
          </p>
        )}
        <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
          <strong>Logo YouTube / Vimeo masqué</strong> sur la plateforme — vos apprenants voient
          uniquement le lecteur Novakou. Supporté : YouTube (watch / youtu.be / shorts / embed),
          Vimeo, fichiers MP4/WebM/MOV hébergés (Supabase, Cloudinary, etc.).
        </p>
      </div>
    </section>
  );
}

