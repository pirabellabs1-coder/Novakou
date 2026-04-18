"use client";

/**
 * Drop-in notes panel for a specific student — used on the mentor
 * "apprenants" detail page. Lists all notes for (mentor, student) pair
 * with a quick-add form + inline edit/delete.
 */

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

interface Note {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function StudentNotesInline({ studentId, studentName }: { studentId: string; studentName?: string }) {
  const toast = useToastStore.getState().addToast;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/formations/mentor/notes?studentId=${studentId}`);
      const j = await res.json();
      setNotes(Array.isArray(j.data) ? j.data : []);
    } catch {
      toast("error", "Impossible de charger les notes.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [studentId]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/formations/mentor/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, content: content.trim(), tags }),
      });
      const j = await res.json();
      if (!res.ok) { toast("error", j.error || "Erreur"); return; }
      toast("success", "Note ajoutée");
      setContent(""); setTags([]);
      load();
    } finally { setSaving(false); }
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return;
    const res = await fetch(`/api/formations/mentor/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    });
    const j = await res.json();
    if (!res.ok) { toast("error", j.error || "Erreur"); return; }
    toast("success", "Note mise à jour");
    setEditingId(null);
    load();
  }

  async function removeNote(id: string) {
    if (!confirm("Supprimer cette note ?")) return;
    const res = await fetch(`/api/formations/mentor/notes/${id}`, { method: "DELETE" });
    if (res.ok) { toast("success", "Note supprimée"); load(); }
    else toast("error", "Erreur");
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return "à l'instant";
    if (h < 24) return `il y a ${h}h`;
    if (d === 1) return "hier";
    return `il y a ${d}j`;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Notes privées {studentName ? `— ${studentName}` : ""}
          </h3>
          <p className="text-[11px] text-slate-500">Visible uniquement par vous. Pas par l&apos;apprenant.</p>
        </div>
        <span className="text-[11px] font-bold text-slate-400">{notes.length} note{notes.length > 1 ? "s" : ""}</span>
      </div>

      <form onSubmit={submit} className="space-y-2.5 mb-4 pb-4 border-b border-slate-100">
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Objectifs, blocages, next steps…"
          maxLength={10_000}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
        />
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold"
              >
                {t}
                <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="hover:text-rose-600">
                  <span className="material-symbols-outlined text-[12px]">close</span>
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
              placeholder={tags.length === 0 ? "+ tag (entrée)" : ""}
              className="flex-1 min-w-[80px] px-2 py-1 text-[11px] bg-transparent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            {saving ? "…" : "Ajouter"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-center py-4 text-xs text-slate-400">Aucune note pour cet apprenant.</p>
      ) : (
        <div className="space-y-2.5">
          {notes.map((n) => (
            <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(n.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {n.tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold text-slate-600">
                          #{t}
                        </span>
                      ))}
                      <span className="text-[10px] text-slate-400">{timeAgo(n.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingId(n.id); setEditContent(n.content); }}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500"
                        title="Modifier"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                      <button
                        onClick={() => removeNote(n.id)}
                        className="p-1 rounded hover:bg-rose-100 text-rose-500"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
