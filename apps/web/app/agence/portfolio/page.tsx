"use client";

import { useState, useEffect } from "react";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  client: string;
  description: string;
  date: string;
  skills: string[];
  link?: string;
  featured: boolean;
  gradient: string;
}

// ---------------------------------------------------------------------------
// UI config (not data)
// ---------------------------------------------------------------------------
const GRADIENTS = [
  "from-violet-600 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-700",
  "from-rose-500 to-pink-700",
  "from-blue-500 to-cyan-700",
  "from-fuchsia-500 to-purple-700",
  "from-lime-500 to-green-700",
  "from-sky-500 to-blue-700",
];

const CATEGORIES = [
  "Tous",
  "Développement",
  "Design",
  "Marketing",
  "Mobile",
  "E-commerce",
  "Branding",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AgencePortfolio() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [filterCat, setFilterCat] = useState("Tous");
  const [showAdd, setShowAdd] = useState(false);
  const [editProject, setEditProject] = useState<PortfolioProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { addToast } = useToastStore();

  // Fetch portfolio from API on mount — stay empty on error
  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const res = await fetch("/api/agency/portfolio");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(
            data.map((p: PortfolioProject, i: number) => ({
              ...p,
              gradient: p.gradient || GRADIENTS[i % GRADIENTS.length],
            }))
          );
        }
      } catch {
        // Silently stay empty
      }
    }
    fetchPortfolio();
  }, []);

  // Form state shared by add & edit
  const emptyForm = {
    title: "",
    client: "",
    category: "Développement",
    description: "",
    skillsRaw: "",
    link: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Derived lists
  const featured = projects.filter((p) => p.featured);
  const filtered =
    filterCat === "Tous"
      ? projects.filter((p) => !p.featured)
      : projects.filter(
          (p) => p.category === filterCat && !p.featured
        );

  // ---- handlers ---------------------------------------------------------
  function openAdd() {
    setForm(emptyForm);
    setEditProject(null);
    setShowAdd(true);
  }

  function openEdit(p: PortfolioProject) {
    setForm({
      title: p.title,
      client: p.client,
      category: p.category,
      description: p.description,
      skillsRaw: p.skills.join(", "),
      link: p.link || "",
    });
    setEditProject(p);
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.title.trim() || !form.client.trim()) {
      addToast("error", "Le titre et le client sont obligatoires.");
      return;
    }
    const skills = form.skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editProject.id
            ? {
                ...p,
                title: form.title,
                client: form.client,
                category: form.category,
                description: form.description,
                skills,
                link: form.link || undefined,
              }
            : p
        )
      );
      addToast("success", "Projet mis à jour avec succès.");
    } else {
      const newProject: PortfolioProject = {
        id: "p" + Date.now(),
        title: form.title,
        client: form.client,
        category: form.category,
        description: form.description,
        skills,
        link: form.link || undefined,
        date: new Date().toISOString().slice(0, 10),
        featured: false,
        gradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      };
      setProjects((prev) => [...prev, newProject]);
      addToast("success", "Projet ajouté au portfolio.");
    }
    setShowAdd(false);
    setEditProject(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget));
    addToast("success", "Projet supprimé du portfolio.");
    setDeleteTarget(null);
  }

  function toggleFeatured(id: string) {
    setProjects((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      const currentFeaturedCount = prev.filter((p) => p.featured).length;
      if (!target.featured && currentFeaturedCount >= 3) {
        addToast("warning", "Maximum 3 projets en vedette.");
        return prev;
      }
      return prev.map((p) =>
        p.id === id ? { ...p, featured: !p.featured } : p
      );
    });
  }

  function moveProject(id: string, direction: "up" | "down") {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
    addToast("info", "Ordre mis à jour.");
  }

  // ---- render -----------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Portfolio</h1>
          <p className="text-slate-400 text-sm mt-1">
            Réalisations et projets phares de l&apos;agence.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Ajouter un projet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Projets total",
            value: projects.length.toString(),
            icon: "work_history",
            color: "text-primary",
          },
          {
            label: "En vedette",
            value: featured.length.toString(),
            icon: "star",
            color: "text-amber-400",
          },
          {
            label: "Catégories",
            value: [
              ...new Set(projects.map((p) => p.category)),
            ].length.toString(),
            icon: "category",
            color: "text-blue-400",
          },
          {
            label: "Clients servis",
            value: [
              ...new Set(projects.map((p) => p.client)),
            ].length.toString(),
            icon: "people",
            color: "text-emerald-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-3"
          >
            <span
              className={cn(
                "material-symbols-outlined text-xl",
                s.color
              )}
            >
              {s.icon}
            </span>
            <div>
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state when no projects at all */}
      {projects.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">
            photo_library
          </span>
          <h2 className="text-lg font-bold text-white mb-2">
            Aucun projet dans votre portfolio
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            Mettez en valeur les réalisations de votre agence en ajoutant vos
            premiers projets. Ils seront visibles sur votre profil public.
          </p>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Ajouter votre premier projet
          </button>
        </div>
      )}

      {/* Featured projects */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-amber-400 text-lg">
              star
            </span>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Projets en vedette
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((p) => (
              <div
                key={p.id}
                className="bg-neutral-dark rounded-xl border border-amber-500/30 overflow-hidden group"
              >
                {/* Gradient thumbnail */}
                <div
                  className={cn(
                    "h-36 bg-gradient-to-br flex items-end p-4 relative",
                    p.gradient
                  )}
                >
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={() => toggleFeatured(p.id)}
                      className="p-1.5 bg-black/40 backdrop-blur-sm rounded-lg text-amber-400 hover:bg-black/60 transition-colors"
                      title="Retirer des vedettes"
                    >
                      <span className="material-symbols-outlined text-sm">
                        star
                      </span>
                    </button>
                  </div>
                  <span className="text-white/80 text-xs font-semibold bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    {p.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-primary mb-2">{p.client}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {p.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.skills.slice(0, 3).map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                    {p.skills.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-dark text-slate-400 font-medium">
                        +{p.skills.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {new Date(p.date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                      })}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter & grid — only show when there are projects */}
      {projects.length > 0 && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                  filterCat === cat
                    ? "bg-primary text-background-dark"
                    : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* All projects grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden group"
              >
                {/* Gradient thumbnail */}
                <div
                  className={cn(
                    "h-28 bg-gradient-to-br flex items-end p-3 relative",
                    p.gradient
                  )}
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveProject(p.id, "up")}
                      className="p-1 bg-black/40 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/60 transition-colors"
                      title="Monter"
                    >
                      <span className="material-symbols-outlined text-sm">
                        arrow_upward
                      </span>
                    </button>
                    <button
                      onClick={() => moveProject(p.id, "down")}
                      className="p-1 bg-black/40 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/60 transition-colors"
                      title="Descendre"
                    >
                      <span className="material-symbols-outlined text-sm">
                        arrow_downward
                      </span>
                    </button>
                    <button
                      onClick={() => toggleFeatured(p.id)}
                      className={cn(
                        "p-1 bg-black/40 backdrop-blur-sm rounded-lg hover:bg-black/60 transition-colors",
                        p.featured
                          ? "text-amber-400"
                          : "text-white/60 hover:text-amber-400"
                      )}
                      title="Mettre en vedette"
                    >
                      <span className="material-symbols-outlined text-sm">
                        star
                      </span>
                    </button>
                  </div>
                  <span className="text-white/80 text-[10px] font-semibold bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                    {p.category}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-primary mb-1">{p.client}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {p.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.skills.slice(0, 3).map((sk) => (
                      <span
                        key={sk}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                    {p.skills.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-dark text-slate-400 font-medium">
                        +{p.skills.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {new Date(p.date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                      })}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.link && (
                        <button
                          onClick={() => {
                            addToast("info", `Ouverture de ${p.link}`);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            open_in_new
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16">
                <span className="material-symbols-outlined text-5xl text-slate-600 mb-3 block">
                  photo_library
                </span>
                <p className="text-slate-400">
                  Aucun projet dans cette catégorie.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ---- Add / Edit modal ---- */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowAdd(false);
              setEditProject(null);
            }}
          />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {editProject ? "Modifier le projet" : "Ajouter un projet"}
            </h3>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Titre du projet *
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Ex : Plateforme E-commerce"
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Client *
                </label>
                <input
                  value={form.client}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, client: e.target.value }))
                  }
                  placeholder="Nom du client"
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50"
                >
                  {CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Décrivez le projet réalisé..."
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Compétences utilisées
                </label>
                <input
                  value={form.skillsRaw}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, skillsRaw: e.target.value }))
                  }
                  placeholder="React, Node.js, Figma (séparées par des virgules)"
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                  Lien URL (optionnel)
                </label>
                <input
                  value={form.link}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, link: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setEditProject(null);
                  }}
                  className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
                >
                  {editProject ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete confirmation modal ---- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-sm text-center">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-3 block">
              warning
            </span>
            <h3 className="text-lg font-bold text-white mb-2">
              Supprimer ce projet ?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Cette action est irréversible. Le projet sera retiré de votre
              portfolio.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
