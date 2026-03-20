"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

interface AdminFinancesData {
  totalRevenue: number;
  totalCommission: number;
  pendingWithdrawals: number;
  pendingRefunds: number;
  revenueByMonth: { month: string; revenue: number; commission: number }[];
  withdrawals: {
    id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
    instructeur: { user: { name: string; email: string } };
  }[];
}

interface RefundRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string | null;
  formationTitle: string;
  amount: number;
  reason: string;
  createdAt: string;
  status: string;
  adminNote: string;
}

export default function AdminFormationsFinancesPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const [data, setData] = useState<AdminFinancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "refunds">("overview");

  // Refunds state
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundNotes, setRefundNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/formations/finances")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "refunds") {
      fetchRefunds();
    }
  }, [activeTab]);

  const fetchRefunds = async () => {
    setRefundsLoading(true);
    try {
      const res = await fetch("/api/admin/formations/refunds");
      const data = await res.json();
      setRefunds(data.refunds ?? []);
    } catch {
      // silent
    } finally {
      setRefundsLoading(false);
    }
  };

  const processWithdrawal = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    await fetch(`/api/admin/formations/finances/withdrawal/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setProcessingId(null);
    fetch("/api/admin/formations/finances").then((r) => r.json()).then((d) => setData(d));
  };

  const processRefund = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      await fetch(`/api/admin/formations/refunds/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: refundNotes[id] || "" }),
      });
      setRefunds((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: action === "approve" ? "APPROUVE" : "REJETE", adminNote: refundNotes[id] || "" }
            : r
        )
      );
    } catch {
      // silent
    } finally {
      setProcessingId(null);
    }
  };

  const statCards = [
    { label: t("admin_total_revenue"), value: `${(data?.totalRevenue ?? 0).toFixed(0)}\u20AC`, icon: "payments", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: t("admin_commission"), value: `${(data?.totalCommission ?? 0).toFixed(0)}\u20AC`, icon: "trending_up", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: t("admin_pending_withdrawals"), value: `${(data?.pendingWithdrawals ?? 0).toFixed(0)}\u20AC`, icon: "account_balance", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { label: t("admin_pending_refunds"), value: data?.pendingRefunds ?? 0, icon: "error_outline", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
  ];

  const pendingRefunds = refunds.filter((r) => r.status === "EN_ATTENTE");

  const REFUND_STATUS_COLORS: Record<string, string> = {
    EN_ATTENTE: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
    APPROUVE: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
    REJETE: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
  };

  const REFUND_STATUS_LABELS: Record<string, string> = {
    EN_ATTENTE: "En attente",
    APPROUVE: "Approuv\u00e9",
    REJETE: "Rejet\u00e9",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t("admin_finances_title")}</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            activeTab === "overview"
              ? "bg-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
          Vue d&apos;ensemble
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            activeTab === "refunds"
              ? "bg-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span className="material-symbols-outlined text-sm">currency_exchange</span>
          Remboursements
          {data && data.pendingRefunds > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full">
              {data.pendingRefunds}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">{t("loading")}</div>
      ) : activeTab === "overview" ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl shadow-sm p-5">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {data?.revenueByMonth && data.revenueByMonth.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl shadow-sm p-6">
              <h2 className="font-semibold mb-4 text-slate-900 dark:text-white">{t("admin_revenue_chart")}</h2>
              <div className="space-y-3">
                {data.revenueByMonth.map((m) => (
                  <div key={m.month} className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 w-12">{m.month}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (m.revenue / Math.max(...data.revenueByMonth.map(r => r.revenue), 1)) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-20 text-right text-slate-900 dark:text-white">{m.revenue.toFixed(0)}\u20AC</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending withdrawals */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">{t("admin_pending_withdrawal_requests")}</h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {(data?.withdrawals ?? []).filter(w => w.status === "EN_ATTENTE").length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">{t("admin_no_pending_withdrawals")}</p>
              ) : (
                (data?.withdrawals ?? []).filter(w => w.status === "EN_ATTENTE").map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{w.instructeur.user.name}</p>
                      <p className="text-xs text-slate-500">{w.instructeur.user.email} \u00b7 {w.method}</p>
                      <p className="text-xs text-slate-400">{new Date(w.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{w.amount.toFixed(0)}\u20AC</span>
                      <button onClick={() => processWithdrawal(w.id, "approve")} disabled={processingId === w.id} className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">{t("admin_approve")}</button>
                      <button onClick={() => processWithdrawal(w.id, "reject")} disabled={processingId === w.id} className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">{t("admin_reject")}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Refunds tab */
        <>
          {refundsLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="border-b border-slate-200 dark:border-slate-700">
                  <tr className="text-slate-500 text-xs uppercase">
                    <th className="p-4 text-left">Apprenant</th>
                    <th className="p-4 text-left">Formation</th>
                    <th className="p-4 text-right">Montant</th>
                    <th className="p-4 text-left">Motif</th>
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-center">Statut</th>
                    <th className="p-4 text-left">Note admin</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {refunds.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Aucune demande de remboursement
                      </td>
                    </tr>
                  ) : (
                    refunds.map((refund) => (
                      <tr
                        key={refund.id}
                        className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {refund.studentAvatar ? (
                                <img
                                  src={refund.studentAvatar}
                                  alt={refund.studentName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-primary font-bold text-sm">
                                  {(refund.studentName || "?").charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {refund.studentName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {refund.studentEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xs">
                            {refund.formationTitle}
                          </p>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {refund.amount.toFixed(0)}\u20AC
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-xs text-slate-500 line-clamp-2 max-w-xs">
                            {refund.reason}
                          </p>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(refund.createdAt).toLocaleDateString(
                            locale === "en" ? "en-GB" : "fr-FR"
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${REFUND_STATUS_COLORS[refund.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}
                          >
                            {REFUND_STATUS_LABELS[refund.status] ?? refund.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {refund.status === "EN_ATTENTE" ? (
                            <input
                              type="text"
                              value={refundNotes[refund.id] ?? ""}
                              onChange={(e) =>
                                setRefundNotes((prev) => ({
                                  ...prev,
                                  [refund.id]: e.target.value,
                                }))
                              }
                              placeholder="Note (optionnelle)..."
                              className="w-full min-w-[140px] px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          ) : (
                            <p className="text-xs text-slate-500 italic">
                              {refund.adminNote || "\u2014"}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            {refund.status === "EN_ATTENTE" && (
                              <>
                                <button
                                  onClick={() => processRefund(refund.id, "approve")}
                                  disabled={processingId === refund.id}
                                  className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    check_circle
                                  </span>
                                  Approuver
                                </button>
                                <button
                                  onClick={() => processRefund(refund.id, "reject")}
                                  disabled={processingId === refund.id}
                                  className="flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    cancel
                                  </span>
                                  Rejeter
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
