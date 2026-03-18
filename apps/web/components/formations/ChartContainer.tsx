"use client";

import { ReactNode } from "react";
import { Download } from "lucide-react";
import { useLocale } from "next-intl";

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  /** Données pour l'export CSV */
  exportData?: Record<string, unknown>[];
  exportFilename?: string;
  /** Actions custom à droite du titre */
  actions?: ReactNode;
  className?: string;
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "")}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ChartContainer({
  title,
  children,
  exportData,
  exportFilename = "export",
  actions,
  className = "",
}: ChartContainerProps) {
  const locale = useLocale();
  const fr = locale === "fr";

  return (
    <div
      className={`bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        <div className="flex items-center gap-2">
          {actions}
          {exportData && exportData.length > 0 && (
            <button
              type="button"
              onClick={() => downloadCSV(exportData, exportFilename)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700"
              title={fr ? "Exporter en CSV" : "Export as CSV"}
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
