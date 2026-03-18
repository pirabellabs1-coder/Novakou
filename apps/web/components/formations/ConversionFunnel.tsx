"use client";

import { useLocale } from "next-intl";

interface FunnelStep {
  label: string;
  value: number;
  color?: string;
}

interface ConversionFunnelProps {
  steps: FunnelStep[];
  className?: string;
}

const DEFAULT_COLORS = ["#6C2BD9", "#8B5CF6", "#0EA5E9", "#10B981", "#F59E0B"];

export default function ConversionFunnel({
  steps,
  className = "",
}: ConversionFunnelProps) {
  const locale = useLocale();
  const fr = locale === "fr";

  if (!steps.length) return null;

  const maxValue = steps[0]?.value || 1;

  return (
    <div className={`space-y-3 ${className}`}>
      {steps.map((step, i) => {
        const widthPercent = Math.max((step.value / maxValue) * 100, 8);
        const convRate =
          i > 0 && steps[i - 1].value > 0
            ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
            : null;
        const color = step.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

        return (
          <div key={step.label} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {step.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {step.value.toLocaleString("fr-FR")}
                </span>
                {convRate && (
                  <span className="text-xs text-slate-400">({convRate}%)</span>
                )}
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full h-8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: color,
                }}
              >
                {widthPercent > 15 && (
                  <span className="text-xs font-bold text-white">
                    {((step.value / maxValue) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            {/* Flèche entre les étapes */}
            {i < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <svg
                  className="w-4 h-4 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
      {/* Taux de conversion global */}
      {steps.length >= 2 && steps[0].value > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {fr ? "Conversion globale" : "Overall conversion"}
          </span>
          <span className="text-lg font-bold text-primary">
            {((steps[steps.length - 1].value / steps[0].value) * 100).toFixed(
              1
            )}
            %
          </span>
        </div>
      )}
    </div>
  );
}
