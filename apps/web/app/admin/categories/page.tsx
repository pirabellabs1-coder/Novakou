"use client";

import { useState, useMemo, useEffect } from "react";
import { useToastStore } from "@/store/toast";
import { useAdminStore, type AdminCategory } from "@/store/admin";
import { cn } from "@/lib/utils";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ICON_OPTIONS = ["code", "palette", "campaign", "edit_note", "smartphone", "cloud", "school", "psychology", "movie", "music_note", "translate", "security", "photo_camera", "analytics", "build"];
const COLOR_OPTIONS = ["#6C2BD9", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#14B8A6", "#8B5CF6", "#EF4444", "#D946EF", "#F97316", "#06B6D4"];

type ModalMode = null | "add" | "edit";

const emptyForm: { name: string; slug: string; icon: string; color: string; description: string; order: number; status: string } = { name: "", slug: "", icon: "code", color: "#6C2BD9", description: "", order: 1, status: "actif" };

function CategoriesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 bg-border-dark rounded-lg" />
          <div className="h-4 w-56 bg-border-dark rounded-lg mt-2" />
        </div>
        <div className="h-10 w-44 bg-border-dark rounded-lg" />
      </div>
      <div className="h-10 w-72 bg-border-dark rounded-xl" />
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="space-y-0">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border-dark/50">
              <div className="h-4 w-6 bg-border-dark rounded" />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 bg-border-dark rounded-lg" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-border-dark rounded" />
                  <div className="h-3 w-48 bg-border-dark rounded" />
                </div>
              </div>
              <div className="h-4 w-24 bg-border-dark rounded" />
              <div className="h-5 w-10 bg-border-dark rounded" />
              <div className="h-6 w-14 bg-border-dark rounded-full" />
              <div className="flex gap-1">
                <div className="h-8 w-8 bg-border-dark rounded-lg" />
                <div className="h-8 w-8 bg-border-dark rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const { addToast } = useToastStore();
  const { categories, loading, syncCategories } = useAdminStore();

  const [modal, setModal] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    syncCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => {
    let list = [...categories].sort((a, b) => a.order - b.order);
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [categories, search]);

  function openAdd() {
    setForm({ ...emptyForm, order: categories.length + 1 });
    setEditId(null);
    setModal("add");
  }

  function openEdit(cat: AdminCategory) {
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color, description: "", order: cat.order, status: cat.status });
    setEditId(cat.id);
    setModal("edit");
  }

  async function handleSave() {
    if (!form.name.trim()) { addToast("warning", "Le nom est requis"); return; }

    try {
      if (modal === "add") {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, slug: form.slug, icon: form.icon, color: form.color, description: form.description, order: form.order }),
        });
        const data = await res.json();
        if (!res.ok) { addToast("error", data.error || "Erreur lors de la creation"); return; }
        addToast("success", `Categorie "${form.name}" creee`);
      } else if (editId) {
        const res = await fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, name: form.name, slug: form.slug, icon: form.icon, color: form.color, description: form.description, order: form.order, isActive: form.status === "actif" }),
        });
        const data = await res.json();
        if (!res.ok) { addToast("error", data.error || "Erreur lors de la modification"); return; }
        addToast("success", `Categorie "${form.name}" mise a jour`);
      }
      syncCategories();
      setModal(null);
    } catch {
      addToast("error", "Erreur de connexion");
    }
  }

  async function handleDelete(id: string) {
    const cat = categories.find(c => c.id === id);
    const linkedServices = cat?.servicesCount ?? 0;
    if (linkedServices > 0) {
      addToast("warning", `${linkedServices} service(s) utilisent cette catégorie. Réassignez-les d'abord.`);
      setDeleteConfirm(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { addToast("error", data.error || "Erreur lors de la suppression"); setDeleteConfirm(null); return; }
      addToast("success", `Categorie supprimee`);
      syncCategories();
      setDeleteConfirm(null);
    } catch {
      addToast("error", "Erreur de connexion");
      setDeleteConfirm(null);
    }
  }

  async function toggleStatus(cat: AdminCategory) {
    try {
      const newActive = cat.status !== "actif";
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, isActive: newActive }),
      });
      if (!res.ok) { addToast("error", "Erreur lors du changement de statut"); return; }
      addToast("success", `Categorie "${cat.name}" ${newActive ? "activee" : "desactivee"}`);
      syncCategories();
    } catch {
      addToast("error", "Erreur de connexion");
    }
  }

  const activeCount = categories.filter(c => c.status === "actif").length;
  const totalServices = categories.reduce((s, c) => s + c.servicesCount, 0);

  if (loading.categories) return <CategoriesSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">category</span>
            Catégories
          </h1>
          <p className="text-slate-400 text-sm mt-1">{activeCount} actives sur {categories.length} — {totalServices} services au total</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          Nouvelle catégorie
        </button>
      </div>

      {/* Recherche */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une catégorie..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-dark bg-neutral-dark text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
      </div>

      {/* Tableau */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dark">
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">#</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Catégorie</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Slug</th>
                <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Services</th>
                <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Statut</th>
                <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(cat => (
                <tr key={cat.id} className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-500 font-mono">{cat.order}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                        <span className="material-symbols-outlined" style={{ color: cat.color }}>{cat.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{cat.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-400">{cat.slug}</td>
                  <td className="px-5 py-3 text-center text-sm font-bold text-white">{cat.servicesCount}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => toggleStatus(cat)} className={cn("text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors", cat.status === "actif" ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30")}>
                      {cat.status === "actif" ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors" title="Modifier">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Supprimer">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-600">category</span>
            <p className="text-slate-500 mt-2">Aucune catégorie trouvée</p>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-lg border border-border-dark shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-white mb-6">{modal === "add" ? "Nouvelle catégorie" : "Modifier la catégorie"}</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nom *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white outline-none focus:ring-2 focus:ring-primary/30" placeholder="ex: Développement Web" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Slug</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-slate-400 font-mono outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white outline-none resize-none focus:ring-2 focus:ring-primary/30" placeholder="Courte description de la catégorie..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Icône</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_OPTIONS.map(icon => (
                      <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))} className={cn("w-9 h-9 rounded-lg flex items-center justify-center border transition-colors", form.icon === icon ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-400 hover:text-white")}>
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Couleur</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_OPTIONS.map(color => (
                      <button key={color} onClick={() => setForm(f => ({ ...f, color }))} className={cn("w-9 h-9 rounded-lg border-2 transition-all", form.color === color ? "border-white scale-110" : "border-transparent")} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Ordre d&apos;affichage</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white outline-none focus:ring-2 focus:ring-primary/30" min={1} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Statut</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary/30">
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 rounded-xl border border-border-dark/50 bg-background-dark/30">
              <p className="text-xs text-slate-500 mb-2">Aperçu :</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: form.color + "20" }}>
                  <span className="material-symbols-outlined" style={{ color: form.color }}>{form.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{form.name || "Nom de la catégorie"}</p>
                  <p className="text-xs text-slate-500">{form.slug || "slug-auto-genere"}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">{modal === "add" ? "Créer" : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-sm border border-border-dark shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">warning</span>
              </div>
              <h3 className="font-bold text-lg text-white">Supprimer cette catégorie ?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">Cette action est irréversible. Les services associés devront être réassignés.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
