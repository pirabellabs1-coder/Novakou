"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  kind: "pdf" | "video" | "link" | "audio" | "other";
  url: string;
  fileSize: number | null;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
}

const KIND_ICON: Record<Resource["kind"], string> = {
  pdf: "picture_as_pdf",
  video: "smart_display",
  audio: "graphic_eq",
  link: "link",
  other: "folder",
};

const KIND_LABEL: Record<Resource["kind"], string> = {
  pdf: "PDF",
  video: "Vidéo",
  audio: "Audio",
  link: "Lien",
  other: "Autre",
};

function fmtSize(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function MentorResourcesPage() {
  const toast = useToastStore.getState().addToast;
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Resource["kind"]>("link");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/mentor/resources");
      const j = await res.json();
      setResources(Array.isArray(j.data) ? j.data : []);
    } catch {
      toast("error", "Impossible de charger les ressources.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags((p) => [...p, t]);
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/formations/mentor/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          kind,
          url: url.trim(),
          description: description.trim() || null,
          tags,
          isPublic,
        }),
      });
      const j = await res.json();
      if (!res.ok) { toast("error", j.error || "Erreur"); return; }
      toast("success", "Ressource ajoutée");
      setTitle(""); setUrl(""); setDescription(""); setTags([]);
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1100px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="text-[#006e2f] font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">
              Contenu
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Bibliothèque de ressources
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              PDF, vidéos et liens à partager avec vos apprenants après une séance.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add_circle"}</span>
            {showForm ? "Fermer" : "Nouvelle ressource"}
          </button>
        </header>

        {showForm && (
          <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Template brief client"
                  maxLength={120}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Type</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as Resource["kind"])}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="link">Lien</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Vidéo</option>
                  <option value="audio">Audio</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">URL</label>
              <input
                type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Lien public (Drive, Cloudinary, YouTube non-listé, etc.)
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Description (optionnelle)</label>
              <textarea
                rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tags</label>
              <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl border border-slate-200 min-h-[42px] bg-white">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                    {t}
                    <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </span>
                ))}
                <input
                  type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
                  }}
                  placeholder={tags.length === 0 ? "Ajouter un tag (Entrée)" : ""}
                  className="flex-1 min-w-[120px] text-xs bg-transparent focus:outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4" />
              <span className="text-slate-700">
                Rendre visible sur mon profil public (freebies, lead magnets…)
              </span>
            </label>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
                {saving ? "Ajout…" : "Ajouter"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
                Annuler
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">folder_open</span>
            <p className="text-base font-bold text-slate-700 mt-3">Votre bibliothèque est vide</p>
            <p className="text-sm text-slate-500 mt-1">
              Ajoutez des PDF, templates et vidéos à partager avec vos apprenants.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {resources.map((r) => (
              <div key={r.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-700">
                  <span className="material-symbols-outlined text-[20px]">{KIND_ICON[r.kind]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {KIND_LABEL[r.kind]}
                    </span>
                    {r.isPublic && (
                      <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                        Public
                      </span>
                    )}
                  </div>
                  {r.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.description}</p>}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {r.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-bold">#{t}</span>
                    ))}
                    {r.fileSize ? (
                      <span className="text-[10px] text-slate-400">· {fmtSize(r.fileSize)}</span>
                    ) : null}
                  </div>
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                  title="Ouvrir"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
