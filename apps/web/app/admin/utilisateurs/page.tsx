"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/toast";
import { useAdminStore, type AdminUser } from "@/store/admin";
import { cn } from "@/lib/utils";

const ROLE_MAP: Record<string, { label: string; cls: string }> = {
  freelance: { label: "Freelance", cls: "bg-primary/10 text-primary" },
  client: { label: "Client", cls: "bg-blue-500/20 text-blue-400" },
  agence: { label: "Agence", cls: "bg-purple-500/20 text-purple-400" },
  admin: { label: "Admin", cls: "bg-red-500/20 text-red-400" },
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  actif: { label: "Actif", cls: "bg-emerald-500/20 text-emerald-400" },
  suspendu: { label: "Suspendu", cls: "bg-amber-500/20 text-amber-400" },
  banni: { label: "Banni", cls: "bg-red-500/20 text-red-400" },
};

const PLAN_MAP: Record<string, { label: string; cls: string }> = {
  gratuit: { label: "Gratuit", cls: "bg-slate-500/20 text-slate-400" },
  pro: { label: "Pro", cls: "bg-blue-500/20 text-blue-400" },
  business: { label: "Business", cls: "bg-amber-500/20 text-amber-400" },
  agence: { label: "Agence", cls: "bg-purple-500/20 text-purple-400" },
};

type ModalAction = null | "suspend" | "ban" | "role" | "plan" | "kyc";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border-dark/50">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-border-dark animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 bg-border-dark rounded animate-pulse" />
            <div className="h-3 w-36 bg-border-dark/60 rounded animate-pulse" />
          </div>
        </div>
      </td>
      <td className="px-5 py-3"><div className="h-5 w-16 bg-border-dark rounded-full animate-pulse" /></td>
      <td className="px-5 py-3"><div className="h-5 w-16 bg-border-dark rounded-full animate-pulse" /></td>
      <td className="px-5 py-3"><div className="h-4 w-20 bg-border-dark rounded animate-pulse" /></td>
      <td className="px-5 py-3 text-center"><div className="h-5 w-10 bg-border-dark rounded-full animate-pulse mx-auto" /></td>
      <td className="px-5 py-3 text-center"><div className="h-5 w-14 bg-border-dark rounded-full animate-pulse mx-auto" /></td>
      <td className="px-5 py-3"><div className="h-4 w-20 bg-border-dark rounded animate-pulse" /></td>
      <td className="px-5 py-3"><div className="h-6 w-20 bg-border-dark rounded animate-pulse mx-auto" /></td>
    </tr>
  );
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const { addToast } = useToastStore();
  const {
    users, loading, syncUsers,
    suspendUser, banUser, reactivateUser,
    changeUserRole, changeUserPlan, approveKyc,
  } = useAdminStore();

  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [newRole, setNewRole] = useState("freelance");
  const [newPlan, setNewPlan] = useState("gratuit");
  const [newKyc, setNewKyc] = useState(1);

  useEffect(() => {
    syncUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = loading.users;

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter && u.role?.toLowerCase() !== roleFilter.toLowerCase()) return false;
      if (statusFilter && u.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (planFilter && u.plan?.toLowerCase() !== planFilter.toLowerCase()) return false;
      return true;
    });
  }, [search, roleFilter, statusFilter, planFilter, users]);

  function openModal(user: AdminUser, action: ModalAction) {
    setSelectedUser(user);
    setModalAction(action);
    setSuspendReason("");
    setNewRole(user.role);
    setNewPlan(user.plan);
    setNewKyc(user.kycLevel);
  }

  async function handleSuspend() {
    if (!selectedUser || !suspendReason.trim()) { addToast("warning", "Veuillez indiquer un motif"); return; }
    const ok = await suspendUser(selectedUser.id);
    if (ok) addToast("success", `${selectedUser.name} suspendu — ses services ont ete mis en pause`);
    else addToast("error", "Erreur lors de la suspension");
    setModalAction(null);
  }

  async function handleBan() {
    if (!selectedUser) return;
    const ok = await banUser(selectedUser.id);
    if (ok) addToast("success", `${selectedUser.name} banni — tous ses services sont desactives`);
    else addToast("error", "Erreur lors du bannissement");
    setModalAction(null);
  }

  async function handleReactivate(user: AdminUser) {
    const ok = await reactivateUser(user.id);
    if (ok) addToast("success", `${user.name} reactive`);
    else addToast("error", "Erreur lors de la reactivation");
  }

  async function handleChangeRole() {
    if (!selectedUser) return;
    const ok = await changeUserRole(selectedUser.id, newRole);
    if (ok) addToast("success", `Role de ${selectedUser.name} change en ${ROLE_MAP[newRole]?.label}`);
    else addToast("error", "Erreur lors du changement de role");
    setModalAction(null);
  }

  async function handleChangePlan() {
    if (!selectedUser) return;
    const ok = await changeUserPlan(selectedUser.id, newPlan);
    if (ok) addToast("success", `Plan de ${selectedUser.name} change en ${PLAN_MAP[newPlan]?.label}`);
    else addToast("error", "Erreur lors du changement de plan");
    setModalAction(null);
  }

  async function handleChangeKyc() {
    if (!selectedUser) return;
    const ok = await approveKyc(selectedUser.id, newKyc);
    if (ok) addToast("success", `KYC de ${selectedUser.name} mis a niveau ${newKyc}`);
    else addToast("error", "Erreur lors de la mise a jour du KYC");
    setModalAction(null);
  }

  const stats = useMemo(() => ({
    total: users.length,
    actifs: users.filter(u => u.status?.toLowerCase() === "actif").length,
    suspendus: users.filter(u => u.status?.toLowerCase() === "suspendu").length,
    bannis: users.filter(u => u.status?.toLowerCase() === "banni").length,
  }), [users]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">people</span>
          Utilisateurs
        </h1>
        <p className="text-slate-400 text-sm mt-1">Gérez les {stats.total} comptes de la plateforme.</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Total", value: stats.total, icon: "people", color: "text-primary" },
          { label: "Actifs", value: stats.actifs, icon: "check_circle", color: "text-emerald-400" },
          { label: "Suspendus", value: stats.suspendus, icon: "block", color: "text-amber-400" },
          { label: "Bannis", value: stats.bannis, icon: "gavel", color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-neutral-dark rounded-xl border border-border-dark p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("material-symbols-outlined text-lg", s.color)}>{s.icon}</span>
              <p className="text-xl font-black text-white">{s.value}</p>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-wrap sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-dark bg-neutral-dark text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border-dark bg-neutral-dark text-sm text-white outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
          <option value="">Tous les roles</option>
          <option value="freelance">Freelance</option>
          <option value="client">Client</option>
          <option value="agence">Agence</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border-dark bg-neutral-dark text-sm text-white outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="banni">Banni</option>
        </select>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border-dark bg-neutral-dark text-sm text-white outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
          <option value="">Tous les plans</option>
          <option value="gratuit">Gratuit</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
          <option value="agence">Agence</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dark">
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Utilisateur</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Role</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Plan</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pays</th>
                <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">KYC</th>
                <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Statut</th>
                <th className="px-5 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Inscrit le</th>
                <th className="px-5 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && users.length === 0 ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="border-b border-border-dark/50 hover:bg-background-dark/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/utilisateurs/${u.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{getInitials(u.name)}</div>
                        <div>
                          <p className="text-sm font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openModal(u, "role")} className={cn("text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80", ROLE_MAP[u.role?.toLowerCase()]?.cls || "bg-slate-500/20 text-slate-400")}>
                        {ROLE_MAP[u.role?.toLowerCase()]?.label || u.role || <span className="text-slate-600">&mdash;</span>}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => openModal(u, "plan")} className={cn("text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80", PLAN_MAP[u.plan?.toLowerCase()]?.cls || "bg-slate-500/20 text-slate-400")}>
                        {PLAN_MAP[u.plan?.toLowerCase()]?.label || u.plan || <span className="text-slate-600">&mdash;</span>}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">{u.country || <span className="text-slate-600">&mdash;</span>}</td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => openModal(u, "kyc")} className="text-xs font-bold bg-border-dark text-slate-300 px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">
                        Niv. {u.kycLevel ?? 0}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", STATUS_MAP[u.status?.toLowerCase()]?.cls || "bg-slate-500/20 text-slate-400")}>
                        {STATUS_MAP[u.status?.toLowerCase()]?.label || u.status || <span className="text-slate-600">&mdash;</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-400">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-1">
                        <Link href={`/admin/utilisateurs/${u.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors" title="Voir profil">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                        {u.status?.toLowerCase() === "actif" && (
                          <>
                            <button onClick={() => openModal(u, "suspend")} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Suspendre">
                              <span className="material-symbols-outlined text-lg">block</span>
                            </button>
                            <button onClick={() => openModal(u, "ban")} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Bannir">
                              <span className="material-symbols-outlined text-lg">person_off</span>
                            </button>
                          </>
                        )}
                        {u.status?.toLowerCase() === "suspendu" && (
                          <button onClick={() => handleReactivate(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Reactiver">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                        )}
                        {u.status?.toLowerCase() === "banni" && (
                          <button onClick={() => handleReactivate(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Debannir">
                            <span className="material-symbols-outlined text-lg">lock_open</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center">{filtered.length} utilisateur{filtered.length > 1 ? "s" : ""} affiche{filtered.length > 1 ? "s" : ""}</p>

      {/* Modal Suspendre */}
      {modalAction === "suspend" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalAction(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-2">Suspendre {selectedUser.name}</h3>
            <p className="text-sm text-slate-400 mb-4">L&apos;utilisateur ne pourra plus acceder a la plateforme. Ses services seront mis en pause.</p>
            <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3} placeholder="Motif de la suspension (obligatoire)..." className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white placeholder:text-slate-500 outline-none resize-none mb-4 focus:ring-2 focus:ring-primary/30" />
            <div className="flex gap-3">
              <button onClick={() => setModalAction(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleSuspend} className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors">Suspendre</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bannir */}
      {modalAction === "ban" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalAction(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center"><span className="material-symbols-outlined text-red-400">warning</span></div>
              <h3 className="font-bold text-lg text-white">Bannir {selectedUser.name} ?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">Cette action bannira l&apos;utilisateur et desactivera tous ses services. Cette action est reversible via le bouton Debannir.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalAction(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleBan} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">Confirmer le ban</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changer Role */}
      {modalAction === "role" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalAction(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4">Changer le role de {selectedUser.name}</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {(["freelance", "client", "agence", "admin"] as const).map(r => (
                <button key={r} onClick={() => setNewRole(r)} className={cn("py-3 rounded-xl text-sm font-bold border-2 transition-all", newRole === r ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-400 hover:border-slate-500")}>
                  {ROLE_MAP[r]?.label || r}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalAction(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleChangeRole} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Appliquer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changer Plan */}
      {modalAction === "plan" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalAction(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4">Changer le plan de {selectedUser.name}</h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {(["gratuit", "pro", "business", "agence"] as const).map(p => (
                <button key={p} onClick={() => setNewPlan(p)} className={cn("py-3 rounded-xl text-sm font-bold border-2 transition-all", newPlan === p ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-400 hover:border-slate-500")}>
                  {PLAN_MAP[p]?.label} {p !== "gratuit" && <span className="block text-xs font-normal text-slate-500">({p === "pro" ? "15EUR" : p === "business" ? "45EUR" : "99EUR"}/mois)</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalAction(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleChangePlan} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Appliquer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changer KYC */}
      {modalAction === "kyc" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalAction(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-4">KYC de {selectedUser.name}</h3>
            <p className="text-sm text-slate-400 mb-4">Niveau actuel : <span className="font-bold text-white">Niveau {selectedUser.kycLevel}</span></p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 3, 4].map(lvl => (
                <button key={lvl} onClick={() => setNewKyc(lvl)} className={cn("py-3 rounded-xl text-sm font-bold border-2 transition-all", newKyc === lvl ? "border-primary bg-primary/10 text-primary" : "border-border-dark text-slate-400 hover:border-slate-500")}>
                  Niv. {lvl}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 mb-4 space-y-1">
              <p>Niv. 1 : Email vérifié — accès de base</p>
              <p>Niv. 2 : Acces elargi — commander, postuler</p>
              <p>Niv. 3 : Identité vérifiée — retirer, publier</p>
              <p>Niv. 4 : Verification pro — badge Elite</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalAction(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:bg-background-dark/50 transition-colors">Annuler</button>
              <button onClick={handleChangeKyc} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Appliquer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
