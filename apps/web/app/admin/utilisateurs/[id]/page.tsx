"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminStore, type AdminUser } from "@/store/admin";
import { useAuthStore } from "@/store/auth";
import { useToastStore } from "@/store/dashboard";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  freelance: { label: "Freelance", color: "bg-emerald-500/20 text-emerald-400" },
  client: { label: "Client", color: "bg-blue-500/20 text-blue-400" },
  agence: { label: "Agence", color: "bg-amber-500/20 text-amber-400" },
  admin: { label: "Admin", color: "bg-red-500/20 text-red-400" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  actif: { label: "Actif", color: "bg-green-500/20 text-green-400", icon: "check_circle" },
  suspendu: { label: "Suspendu", color: "bg-amber-500/20 text-amber-400", icon: "pause_circle" },
  banni: { label: "Banni", color: "bg-red-500/20 text-red-400", icon: "block" },
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  gratuit: { label: "Gratuit", color: "bg-slate-500/20 text-slate-400" },
  pro: { label: "Pro", color: "bg-blue-500/20 text-blue-400" },
  business: { label: "Business", color: "bg-purple-500/20 text-purple-400" },
  agence: { label: "Agence", color: "bg-amber-500/20 text-amber-400" },
};

type Tab = "info" | "orders" | "transactions" | "audit";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function SkeletonBlock() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-border-dark animate-pulse" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-6 w-40 bg-border-dark rounded animate-pulse" />
                <div className="h-5 w-16 bg-border-dark rounded-full animate-pulse" />
                <div className="h-5 w-16 bg-border-dark rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-48 bg-border-dark/60 rounded animate-pulse" />
              <div className="h-3 w-72 bg-border-dark/40 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-dark">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="text-center space-y-2">
              <div className="h-7 w-20 bg-border-dark rounded animate-pulse mx-auto" />
              <div className="h-3 w-24 bg-border-dark/60 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const {
    users, orders, transactions, auditLog, loading,
    syncUsers, syncOrders, syncFinances, syncAuditLog,
    suspendUser, banUser, reactivateUser,
    changeUserRole, changeUserPlan, approveKyc,
  } = useAdminStore();

  const { startImpersonation } = useAuthStore();

  // Sync data on mount if not already loaded
  useEffect(() => {
    if (users.length === 0) syncUsers();
    if (orders.length === 0) syncOrders();
    if (transactions.length === 0) syncFinances();
    if (auditLog.length === 0) syncAuditLog();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = loading.users && users.length === 0;

  const user = useMemo(() => users.find((u) => u.id === id), [users, id]);
  const userOrders = useMemo(() => orders.filter((o) => o.freelanceId === id || o.clientId === id), [orders, id]);
  const userTransactions = useMemo(() => transactions.filter((t) => t.userId === id), [transactions, id]);
  const userAuditEntries = useMemo(
    () => auditLog.filter((e) => e.targetUserId === id),
    [auditLog, id]
  );

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [modal, setModal] = useState<"suspend" | "ban" | "reset" | "impersonate" | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <button onClick={() => router.push("/admin/utilisateurs")} className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Utilisateurs
          </button>
          <span>/</span>
          <div className="h-4 w-24 bg-border-dark rounded animate-pulse" />
        </div>
        <SkeletonBlock />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <span className="material-symbols-outlined text-5xl mb-3">person_off</span>
        <p className="text-lg font-bold">Utilisateur introuvable</p>
        <button onClick={() => router.push("/admin/utilisateurs")} className="mt-4 text-primary text-sm font-semibold hover:underline">
          Retour a la liste
        </button>
      </div>
    );
  }

  const roleInfo = ROLE_LABELS[user.role?.toLowerCase()] ?? ROLE_LABELS.freelance;
  const statusInfo = STATUS_LABELS[user.status?.toLowerCase()] ?? STATUS_LABELS.actif;
  const planInfo = PLAN_LABELS[user.plan?.toLowerCase()] ?? PLAN_LABELS.gratuit;

  // Stats from AdminUser fields
  const totalEarnings = user.revenue;
  const totalSpent = user.totalSpent;
  const ordersCount = user.ordersCount;
  const activeOrders = userOrders.filter((o) => ["en_cours", "en_attente", "revision"].includes(o.status)).length;

  async function handleSuspend() {
    if (!suspendReason.trim()) return;
    const ok = await suspendUser(id);
    if (ok) addToast("success", `${user!.name} a ete suspendu.`);
    else addToast("error", "Erreur lors de la suspension.");
    setSuspendReason("");
    setModal(null);
  }

  async function handleBan() {
    const ok = await banUser(id);
    if (ok) addToast("success", `${user!.name} a ete banni.`);
    else addToast("error", "Erreur lors du bannissement.");
    setModal(null);
  }

  async function handleReactivate() {
    const ok = await reactivateUser(id);
    if (ok) addToast("success", `${user!.name} a ete reactive.`);
    else addToast("error", "Erreur lors de la reactivation.");
  }

  async function handleResetPassword() {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setTempPassword(data.tempPassword);
        addToast("success", "Mot de passe reinitialise.");
      } else {
        addToast("error", data.error || "Erreur");
      }
    } catch {
      addToast("error", "Erreur serveur.");
    }
  }

  function handleImpersonate() {
    if (user!.role === "admin") {
      addToast("error", "Impossible d'impersonner un admin.");
      return;
    }
    startImpersonation({
      id: user!.id,
      name: user!.name,
      role: user!.role as "freelance" | "client" | "agence",
      email: user!.email,
    });
    const redirectMap: Record<string, string> = {
      freelance: "/dashboard",
      client: "/client",
      agence: "/agence",
    };
    router.push(redirectMap[user!.role] ?? "/dashboard");
    setModal(null);
  }

  const TABS: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "info", label: "Informations", icon: "person" },
    { key: "orders", label: "Commandes", icon: "shopping_cart", count: userOrders.length },
    { key: "transactions", label: "Transactions", icon: "payments", count: userTransactions.length },
    { key: "audit", label: "Historique admin", icon: "history", count: userAuditEntries.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <button onClick={() => router.push("/admin/utilisateurs")} className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Utilisateurs
        </button>
        <span>/</span>
        <span className="text-white font-medium">{user.name}</span>
      </div>

      {/* User header card */}
      <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
              {getInitials(user.name)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", roleInfo.color)}>{roleInfo.label}</span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1", statusInfo.color)}>
                  <span className="material-symbols-outlined text-xs">{statusInfo.icon}</span>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span>{user.country || "Non renseigne"}</span>
                <span>KYC: Niveau {user.kycLevel ?? 0}</span>
                <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold", planInfo.color)}>Plan {planInfo.label}</span>
                <span>Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
                <span>Dernière connexion: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("fr-FR") : "Jamais"}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {user.role?.toLowerCase() !== "admin" && (
              <button
                onClick={() => setModal("impersonate")}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                Se connecter en tant que
              </button>
            )}
            <button
              onClick={() => setModal("reset")}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">lock_reset</span>
              Reset mdp
            </button>
            {user.status?.toLowerCase() === "actif" && (
              <button
                onClick={() => setModal("suspend")}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">pause_circle</span>
                Suspendre
              </button>
            )}
            {user.status?.toLowerCase() === "actif" && (
              <button
                onClick={() => setModal("ban")}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">block</span>
                Bannir
              </button>
            )}
            {(user.status?.toLowerCase() === "suspendu" || user.status?.toLowerCase() === "banni") && (
              <button
                onClick={handleReactivate}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-semibold hover:bg-green-500/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Reactiver
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-dark">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalEarnings.toLocaleString()} EUR</p>
            <p className="text-xs text-slate-500">Revenus totaux</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalSpent.toLocaleString()} EUR</p>
            <p className="text-xs text-slate-500">Total dépensé</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{ordersCount}</p>
            <p className="text-xs text-slate-500">Commandes totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{activeOrders}</p>
            <p className="text-xs text-slate-500">Commandes actives</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-dark">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-white"
            )}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-border-dark text-[10px]">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Details */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">info</span>
              Informations
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="text-white">{user.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Role</span><span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", roleInfo.color)}>{roleInfo.label}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", planInfo.color)}>{planInfo.label}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Pays</span><span className="text-white">{user.country || "Non renseigne"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">KYC</span><span className="text-white">Niveau {user.kycLevel ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Inscription</span><span className="text-white">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Dernière connexion</span><span className="text-white">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("fr-FR") : "Jamais"}</span></div>
            </div>
          </div>

          {/* Admin actions */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">admin_panel_settings</span>
              Actions rapides
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Changer le role</label>
                <select
                  value={user.role}
                  onChange={async (e) => {
                    const ok = await changeUserRole(id, e.target.value);
                    if (ok) addToast("success", `Role change en ${e.target.value}`);
                    else addToast("error", "Erreur lors du changement de role");
                  }}
                  className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="freelance">Freelance</option>
                  <option value="client">Client</option>
                  <option value="agence">Agence</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Changer le plan</label>
                <select
                  value={user.plan}
                  onChange={async (e) => {
                    const ok = await changeUserPlan(id, e.target.value);
                    if (ok) addToast("success", `Plan change en ${e.target.value}`);
                    else addToast("error", "Erreur lors du changement de plan");
                  }}
                  className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="gratuit">Gratuit</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="agence">Agence</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Niveau KYC</label>
                <select
                  value={user.kycLevel}
                  onChange={async (e) => {
                    const ok = await approveKyc(id, parseInt(e.target.value));
                    if (ok) addToast("success", `KYC verifie au niveau ${e.target.value}`);
                    else addToast("error", "Erreur lors de la mise a jour du KYC");
                  }}
                  className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value={1}>Niveau 1 — Email verifie</option>
                  <option value={2}>Niveau 2 — Telephone verifie</option>
                  <option value={3}>Niveau 3 — Identite verifiee</option>
                  <option value={4}>Niveau 4 — Pro verifie</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-x-auto">
          {userOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Aucune commande</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dark text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {userOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border-dark/50 hover:bg-background-dark/30">
                    <td className="px-4 py-3 text-sm font-mono text-primary">{o.id}</td>
                    <td className="px-4 py-3 text-sm text-white">{o.serviceTitle}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white">{o.amount} EUR</td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold capitalize">{o.status.replace("_", " ")}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{o.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-x-auto">
          {userTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Aucune transaction</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dark text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Methode</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {userTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-border-dark/50 hover:bg-background-dark/30">
                    <td className="px-4 py-3 text-sm capitalize">{t.type}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 truncate max-w-[200px]">{t.description}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white">{t.amount} EUR</td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold capitalize">{t.status.replace("_", " ")}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{t.method ?? "---"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-x-auto">
          {userAuditEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-3xl mb-2">history</span>
              <p>Aucune action admin enregistree pour cet utilisateur</p>
            </div>
          ) : (
            <div className="divide-y divide-border-dark/50">
              {userAuditEntries.map((entry) => (
                <div key={entry.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">history</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      <span className="font-semibold">{entry.adminName}</span>{" "}
                      a effectue l&apos;action{" "}
                      <span className="font-semibold text-primary">{entry.action.replace(/_/g, " ")}</span>
                    </p>
                    {entry.details && (
                      <p className="text-xs text-slate-500 mt-0.5">{entry.details}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(entry.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modal === "suspend" && (
        <ConfirmModal
          title="Suspendre l'utilisateur"
          message={`Etes-vous sur de vouloir suspendre ${user.name} ? Ses services seront mis en pause.`}
          onConfirm={handleSuspend}
          onCancel={() => { setModal(null); setSuspendReason(""); }}
          confirmLabel="Suspendre"
          danger
        >
          <div className="mt-3">
            <label className="block text-xs text-slate-500 mb-1">Raison de la suspension</label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Indiquez la raison..."
              rows={3}
              className="w-full px-3 py-2 bg-background-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </ConfirmModal>
      )}

      {modal === "ban" && (
        <ConfirmModal
          title="Bannir l'utilisateur"
          message={`Etes-vous sur de vouloir bannir definitivement ${user.name} ? Cette action est severe.`}
          onConfirm={handleBan}
          onCancel={() => setModal(null)}
          confirmLabel="Bannir"
          danger
        />
      )}

      {modal === "reset" && (
        <ConfirmModal
          title="Reinitialiser le mot de passe"
          message={tempPassword
            ? `Mot de passe temporaire genere. Communiquez-le de maniere securisee a l'utilisateur.`
            : `Generer un nouveau mot de passe temporaire pour ${user.name} ?`
          }
          onConfirm={tempPassword ? () => { setTempPassword(null); setModal(null); } : handleResetPassword}
          onCancel={() => { setTempPassword(null); setModal(null); }}
          confirmLabel={tempPassword ? "Fermer" : "Reinitialiser"}
          danger={!tempPassword}
        >
          {tempPassword && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Mot de passe temporaire :</p>
              <p className="text-lg font-mono font-bold text-green-400 select-all">{tempPassword}</p>
              <p className="text-[10px] text-slate-500 mt-2">Ce mot de passe ne sera plus affiche apres fermeture.</p>
            </div>
          )}
        </ConfirmModal>
      )}

      {modal === "impersonate" && (
        <ConfirmModal
          title="Se connecter en tant que"
          message={`Vous allez visualiser la plateforme en tant que ${user.name} (${user.role}). Vous pourrez revenir a l'administration a tout moment via la banniere rouge.`}
          onConfirm={handleImpersonate}
          onCancel={() => setModal(null)}
          confirmLabel="Se connecter"
        />
      )}
    </div>
  );
}
