"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, GripVertical, X, Check } from "lucide-react";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
  _count: { formations: number };
}

const DEFAULT_FORM = { name: "", slug: "", icon: "📚", color: "#6C2BD9" };

export default function AdminFormationsCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = () => {
    fetch("/api/admin/formations/categories")
      .then((r) => r.json())
      .then((d) => { setCategories(d.categories ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const startEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color });
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const save = async () => {
    setSaving(true);
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/formations/categories/${editingId}` : "/api/admin/formations/categories";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    cancel();
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    await fetch(`/api/admin/formations/categories/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchCategories();
  };

  const autoSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Catégories — Formations</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_FORM); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle catégorie
        </button>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 bg-border-dark/30 rounded-xl p-1 w-fit">
        {([
          ["/admin/formations/dashboard", "Dashboard"],
          ["/admin/formations/liste", "Formations"],
          ["/admin/formations/instructeurs", "Instructeurs"],
          ["/admin/formations/apprenants", "Apprenants"],
          ["/admin/formations/finances", "Finances"],
          ["/admin/formations/certificats", "Certificats"],
          ["/admin/formations/categories", "Catégories"],
        ] as [string, string][]).map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              href.includes("categories") ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-border-dark/50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-neutral-dark border border-primary/30 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white">{editingId ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nom FR *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })}
                className="w-full bg-border-dark border border-border-dark/60 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ex: Développement Web"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-border-dark border border-border-dark/60 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1 block">Icône (emoji)</label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full bg-border-dark border border-border-dark/60 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-center text-xl"
                  maxLength={4}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1 block">Couleur</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-border-dark bg-transparent cursor-pointer"
                  />
                  <input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="flex-1 bg-border-dark border border-border-dark/60 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={cancel} className="flex items-center gap-1.5 text-sm border border-border-dark text-slate-300 px-4 py-2 rounded-xl hover:bg-border-dark/50 transition-colors">
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              onClick={save}
              disabled={!form.name || saving}
              className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-slate-400">Chargement...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Aucune catégorie</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="bg-neutral-dark border border-border-dark rounded-xl p-4 flex items-center gap-4">
              <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{cat.name}</p>
                </div>
                <p className="text-xs text-slate-500 font-mono">/formations/categories/{cat.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{cat._count.formations} formation{cat._count.formations > 1 ? "s" : ""}</span>
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  disabled={cat._count.formations > 0}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={cat._count.formations > 0 ? "Des formations utilisent cette catégorie" : "Supprimer"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteId(null)} />
          <div className="relative bg-neutral-dark border border-border-dark rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-white mb-2">Supprimer la catégorie ?</h2>
            <p className="text-sm text-slate-400 mb-4">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-border-dark text-slate-300 py-2.5 rounded-xl hover:bg-border-dark/50 transition-colors text-sm">Annuler</button>
              <button onClick={() => deleteCategory(deleteId)} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
