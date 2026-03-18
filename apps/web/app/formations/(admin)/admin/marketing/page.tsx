"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

interface Instructor {
  id: string;
  user: { name: string };
}

interface Promotion {
  id: string;
  instructorName: string;
  type: string;
  discountValue: number;
  validFrom: string;
  validUntil: string;
  usageCount: number;
  status: string;
}

interface MarketingStats {
  activePromotions: number;
  activePromoCodes: number;
  marketingRevenue: number;
  avgConversionRate: number;
  instructors: Instructor[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIF: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  EXPIRE: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
  DESACTIVE: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  POURCENTAGE: "Pourcentage",
  MONTANT_FIXE: "Montant fixe",
  CODE_PROMO: "Code promo",
  FLASH_SALE: "Vente flash",
  BUNDLE: "Bundle",
};

export default function AdminMarketingPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorFilter, setInstructorFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [instructorFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = instructorFilter ? `?instructorId=${instructorFilter}` : "";
      const [statsRes, promoRes] = await Promise.all([
        fetch(`/api/admin/formations/marketing${params}`),
        fetch(`/api/admin/formations/marketing/promotions${params}`),
      ]);
      const statsData = await statsRes.json();
      const promoData = await promoRes.json();
      setStats(statsData);
      setPromotions(promoData.promotions ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const disablePromotion = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch("/api/admin/formations/marketing/promotions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "DESACTIVE" }),
      });
      setPromotions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "DESACTIVE" } : p))
      );
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    {
      label: "Promotions actives",
      value: stats?.activePromotions ?? 0,
      icon: "campaign",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Codes promo actifs",
      value: stats?.activePromoCodes ?? 0,
      icon: "confirmation_number",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Revenus marketing",
      value: `${(stats?.marketingRevenue ?? 0).toFixed(0)}`,
      suffix: "\u20AC",
      icon: "payments",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Taux de conversion moy.",
      value: `${(stats?.avgConversionRate ?? 0).toFixed(1)}`,
      suffix: "%",
      icon: "conversion_path",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-64" />
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        Marketing & Promotions
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}
            >
              <span className={`material-symbols-outlined ${s.color}`}>
                {s.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {s.value}
              {s.suffix && (
                <span className="text-base font-semibold">{s.suffix}</span>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Instructor filter */}
      <div className="flex gap-3 items-center">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            filter_list
          </span>
          <select
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none min-w-[240px]"
          >
            <option value="">Tous les instructeurs</option>
            {(stats?.instructors ?? []).map((instr) => (
              <option key={instr.id} value={instr.id}>
                {instr.user.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-slate-500">
          {promotions.length} promotion{promotions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Promotions table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr className="text-slate-500 text-xs uppercase">
              <th className="p-4 text-left">Instructeur</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">R\u00e9duction</th>
              <th className="p-4 text-left">Validit\u00e9</th>
              <th className="p-4 text-center">Utilisations</th>
              <th className="p-4 text-center">Statut</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {promotions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-slate-400"
                >
                  Aucune promotion trouv\u00e9e
                </td>
              </tr>
            ) : (
              promotions.map((promo) => (
                <tr
                  key={promo.id}
                  className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-4">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {promo.instructorName}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[promo.type] ?? promo.type}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">
                    {promo.type === "POURCENTAGE"
                      ? `${promo.discountValue}%`
                      : `${promo.discountValue.toFixed(0)}\u20AC`}
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-slate-500">
                      {new Date(promo.validFrom).toLocaleDateString(
                        locale === "en" ? "en-GB" : "fr-FR"
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      \u2192{" "}
                      {new Date(promo.validUntil).toLocaleDateString(
                        locale === "en" ? "en-GB" : "fr-FR"
                      )}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-sm">
                        group
                      </span>
                      {promo.usageCount}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[promo.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}
                    >
                      {promo.status === "ACTIF"
                        ? "Actif"
                        : promo.status === "EXPIRE"
                          ? "Expir\u00e9"
                          : "D\u00e9sactiv\u00e9"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      {promo.status === "ACTIF" && (
                        <button
                          onClick={() => disablePromotion(promo.id)}
                          disabled={actionLoading === promo.id}
                          className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">
                            block
                          </span>
                          D\u00e9sactiver
                        </button>
                      )}
                      {promo.status === "DESACTIVE" && (
                        <span className="text-xs text-slate-400 italic">
                          D\u00e9sactiv\u00e9
                        </span>
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
  );
}
