"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type LucideIcon, BarChart3, Landmark, Users, ShoppingCart, Package, FileText, Plus, Loader2, Play, Download, ChevronDown, ChevronUp } from "lucide-react";

interface SavedReport {
  id: string;
  type: string;
  title: string;
  dateFrom: string | null;
  dateTo: string | null;
  data: Record<string, unknown>;
  generatedAt: string;
  generator: { id: string; name: string | null; email: string | null };
}

interface ReportsResponse {
  data: SavedReport[];
  total: number;
  page: number;
  pages: number;
}

const REPORT_TYPES: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: "financial", label: "Financier", icon: Landmark, color: "bg-emerald-100 text-emerald-700" },
  { value: "users", label: "Utilisateurs", icon: Users, color: "bg-blue-100 text-blue-700" },
  { value: "sales", label: "Ventes", icon: ShoppingCart, color: "bg-green-100 text-green-700" },
  { value: "products", label: "Produits", icon: Package, color: "bg-amber-100 text-amber-700" },
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function downloadCSV(report: SavedReport) {
  const data = report.data;
  let csv = "";

  // Try to convert arrays in data to CSV
  const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
  if (arrayKey) {
    const arr = data[arrayKey] as Record<string, unknown>[];
    if (arr.length > 0) {
      const headers = Object.keys(arr[0]);
      csv = headers.join(";") + "\n";
      csv += arr.map((row) => headers.map((h) => {
        const v = row[h];
        if (typeof v === "object" && v !== null) return JSON.stringify(v);
        return String(v ?? "");
      }).join(";")).join("\n");
    }
  }

  if (!csv) {
    // Fallback: dump as key-value
    csv = Object.entries(data).map(([k, v]) => `${k};${typeof v === "object" ? JSON.stringify(v) : v}`).join("\n");
  }

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.title.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminRapportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Generate report form
  const [showGenerate, setShowGenerate] = useState(false);
  const [genType, setGenType] = useState("financial");
  const [genFrom, setGenFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [genTo, setGenTo] = useState(() => new Date().toISOString().split("T")[0]);

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (typeFilter) params.set("type", typeFilter);

  const { data, isLoading } = useQuery<ReportsResponse>({
    queryKey: ["admin-reports", page, typeFilter],
    queryFn: () => fetch(`/api/formations/admin/reports?${params}`).then((r) => r.json()),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/formations/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: genType, dateFrom: genFrom, dateTo: genTo }),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setShowGenerate(false);
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#13241b] flex items-center gap-2">
            <BarChart3 size={22} className="text-[#006e2f]" />
            Rapports
          </h1>
          <p className="text-sm text-[#5c647a] mt-1">
            Générer et consulter les rapports de la plateforme
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#006e2f] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#005a26] transition-colors"
        >
          <Plus size={16} />
          Nouveau rapport
        </button>
      </div>

      {/* Generate form */}
      {showGenerate && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <h2 className="text-sm font-bold text-[#13241b] mb-4">Générer un rapport</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">Type</label>
              <select
                value={genType}
                onChange={(e) => setGenType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#006e2f]"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">Du</label>
              <input
                type="date"
                value={genFrom}
                onChange={(e) => setGenFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#006e2f]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5c647a] mb-1">Au</label>
              <input
                type="date"
                value={genTo}
                onChange={(e) => setGenTo(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-[#006e2f]"
              />
            </div>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#006e2f] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#005a26] disabled:opacity-50 transition-colors"
            >
              {generateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              {generateMutation.isPending ? "Génération..." : "Générer"}
            </button>
            <button
              onClick={() => setShowGenerate(false)}
              className="px-3 py-2 text-xs font-bold text-[#5c647a] hover:text-[#191c1e] transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Filtrer</label>
        <div className="flex gap-1.5">
          <button
            onClick={() => { setTypeFilter(""); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              !typeFilter ? "bg-[#006e2f] text-white" : "bg-gray-100 text-[#5c647a] hover:bg-gray-200"
            }`}
          >
            Tous
          </button>
          {REPORT_TYPES.map((t) => {
            const TIcon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => { setTypeFilter(t.value); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                  typeFilter === t.value ? "bg-[#006e2f] text-white" : "bg-gray-100 text-[#5c647a] hover:bg-gray-200"
                }`}
              >
                <TIcon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-[#5c647a]">{data?.total ?? 0} rapports</span>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-100 flex items-center justify-center py-20">
            <Loader2 size={30} className="text-[#006e2f] animate-spin" />
          </div>
        ) : !data?.data?.length ? (
          <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 text-[#5c647a]">
            <BarChart3 size={36} className="mb-2" />
            <p className="text-sm font-medium">Aucun rapport</p>
            <p className="text-xs mt-1">Cliquez sur &quot;Nouveau rapport&quot; pour en générer un</p>
          </div>
        ) : (
          data.data.map((report) => {
            const typeInfo = REPORT_TYPES.find((t) => t.value === report.type);
            const ReportIcon = typeInfo?.icon ?? FileText;
            const isExpanded = expandedId === report.id;

            return (
              <div key={report.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo?.color || "bg-gray-100 text-gray-700"}`}>
                    <ReportIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#13241b] truncate">{report.title}</p>
                    <p className="text-[10px] text-[#5c647a] mt-0.5">
                      {formatDate(report.dateFrom)} → {formatDate(report.dateTo)}
                      {" · "}Généré par {report.generator.name || report.generator.email}
                      {" · "}{formatFullDate(report.generatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => downloadCSV(report)}
                      className="p-2 text-[#5c647a] hover:text-[#006e2f] hover:bg-[#006e2f]/10 rounded-lg transition-colors"
                      title="Exporter CSV"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      className="p-2 text-[#5c647a] hover:text-[#191c1e] hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voir les données"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded data */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    {/* Summary stats */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      {Object.entries(report.data).filter(([, v]) => typeof v === "number").map(([key, value]) => (
                        <div key={key} className="bg-white rounded-lg border border-gray-200 px-3 py-2 min-w-[120px]">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                          <p className="text-lg font-bold text-[#13241b]">
                            {key.toLowerCase().includes("revenue") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("withdrawal")
                              ? `${(value as number).toLocaleString("fr-FR")} FCFA`
                              : (value as number).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      ))}
                    </div>
                    {/* Raw JSON */}
                    <details className="mt-2">
                      <summary className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a] cursor-pointer hover:text-[#191c1e]">
                        Données brutes JSON
                      </summary>
                      <pre className="text-xs text-[#191c1e] bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto whitespace-pre-wrap mt-2 max-h-[400px] overflow-y-auto">
                        {JSON.stringify(report.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-bold text-[#5c647a] hover:text-[#191c1e] disabled:opacity-30"
          >
            Précédent
          </button>
          <span className="text-xs text-[#5c647a]">Page {page} / {data.pages}</span>
          <button
            onClick={() => setPage(Math.min(data.pages, page + 1))}
            disabled={page === data.pages}
            className="px-3 py-1.5 text-xs font-bold text-[#5c647a] hover:text-[#191c1e] disabled:opacity-30"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
