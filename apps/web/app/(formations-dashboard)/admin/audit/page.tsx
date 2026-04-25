"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetUserId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string | null; image: string | null };
  targetUser: { id: string; name: string | null; email: string | null } | null;
}

interface AuditResponse {
  data: AuditEntry[];
  total: number;
  page: number;
  pages: number;
  actions: { action: string; count: number }[];
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  user_banned: { label: "Utilisateur banni", color: "bg-red-100 text-red-700", icon: "block" },
  user_suspended: { label: "Utilisateur suspendu", color: "bg-orange-100 text-orange-700", icon: "pause_circle" },
  user_activated: { label: "Utilisateur activé", color: "bg-green-100 text-green-700", icon: "check_circle" },
  kyc_approved: { label: "KYC approuvé", color: "bg-green-100 text-green-700", icon: "verified" },
  kyc_rejected: { label: "KYC rejeté", color: "bg-red-100 text-red-700", icon: "cancel" },
  product_approved: { label: "Produit approuvé", color: "bg-green-100 text-green-700", icon: "inventory_2" },
  product_rejected: { label: "Produit rejeté", color: "bg-red-100 text-red-700", icon: "inventory_2" },
  withdrawal_approved: { label: "Retrait approuvé", color: "bg-blue-100 text-blue-700", icon: "payments" },
  withdrawal_rejected: { label: "Retrait rejeté", color: "bg-red-100 text-red-700", icon: "payments" },
  config_updated: { label: "Configuration modifiée", color: "bg-purple-100 text-purple-700", icon: "settings" },
  report_resolved: { label: "Signalement résolu", color: "bg-teal-100 text-teal-700", icon: "flag" },
  refund_processed: { label: "Remboursement traité", color: "bg-amber-100 text-amber-700", icon: "currency_exchange" },
};

function getActionInfo(action: string) {
  return ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-700", icon: "history" };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: "30" });
  if (actionFilter) params.set("action", actionFilter);
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);

  const { data, isLoading } = useQuery<AuditResponse>({
    queryKey: ["admin-audit", page, actionFilter, dateFrom, dateTo],
    queryFn: () => fetch(`/api/formations/admin/audit?${params}`).then((r) => r.json()),
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006e2f]">history</span>
          Journal d&apos;audit
        </h1>
        <p className="text-sm text-[#5c647a] mt-1">
          Historique de toutes les actions administratives sur la plateforme
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#006e2f]"
          >
            <option value="">Toutes les actions</option>
            {(data?.actions || []).map((a) => (
              <option key={a.action} value={a.action}>
                {getActionInfo(a.action).label} ({a.count})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">Du</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#006e2f]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">Au</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#006e2f]"
          />
        </div>
        {(actionFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setActionFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
            className="px-3 py-2 text-xs font-bold text-[#5c647a] hover:text-[#191c1e] transition-colors"
          >
            Réinitialiser
          </button>
        )}
        <div className="flex-1" />
        <span className="text-xs text-[#5c647a]">{data?.total ?? 0} entrées</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-[#006e2f] text-3xl animate-spin">progress_activity</span>
          </div>
        ) : !data?.data?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#5c647a]">
            <span className="material-symbols-outlined text-4xl mb-2">history</span>
            <p className="text-sm font-medium">Aucune entrée d&apos;audit</p>
            <p className="text-xs mt-1">Les actions admin seront enregistrées ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Acteur</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Action</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Cible</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">IP</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c647a]"></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((entry) => {
                  const info = getActionInfo(entry.action);
                  const isExpanded = expandedId === entry.id;
                  return (
                    <tr key={entry.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-[#5c647a] whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.actor?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.actor.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#006e2f]/10 flex items-center justify-center text-[9px] font-bold text-[#006e2f]">
                              {(entry.actor?.name || "?").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-[#191c1e]">{entry.actor?.name || "Admin"}</p>
                            <p className="text-[10px] text-[#5c647a]">{entry.actor?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${info.color}`}>
                          <span className="material-symbols-outlined text-[12px]">{info.icon}</span>
                          {info.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5c647a]">
                        {entry.targetUser ? (
                          <span>{entry.targetUser.name || entry.targetUser.email}</span>
                        ) : entry.targetType ? (
                          <span>{entry.targetType} #{entry.targetId?.slice(-6)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[10px] text-[#5c647a] font-mono">{entry.ipAddress || "—"}</td>
                      <td className="px-4 py-3">
                        {entry.details && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className="p-1 text-[#5c647a] hover:text-[#191c1e] transition-colors"
                            title="Voir les détails"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isExpanded ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Expanded details */}
            {expandedId && (() => {
              const entry = data.data.find((e) => e.id === expandedId);
              if (!entry?.details) return null;
              return (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-2">Détails</p>
                  <pre className="text-xs text-[#191c1e] bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-bold text-[#5c647a] hover:text-[#191c1e] disabled:opacity-30 transition-colors"
          >
            Précédent
          </button>
          <span className="text-xs text-[#5c647a]">
            Page {page} / {data.pages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.pages, page + 1))}
            disabled={page === data.pages}
            className="px-3 py-1.5 text-xs font-bold text-[#5c647a] hover:text-[#191c1e] disabled:opacity-30 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
