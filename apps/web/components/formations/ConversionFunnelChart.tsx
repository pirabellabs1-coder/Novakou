"use client";

import { useLocale } from "next-intl";

interface FunnelStep {
  step: string;
  count: number;
}

interface ConversionFunnelChartProps {
  data: FunnelStep[];
  className?: string;
}

const FUNNEL_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
];

const FUNNEL_LABELS_FR: Record<string, string> = {
  visitors: "Visiteurs",
  enrollments: "Inscriptions",
  purchases: "Achats",
  certificates: "Certificats",
};

const FUNNEL_LABELS_EN: Record<string, string> = {
  visitors: "Visitors",
  enrollments: "Enrollments",
  purchases: "Purchases",
  certificates: "Certificates",
};

export default function ConversionFunnelChart({
  data,
  className = "",
}: ConversionFunnelChartProps) {
  const locale = useLocale();
  const fr = locale === "fr";
  const labels = fr ? FUNNEL_LABELS_FR : FUNNEL_LABELS_EN;

  const maxCount = Math.max(data[0]?.count ?? 1, 1);

  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((step, i) => {
        const widthPct = (step.count / maxCount) * 100;
        const conversionRate =
          i > 0 && data[i - 1].count > 0
            ? ((step.count / data[i - 1].count) * 100).toFixed(1)
            : null;

        return (
          <div key={step.step} className="space-y-1">
            {/* Header */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {labels[step.step] ?? step.step}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {step.count.toLocaleString(fr ? "fr-FR" : "en-US")}
                </span>
                {conversionRate && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ({conversionRate}%)
                  </span>
                )}
              </div>
            </div>

            {/* Bar */}
            <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
              <div
                className={`h-full ${FUNNEL_COLORS[i % FUNNEL_COLORS.length]} rounded-md transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                style={{ width: `${Math.max(widthPct, 3)}%` }}
              >
                {widthPct > 15 && (
                  <span className="text-xs font-medium text-white">
                    {widthPct.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {/* Conversion arrow */}
            {i < data.length - 1 && (
              <div className="flex justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" className="text-slate-300 dark:text-slate-600">
                  <path d="M6 0L6 8M2 5L6 9L10 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
