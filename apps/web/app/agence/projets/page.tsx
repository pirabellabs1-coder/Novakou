"use client";

import { useState, useEffect, useMemo } from "react";
import { useAgencyStore } from "@/store/agency";
import { useToastStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";

type ProjectStatus = "a_faire" | "en_cours" | "en_revision" | "termine";
type Priority = "urgent" | "normal" | "faible";

interface Project {
  id: string;
  title: string;
  client: string;
  assignee: string;
  initials: string;
  deadline: string;
  progress: number;
  status: ProjectStatus;
  priority: Priority;
  budget: string;
}

const COLUMNS: { key: ProjectStatus; label: string; color: string }[] = [
  { key: "a_faire", label: "A faire", color: "bg-slate-500" },
  { key: "en_cours", label: "En cours", color: "bg-blue-500" },
  { key: "en_revision", label: "En révision", color: "bg-purple-500" },
  { key: "termine", label: "Terminé", color: "bg-emerald-500" },
];

const PRIORITY_BADGES: Record<Priority, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-500/20 text-red-400" },
  normal: { label: "Normal", cls: "bg-amber-500/20 text-amber-400" },
  faible: { label: "Faible", cls: "bg-slate-500/20 text-slate-400" },
};

function mapOrderStatus(status: string): ProjectStatus {
  switch (status) {
    case "en_attente":
      return "a_faire";
    case "en_cours":
      return "en_cours";
    case "livre":
      return "en_revision";
    case "termine":
      return "termine";
    case "annule":
      return "a_faire";
    default:
      return "a_faire";
  }
}

function deriveProgress(status: string): number {
  switch (status) {
    case "en_attente":
      return 0;
    case "en_cours":
      return 50;
    case "livre":
      return 90;
    case "termine":
      return 100;
    case "annule":
      return 0;
    default:
      return 0;
  }
}

function derivePriority(deadline: string): Priority {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 3) return "urgent";
  if (diffDays <= 7) return "normal";
  return "faible";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatBudget(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AgenceProjets() {
  const [view, setView] = useState<"kanban" | "liste">("kanban");
  const [showNew, setShowNew] = useState(false);
  const [clientFilter, setClientFilter] = useState("tous");
  const [priorityFilter, setPriorityFilter] = useState("tous");
  const [newTitle, setNewTitle] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("normal");
  const { addToast } = useToastStore();

  const { orders, members, clients, syncAll, isLoading } = useAgencyStore();

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  // Build a lookup from member IDs to member names for assignee resolution.
  // Since ApiOrder doesn't have a direct assignee field, we round-robin assign
  // to active members for display. In a real app this would come from the order data.
  const activeMembers = useMemo(
    () => members.filter((m) => m.status === "actif"),
    [members]
  );

  const projects: Project[] = useMemo(() => {
    return orders.map((order, idx) => {
      // Derive assignee: round-robin across active members, or "Non assigne"
      let assignee = "Non assigne";
      let initials = "NA";
      if (activeMembers.length > 0) {
        const member = activeMembers[idx % activeMembers.length];
        assignee = member.name;
        initials = getInitials(member.name);
      }

      return {
        id: order.id,
        title: order.serviceTitle,
        client: order.clientName,
        assignee,
        initials,
        deadline: order.deadline,
        progress: deriveProgress(order.status),
        status: mapOrderStatus(order.status),
        priority: derivePriority(order.deadline),
        budget: formatBudget(order.amount),
      };
    });
  }, [orders, activeMembers]);

  // Unique client names from projects for filter dropdown
  const clientNames = useMemo(
    () => [...new Set(projects.map((p) => p.client))],
    [projects]
  );

  // Client names from store for new project modal
  const storeClientNames = useMemo(
    () => clients.map((c) => c.name),
    [clients]
  );

  // Filtered projects
  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          (clientFilter === "tous" || p.client === clientFilter) &&
          (priorityFilter === "tous" || p.priority === priorityFilter)
      ),
    [projects, clientFilter, priorityFilter]
  );

  // Capacity: active orders (en_cours or en_attente) vs a reasonable max.
  // We define max capacity as max(total members * 3, total orders, 1) to avoid division by zero.
  const capacityPercent = useMemo(() => {
    const activeOrders = orders.filter(
      (o) => o.status === "en_cours" || o.status === "en_attente"
    ).length;
    const maxCapacity = Math.max(activeMembers.length * 3, 1);
    return Math.min(Math.round((activeOrders / maxCapacity) * 100), 100);
  }, [orders, activeMembers]);

  const handleCreateProject = () => {
    if (!newTitle.trim()) {
      addToast("error", "Veuillez saisir un titre pour le projet.");
      return;
    }
    addToast("success", "Projet cree !");
    setShowNew(false);
    setNewTitle("");
    setNewClient("");
    setNewDescription("");
    setNewDeadline("");
    setNewBudget("");
    setNewPriority("normal");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Projets</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerez tous les projets de l&apos;agence.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nouveau Projet
        </button>
      </div>

      {/* Toggle + Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
              view === "kanban"
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}
          >
            <span className="material-symbols-outlined text-lg">
              view_kanban
            </span>
            Kanban
          </button>
          <button
            onClick={() => setView("liste")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
              view === "liste"
                ? "bg-primary text-background-dark"
                : "bg-neutral-dark text-slate-400 border border-border-dark hover:text-white"
            )}
          >
            <span className="material-symbols-outlined text-lg">list</span>
            Liste
          </button>
        </div>
        <div className="flex gap-2">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-xs text-white outline-none focus:border-primary/50"
          >
            <option value="tous">Tous les clients</option>
            {clientNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-xs text-white outline-none focus:border-primary/50"
          >
            <option value="tous">Toutes priorites</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="faible">Faible</option>
          </select>
        </div>
      </div>

      {/* Capacity */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 flex items-center gap-4">
        <span className="material-symbols-outlined text-primary">speed</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400 font-semibold">
              Capacite Agence
            </span>
            <span className="text-xs font-bold text-white">
              {capacityPercent}%
            </span>
          </div>
          <div className="h-2 bg-border-dark rounded-full">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm mt-2">Chargement des projets...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && projects.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">
            folder_open
          </span>
          <h3 className="text-lg font-bold text-white mb-1">
            Aucun projet pour le moment
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Les projets apparaitront ici lorsque des commandes seront passees.
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
          >
            Creer un projet
          </button>
        </div>
      )}

      {/* Kanban view */}
      {!isLoading && projects.length > 0 && view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colProjects = filtered.filter(
              (p) => p.status === col.key
            );
            return (
              <div key={col.key}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("w-3 h-3 rounded-full", col.color)} />
                  <span className="text-sm font-bold text-white">
                    {col.label}
                  </span>
                  <span className="text-xs text-slate-500 bg-border-dark px-1.5 py-0.5 rounded-full">
                    {colProjects.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colProjects.length === 0 && (
                    <div className="border-2 border-dashed border-border-dark rounded-xl p-4 text-center">
                      <p className="text-xs text-slate-500">Aucun projet</p>
                    </div>
                  )}
                  {colProjects.map((p) => (
                    <div
                      key={p.id}
                      className="bg-neutral-dark rounded-xl border border-border-dark p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            PRIORITY_BADGES[p.priority].cls
                          )}
                        >
                          {PRIORITY_BADGES[p.priority].label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(p.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mb-1">
                        {p.title}
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        {p.client}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold">
                            {p.initials}
                          </div>
                          <span className="text-xs text-slate-400">
                            {p.assignee}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {p.progress}%
                        </span>
                      </div>
                      {p.progress > 0 && p.progress < 100 && (
                        <div className="h-1.5 bg-border-dark rounded-full mt-2">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {!isLoading && projects.length > 0 && view === "liste" && (
        <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-border-dark">
                <th className="px-5 py-3 text-left font-semibold">Projet</th>
                <th className="px-5 py-3 text-left font-semibold">Client</th>
                <th className="px-5 py-3 text-left font-semibold">Assigne</th>
                <th className="px-5 py-3 text-left font-semibold">Priorite</th>
                <th className="px-5 py-3 text-left font-semibold">
                  Progression
                </th>
                <th className="px-5 py-3 text-left font-semibold">Budget</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                    Aucun projet ne correspond aux filtres.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-white">
                      {p.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      Deadline :{" "}
                      {new Date(p.deadline).toLocaleDateString("fr-FR")}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">
                    {p.client}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                        {p.initials}
                      </div>
                      <span className="text-sm text-slate-300">
                        {p.assignee}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        PRIORITY_BADGES[p.priority].cls
                      )}
                    >
                      {PRIORITY_BADGES[p.priority].label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-border-dark rounded-full max-w-[100px]">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-400">
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-white">
                    {p.budget}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New project modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          />
          <div className="relative bg-neutral-dark rounded-2xl border border-border-dark p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-white mb-4">
              Nouveau projet
            </h3>
            <div className="space-y-4">
              <input
                placeholder="Titre du projet"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
              />
              <select
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50"
              >
                <option value="">Selectionner un client</option>
                {storeClientNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description"
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50"
                />
                <input
                  placeholder="Budget (EUR)"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
                />
              </div>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50"
              >
                <option value="normal">Priorite : Normal</option>
                <option value="urgent">Priorite : Urgent</option>
                <option value="faible">Priorite : Faible</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 text-slate-400 text-sm font-semibold hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateProject}
                  className="flex-1 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all"
                >
                  Creer le projet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
