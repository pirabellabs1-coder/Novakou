"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, ArrowDownLeft, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

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

export default function AdminFormationsFinancesPage() {
  const [data, setData] = useState<AdminFinancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/formations/finances")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const processWithdrawal = async (id: string, action: "approve" | "reject"): Promise<void> => {
    setProcessingId(id);
    await fetch(`/api/admin/formations/finances/withdrawal/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setProcessingId(null);
    fetch("/api/admin/formations/finances")
      .then((r) => r.json())
      .then((d) => setData(d));
  };

  const statCards = [
    { label: "CA total formations", value: `${(data?.totalRevenue ?? 0).toFixed(0)}€`, icon: DollarSign, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Commissions perçues (30%)", value: `${(data?.totalCommission ?? 0).toFixed(0)}€`, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Retraits en attente", value: `${(data?.pendingWithdrawals ?? 0).toFixed(0)}€`, icon: ArrowDownLeft, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Remboursements en attente", value: data?.pendingRefunds ?? 0, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-bold text-white">Finances — Formations</h1>

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
              href.includes("finances") ? "bg-primary text-white" : "text-slate-400 hover:text-white hover:bg-border-dark/50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Chargement...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-neutral-dark border border-border-dark rounded-xl p-5">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          {data?.revenueByMonth && data.revenueByMonth.length > 0 && (
            <div className="bg-neutral-dark border border-border-dark rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Revenus formations (12 derniers mois)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                  <Tooltip content={<ChartTooltip formatter={(v, name) => `${v.toLocaleString("fr-FR")}€ (${name === "revenue" ? "CA brut" : "Commissions (30%)"})`} />} />
                  <Bar dataKey="revenue" fill="#6C2BD9" radius={[4, 4, 0, 0]} name="revenue" />
                  <Bar dataKey="commission" fill="#10b981" radius={[4, 4, 0, 0]} name="commission" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Pending withdrawals */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl">
            <div className="p-5 border-b border-border-dark flex items-center justify-between">
              <h2 className="font-semibold text-white">Demandes de retrait en attente</h2>
            </div>
            <div className="divide-y divide-border-dark">
              {(data?.withdrawals ?? []).filter(w => w.status === "EN_ATTENTE").length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">Aucune demande en attente</p>
              ) : (
                (data?.withdrawals ?? []).filter(w => w.status === "EN_ATTENTE").map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-white font-medium">{w.instructeur.user.name}</p>
                      <p className="text-xs text-slate-500">{w.instructeur.user.email} · {w.method}</p>
                      <p className="text-xs text-slate-500">{new Date(w.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">{w.amount.toFixed(0)}€</span>
                      <button
                        onClick={() => processWithdrawal(w.id, "approve")}
                        disabled={processingId === w.id}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => processWithdrawal(w.id, "reject")}
                        disabled={processingId === w.id}
                        className="text-xs bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
