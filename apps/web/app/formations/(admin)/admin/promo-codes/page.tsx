"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface PromoCode {
  id: string;
  code: string;
  discountPct: number;
  maxUsage: number | null;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
  formationIds: string[];
  createdAt: string;
}

const DEFAULT_FORM = { code: "", discountPct: 10, maxUsage: "", expiresAt: "", isActive: true, formationIds: [] as string[] };

export default function AdminPromoCodesPage() {
  const t = useTranslations("formations_nav");
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "expired">("all");

  const fetchCodes = () => {
    fetch("/api/admin/formations/promo-codes")
      .then((r) => r.json())
      .then((d) => { setCodes(d.promoCodes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCodes(); }, []);

  const getStatus = (c: PromoCode): string => {
    if (!c.isActive) return "inactive";
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return "expired";
    if (c.maxUsage && c.usageCount >= c.maxUsage) return "exhausted";
    return "active";
  };

  const filtered = codes.filter((c) => {
    if (filter === "all") return true;
    if (filter === "active") return getStatus(c) === "active";
    if (filter === "inactive") return getStatus(c) === "inactive";
    if (filter === "expired") return getStatus(c) === "expired" || getStatus(c) === "exhausted";
    return true;
  });

  const startEdit = (c: PromoCode) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discountPct: c.discountPct,
      maxUsage: c.maxUsage?.toString() ?? "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0] : "",
      isActive: c.isActive,
      formationIds: c.formationIds,
    });
    setShowForm(true);
  };

  const cancel = () => { setShowForm(false); setEditingId(null); setForm(DEFAULT_FORM); };

  const save = async () => {
    setSaving(true);
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/admin/formations/promo-codes/${editingId}` : "/api/admin/formations/promo-codes";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        discountPct: form.discountPct,
        maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
        formationIds: form.formationIds,
      }),
    });
    setSaving(false);
    cancel();
    fetchCodes();
  };

  const toggleActive = async (c: PromoCode) => {
    await fetch(`/api/admin/formations/promo-codes/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    fetchCodes();
  };

  const deleteCode = async (id: string) => {
    await fetch(`/api/admin/formations/promo-codes/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchCodes();
  };

  const statusBadge = (c: PromoCode) => {
    const s = getStatus(c);
    const map: Record<string, { bg: string; label: string }> = {
      active: { bg: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400", label: t("promo_active") },
      inactive: { bg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", label: t("promo_inactive") },
      expired: { bg: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400", label: t("promo_expired") },
      exhausted: { bg: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400", label: t("promo_exhausted") },
    };
    const { bg, label } = map[s] ?? map.inactive;
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bg}`}>{label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("admin_promo_codes_title")}</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_FORM); }} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <span className="material-symbols-outlined text-lg">add</span>
          {t("promo_create")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "active", "inactive", "expired"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filter === f ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {f === "all" ? t("filter_all") : f === "active" ? t("promo_active") : f === "inactive" ? t("promo_inactive") : t("promo_expired")}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-primary/30 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{editingId ? t("promo_edit") : t("promo_create")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("promo_code_label")} *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-primary" placeholder="EX: PROMO2026" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("promo_discount_pct")} *</label>
              <input type="number" min={1} max={100} value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: Number(e.target.value) })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("promo_max_usage")}</label>
              <input type="number" min={1} value={form.maxUsage} onChange={(e) => setForm({ ...form, maxUsage: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Illimité" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">{t("promo_expiry")}</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-sm font-medium">{t("promo_active")}</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={cancel} className="flex items-center gap-1.5 text-sm border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span> {t("cancel")}
            </button>
            <button onClick={save} disabled={!form.code || !form.discountPct || saving} className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-lg">check</span> {saving ? t("saving") : t("save")}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="border-b border-slate-200 dark:border-slate-700">
            <tr className="text-slate-500 text-xs uppercase">
              <th className="p-4 text-left">{t("promo_code")}</th>
              <th className="p-4 text-left">{t("promo_discount")}</th>
              <th className="p-4 text-left">{t("promo_usage")}</th>
              <th className="p-4 text-left">{t("promo_expiry")}</th>
              <th className="p-4 text-left">{t("promo_status")}</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t("loading")}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t("promo_no_codes")}</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-primary">{c.code}</td>
                  <td className="p-4">{c.discountPct}%</td>
                  <td className="p-4">{c.usageCount} / {c.maxUsage ?? "∞"}</td>
                  <td className="p-4 text-xs text-slate-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-FR") : "—"}</td>
                  <td className="p-4">{statusBadge(c)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => toggleActive(c)} className={`p-1.5 rounded-lg transition-colors ${c.isActive ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`} title={c.isActive ? t("admin_suspend") : t("admin_reactivate")}>
                        <span className="material-symbols-outlined text-lg">{c.isActive ? "pause_circle" : "play_circle"}</span>
                      </button>
                      <button onClick={() => startEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-bold mb-2">{t("admin_delete")} ?</h2>
            <p className="text-sm text-slate-500 mb-4">{t("admin_delete_irreversible")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 transition-colors text-sm">{t("cancel")}</button>
              <button onClick={() => deleteCode(deleteId)} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">{t("admin_delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
