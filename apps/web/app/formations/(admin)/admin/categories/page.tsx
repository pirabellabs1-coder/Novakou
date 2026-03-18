"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface AdminCategory {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
  _count: { formations: number };
}

const DEFAULT_FORM = { nameFr: "", nameEn: "", slug: "", icon: "📚", color: "#6C2BD9" };

export default function AdminFormationsCategoriesPage() {
  const t = useTranslations("formations_nav");
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
    setForm({ nameFr: cat.nameFr, nameEn: cat.nameEn, slug: cat.slug, icon: cat.icon, color: cat.color });
    setShowForm(true);
  };

  const cancel = () => { setShowForm(false); setEditingId(null); setForm(DEFAULT_FORM); };

  const autoSlug = (nameFr: string) =>
    nameFr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const save = async () => {
    setSaving(true);
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/formations/categories/${editingId}` : "/api/admin/formations/categories";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    cancel();
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    await fetch(`/api/admin/formations/categories/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("admin_categories_title")}</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_FORM); }} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <span className="material-symbols-outlined text-lg">add</span>
          {t("admin_new_category")}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-primary/30 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{editingId ? t("admin_edit_category") : t("admin_new_category")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("admin_name_fr")} *</label>
              <input value={form.nameFr} onChange={(e) => setForm({ ...form, nameFr: e.target.value, slug: autoSlug(e.target.value) })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="ex: Développement Web" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("admin_name_en")} *</label>
              <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="ex: Web Development" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">{t("admin_icon")}</label>
                <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm text-center text-xl focus:outline-none focus:ring-1 focus:ring-primary" maxLength={4} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">{t("admin_color")}</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer" />
                  <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={cancel} className="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300">
              <span className="material-symbols-outlined text-lg">close</span> {t("cancel")}
            </button>
            <button onClick={save} disabled={!form.nameFr || !form.nameEn || saving} className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-lg">check</span> {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-slate-400">{t("loading")}</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-slate-400">{t("admin_no_categories")}</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <span className="material-symbols-outlined text-slate-400 cursor-grab">drag_indicator</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>{cat.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">{cat.nameFr}</p>
                  <span className="text-slate-400 text-sm">/ {cat.nameEn}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">/formations/categories/{cat.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{cat._count.formations} formation{cat._count.formations > 1 ? "s" : ""}</span>
                <button onClick={() => startEdit(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button onClick={() => setDeleteId(cat.id)} disabled={cat._count.formations > 0} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title={cat._count.formations > 0 ? t("admin_category_in_use") : t("admin_delete")}>
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-bold mb-2 text-slate-900 dark:text-white">{t("admin_delete_category_title")}</h2>
            <p className="text-sm text-slate-500 mb-4">{t("admin_delete_irreversible")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700 transition-colors text-sm text-slate-700 dark:text-slate-300">{t("cancel")}</button>
              <button onClick={() => deleteCategory(deleteId)} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">{t("admin_delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
