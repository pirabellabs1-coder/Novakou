// Refonte design "Stitch" — ressources mentor — vert Novakou officiel — 2026-06-13.
// Logique 100% préservée : query resources, formulaire de création, gestion tags.
"use client";

import { useEffect, useState } from "react";
import {
  Library,
  FileText,
  Play,
  AudioLines,
  Link as LinkIcon,
  Folder,
  Plus,
  X,
  ExternalLink,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { useToastStore } from "@/store/toast";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StInput,
  StTextarea,
  ST,
} from "@/components/stitch";

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

const KIND_ICON: Record<Resource["kind"], LucideIcon> = {
  pdf: FileText,
  video: Play,
  audio: AudioLines,
  link: LinkIcon,
  other: Folder,
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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1100px] mx-auto">
        <StPageHeader
          title="Bibliothèque de ressources"
          subtitle="PDF, vidéos et liens à partager avec vos apprenants après une séance."
          actions={
            <StButton
              icon={showForm ? X : Plus}
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Fermer" : "Nouvelle ressource"}
            </StButton>
          }
        />

        {showForm && (
          <StCard className="mb-4 !p-[18px_20px]">
            <span className="text-[15px] font-extrabold block mb-4" style={{ color: ST.text }}>Ajouter une ressource</span>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StInput
                  label="Titre"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Template brief client"
                  maxLength={120}
                  required
                />
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Type</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as Resource["kind"])}
                    className="w-full rounded-[12px] bg-white px-[14px] py-[11px] text-[13.5px] font-semibold focus:outline-none"
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  >
                    <option value="link">Lien</option>
                    <option value="pdf">PDF</option>
                    <option value="video">Vidéo</option>
                    <option value="audio">Audio</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <StInput
                label="URL"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                required
                hint="Lien public (Drive, Cloudinary, YouTube non-listé, etc.)"
              />
              <StTextarea
                label="Description (optionnelle)"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
              />
              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>Tags</label>
                <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-[12px] min-h-[42px] bg-white" style={{ border: "1px solid #dde6e0" }}>
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold" style={{ background: ST.greenSoft, color: ST.green }}>
                      {t}
                      <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
                    }}
                    placeholder={tags.length === 0 ? "Ajouter un tag (Entrée)" : ""}
                    className="flex-1 min-w-[120px] text-[12px] font-semibold bg-transparent focus:outline-none"
                    style={{ color: ST.text }}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[12px]">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                <span className="font-semibold" style={{ color: ST.textSecondary }}>
                  Rendre visible sur mon profil public (freebies, lead magnets…)
                </span>
              </label>
              <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${ST.divider}` }}>
                <StButton type="submit" disabled={saving}>
                  {saving ? "Ajout…" : "Ajouter"}
                </StButton>
                <StButton variant="secondary" type="button" onClick={() => setShowForm(false)}>
                  Annuler
                </StButton>
              </div>
            </form>
          </StCard>
        )}

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-[14px] animate-pulse" style={{ background: "#e9efeb" }} />)}
          </div>
        ) : resources.length === 0 ? (
          <StCard className="text-center py-12">
            <FolderOpen size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
            <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>Votre bibliothèque est vide</p>
            <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
              Ajoutez des PDF, templates et vidéos à partager avec vos apprenants.
            </p>
            {!showForm && (
              <div className="mt-4">
                <StButton icon={Plus} onClick={() => setShowForm(true)}>Ajouter une ressource</StButton>
              </div>
            )}
          </StCard>
        ) : (
          <StCard noPadding>
            {resources.map((r, idx) => {
              const Icon = KIND_ICON[r.kind];
              return (
                <div
                  key={r.id}
                  className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                  style={idx ? { borderTop: `1px solid ${ST.divider}` } : undefined}
                >
                  <div className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: ST.greenSoft, color: ST.green }}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>{r.title}</p>
                      <StChip tone="neutral">{KIND_LABEL[r.kind]}</StChip>
                      {r.isPublic && <StChip tone="green">Public</StChip>}
                    </div>
                    {r.description && <p className="text-[11.5px] font-semibold mt-0.5 truncate" style={{ color: ST.textSecondary }}>{r.description}</p>}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {r.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-extrabold" style={{ background: "#f1efe8", color: "#5f5e5a" }}>#{t}</span>
                      ))}
                      {r.fileSize ? (
                        <span className="text-[10px] font-semibold" style={{ color: ST.textFaint }}>· {fmtSize(r.fileSize)}</span>
                      ) : null}
                    </div>
                  </div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-[10px] hover:bg-slate-200 transition-colors"
                    style={{ color: ST.textSecondary }}
                    title="Ouvrir"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              );
            })}
          </StCard>
        )}
      </main>
    </div>
  );
}
