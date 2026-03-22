"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminStore } from "@/store/admin";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  suspend_user: { label: "Suspension", color: "text-amber-400 bg-amber-500/10", icon: "pause_circle" },
  ban_user: { label: "Bannissement", color: "text-red-400 bg-red-500/10", icon: "block" },
  reactivate_user: { label: "Réactivation", color: "text-green-400 bg-green-500/10", icon: "check_circle" },
  change_role: { label: "Changement rôle", color: "text-blue-400 bg-blue-500/10", icon: "swap_horiz" },
  change_plan: { label: "Changement plan", color: "text-purple-400 bg-purple-500/10", icon: "workspace_premium" },
  verify_kyc: { label: "Vérification KYC", color: "text-green-400 bg-green-500/10", icon: "verified" },
  approve_kyc: { label: "KYC approuvé", color: "text-green-400 bg-green-500/10", icon: "verified" },
  refuse_kyc: { label: "KYC refusé", color: "text-red-400 bg-red-500/10", icon: "cancel" },
  resolve_dispute: { label: "Litige résolu", color: "text-blue-400 bg-blue-500/10", icon: "gavel" },
  impersonate: { label: "Impersonation", color: "text-amber-400 bg-amber-500/10", icon: "visibility" },
  reset_password: { label: "Reset mdp", color: "text-amber-400 bg-amber-500/10", icon: "lock_reset" },
  approve_service: { label: "Service approuvé", color: "text-green-400 bg-green-500/10", icon: "check_circle" },
  refuse_service: { label: "Service refusé", color: "text-red-400 bg-red-500/10", icon: "cancel" },
  update_config: { label: "Config modifiée", color: "text-blue-400 bg-blue-500/10", icon: "settings" },
  send_notification: { label: "Notification", color: "text-primary bg-primary/10", icon: "notifications" },
};

function formatDateTime(ts: string) {
  return new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getActionInfo(action: string) {
  return ACTION_LABELS[action] ?? { label: action, color: "text-slate-400 bg-slate-500/10", icon: "info" };
}

function AuditLogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-neutral-dark rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-neutral-dark rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-neutral-dark rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-4 items-center">
        <div className="h-10 flex-1 max-w-sm bg-neutral-dark rounded-xl animate-pulse" />
        <div className="h-10 w-48 bg-neutral-dark rounded-xl animate-pulse" />
        <div className="h-10 w-40 bg-neutral-dark rounded-xl animate-pulse" />
      </div>
      <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-dark">
              {["Date", "Admin", "Action", "Cible", "Details"].map((h) => (
                <th key={h} className="px-4 py-3">
                  <div className="h-3 w-16 bg-border-dark rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-border-dark/50">
                <td className="px-4 py-3"><div className="h-4 w-32 bg-border-dark rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-4 w-28 bg-border-dark rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-6 w-24 bg-border-dark rounded-full animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-4 w-24 bg-border-dark rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-4 w-40 bg-border-dark rounded animate-pulse" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const { auditLog, loading, syncAuditLog } = useAdminStore();
  const [filterAction, setFilterAction] = useState("tous");
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    syncAuditLog();
  }, [syncAuditLog]);

  const uniqueActions = useMemo(
    () => [...new Set(auditLog.map((e) => e.action))],
    [auditLog]
  );

  const filtered = useMemo(() => {
    let list = auditLog;
    if (filterAction !== "tous") {
      list = list.filter((e) => e.action === filterAction);
    }
    if (filterDate) {
      list = list.filter((e) => e.createdAt.startsWith(filterDate));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.adminName.toLowerCase().includes(q) ||
          (e.targetUserName?.toLowerCase().includes(q) ?? false) ||
          e.action.toLowerCase().includes(q) ||
          (typeof e.details === "string" ? e.details : JSON.stringify(e.details)).toLowerCase().includes(q)
      );
    }
    return list;
  }, [auditLog, filterAction, filterDate, search]);

  function exportCsv() {
    const header = "Date,Admin,Action,Cible,Details\n";
    const rows = filtered
      .map((e) =>
        `"${formatDateTime(e.createdAt)}","${e.adminName}","${e.action}","${e.targetUserName ?? "-"}","${typeof e.details === "string" ? e.details : JSON.stringify(e.details)}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading.auditLog) return <AuditLogSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">Journal d&apos;audit</h2>
          <p className="text-slate-400 mt-1">
            {auditLog.length} action{auditLog.length !== 1 ? "s" : ""} enregistrée{auditLog.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => syncAuditLog()}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-dark border border-border-dark text-slate-300 rounded-xl text-sm font-semibold hover:bg-border-dark transition-colors"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Actualiser
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input
            type="text"
            placeholder="Rechercher par admin, cible, action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary appearance-none"
        >
          <option value="tous">Toutes les actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{getActionInfo(a).label}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary"
          placeholder="Filtrer par date"
        />
        {(filterAction !== "tous" || filterDate || search) && (
          <button
            onClick={() => { setFilterAction("tous"); setFilterDate(""); setSearch(""); }}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Audit log table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <span className="material-symbols-outlined text-5xl mb-3">history</span>
          <p className="font-medium">Aucune action enregistrée</p>
          <p className="text-xs mt-1">Les actions admin apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dark text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Admin</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cible</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const info = getActionInfo(entry.action);
                return (
                  <tr key={entry.id} className="border-b border-border-dark/50 hover:bg-background-dark/30">
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{entry.adminName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", info.color)}>
                        <span className="material-symbols-outlined text-xs">{info.icon}</span>
                        {info.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.targetUserName ? (
                        <a href={`/admin/utilisateurs/${entry.targetUserId}`} className="text-sm text-primary hover:underline font-medium">
                          {entry.targetUserName}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.details ? (
                        <span className="text-xs text-slate-400">
                          {typeof entry.details === "string" ? entry.details : JSON.stringify(entry.details)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
