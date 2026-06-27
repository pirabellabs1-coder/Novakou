"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ST, StPageHeader, StCard, StChip } from "@/components/stitch";
import { ArrowLeft, GraduationCap, Plus, Pencil, Trash2, Loader2, Check, X, Video, FileText, Link2 as LinkIcon } from "lucide-react";

interface Resource {
  id: string; title: string; description: string | null; type: string; url: string;
  thumbnail: string | null; category: string; published: boolean; order: number; views?: number;
}
const EMPTY = { title: "", description: "", type: "VIDEO", url: "", thumbnail: "", category: "Général", order: 0, published: true };
const TYPE_META: Record<string, { label: string; icon: typeof Video; tone: "green" | "blue" | "amber" }> = {
  VIDEO: { label: "Vidéo", icon: Video, tone: "green" },
  PDF: { label: "PDF", icon: FileText, tone: "blue" },
  LINK: { label: "Lien", icon: LinkIcon, tone: "amber" },
};

export default function AdminAcademiePage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<typeof EMPTY & { id?: string }>({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/formations/admin/academy");
    if (r.ok) setItems((await r.json()).data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setForm({ ...EMPTY }); setShowForm(true); }
  function openEdit(r: Resource) {
    setForm({ id: r.id, title: r.title, description: r.description ?? "", type: r.type, url: r.url, thumbnail: r.thumbnail ?? "", category: r.category, order: r.order, published: r.published });
    setShowForm(true);
  }
  async function save() {
    if (!form.title.trim() || !form.url.trim()) { alert("Titre et URL obligatoires."); return; }
    setBusy(true);
    const isEdit = !!form.id;
    await fetch(isEdit ? `/api/formations/admin/academy/${form.id}` : "/api/formations/admin/academy", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    setBusy(false); setShowForm(false); await load();
  }
  async function togglePublish(r: Resource) {
    await fetch(`/api/formations/admin/academy/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !r.published }) }).catch(() => null);
    await load();
  }
  async function remove(r: Resource) {
    if (!confirm(`Supprimer « ${r.title} » ?`)) return;
    await fetch(`/api/formations/admin/academy/${r.id}`, { method: "DELETE" }).catch(() => null);
    await load();
  }

  const inputCls = "w-full text-[13px] rounded-lg px-3 py-2 border";
  const inputStyle = { borderColor: ST.cardBorder, color: ST.text };

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1100px] mx-auto">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold mb-3 hover:underline" style={{ color: ST.green }}>
          <ArrowLeft size={15} /> Tableau de bord
        </Link>
        <StPageHeader
          title="Académie"
          subtitle="Créez des formations (vidéo, PDF, lien) mises à disposition de tous les utilisateurs."
          actions={
            <button onClick={openNew} className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold px-3.5 py-2 rounded-[12px] text-white" style={{ background: ST.green }}>
              <Plus size={15} /> Nouvelle ressource
            </button>
          }
        />

        {showForm && (
          <StCard className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-extrabold text-[15px]" style={{ color: ST.text }}>{form.id ? "Modifier la ressource" : "Nouvelle ressource"}</p>
              <button onClick={() => setShowForm(false)}><X size={18} style={{ color: ST.textMuted }} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[11.5px] font-bold block mb-1" style={{ color: ST.text }}>Titre *</label>
                <input className={inputCls} style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Comment créer une fiche produit qui vend" />
              </div>
              <div>
                <label className="text-[11.5px] font-bold block mb-1" style={{ color: ST.text }}>Type</label>
                <select className={inputCls} style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="VIDEO">Vidéo (YouTube / Vimeo)</option>
                  <option value="PDF">PDF (lien public)</option>
                  <option value="LINK">Lien externe</option>
                </select>
              </div>
              <div>
                <label className="text-[11.5px] font-bold block mb-1" style={{ color: ST.text }}>Catégorie</label>
                <input className={inputCls} style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Vendre, Visuels, Paiement…" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11.5px] font-bold block mb-1" style={{ color: ST.text }}>
                  {form.type === "VIDEO" ? "URL vidéo (YouTube/Vimeo) *" : form.type === "PDF" ? "URL du PDF (lien public) *" : "URL du lien *"}
                </label>
                <input className={inputCls} style={inputStyle} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11.5px] font-bold block mb-1" style={{ color: ST.text }}>Description</label>
                <textarea className={`${inputCls} resize-y`} style={inputStyle} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="À quoi sert cette formation ?" />
              </div>
              <div>
                <label className="text-[11.5px] font-bold block mb-1" style={{ color: ST.text }}>Vignette (URL image, optionnel)</label>
                <input className={inputCls} style={inputStyle} value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://… (sinon auto pour YouTube)" />
              </div>
              <div>
                <label className="text-[11.5px] font-bold block mb-1" style={{ color: ST.text }}>Ordre d'affichage</label>
                <input type="number" className={inputCls} style={inputStyle} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <label className="flex items-center gap-2 text-[12.5px] font-bold cursor-pointer" style={{ color: ST.text }}>
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Publiée
              </label>
              <div className="flex-1" />
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold px-4 py-2 rounded-lg text-white disabled:opacity-40" style={{ background: ST.green }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Enregistrer
              </button>
            </div>
          </StCard>
        )}

        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <StCard key={i}><div className="h-16 animate-pulse" /></StCard>)}</div>
        ) : items.length === 0 ? (
          <StCard><div className="flex flex-col items-center py-10 text-center">
            <GraduationCap size={30} style={{ color: ST.textMuted }} />
            <p className="text-[13px] mt-2" style={{ color: ST.textMuted }}>Aucune ressource. Cliquez « Nouvelle ressource » pour commencer.</p>
          </div></StCard>
        ) : (
          <div className="space-y-2.5">
            {items.map((r) => {
              const tm = TYPE_META[r.type] ?? TYPE_META.LINK;
              const Icon = tm.icon;
              return (
                <StCard key={r.id}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Icon size={16} style={{ color: ST.green }} />
                        <span className="font-extrabold text-[14.5px]" style={{ color: ST.text }}>{r.title}</span>
                        <StChip tone={tm.tone}>{tm.label}</StChip>
                        <StChip tone="neutral">{r.category}</StChip>
                        {!r.published && <StChip tone="amber">Brouillon</StChip>}
                      </div>
                      {r.description && <p className="text-[12px]" style={{ color: ST.textSecondary }}>{r.description}</p>}
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[11px] underline break-all" style={{ color: ST.textMuted }}>{r.url}</a>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => togglePublish(r)} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border" style={{ borderColor: ST.cardBorder, color: r.published ? ST.green : ST.textMuted }}>
                        {r.published ? "Publiée" : "Publier"}
                      </button>
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg border" style={{ borderColor: ST.cardBorder }}><Pencil size={14} style={{ color: ST.textSecondary }} /></button>
                      <button onClick={() => remove(r)} className="p-1.5 rounded-lg border" style={{ borderColor: ST.cardBorder }}><Trash2 size={14} style={{ color: ST.roseText }} /></button>
                    </div>
                  </div>
                </StCard>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
