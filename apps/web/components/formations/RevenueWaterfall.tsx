"use client";

import { useLocale } from "next-intl";

interface WaterfallData {
  gross: number;
  commissions: number;
  refunds: number;
  net: number;
}

interface RevenueWaterfallProps {
  data: WaterfallData;
  className?: string;
}

export default function RevenueWaterfall({ data, className = "" }: RevenueWaterfallProps) {
  const locale = useLocale();
  const fr = locale === "fr";

  const maxValue = Math.max(data.gross, 1);

  const bars = [
    {
      label: fr ? "Revenus bruts" : "Gross Revenue",
      value: data.gross,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      isPositive: true,
    },
    {
      label: fr ? "Commissions" : "Commissions",
      value: -data.commissions,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      isPositive: false,
    },
    {
      label: fr ? "Remboursements" : "Refunds",
      value: -data.refunds,
      color: "bg-red-500",
      textColor: "text-red-600",
      isPositive: false,
    },
    {
      label: fr ? "Revenu net" : "Net Revenue",
      value: data.net,
      color: "bg-violet-600",
      textColor: "text-violet-600",
      isPositive: true,
    },
  ];

  const formatCurrency = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1000) return `${(abs / 1000).toFixed(1)}k €`;
    return `${abs.toFixed(0)} €`;
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-end gap-3 h-48">
        {bars.map((bar, i) => {
          const absValue = Math.abs(bar.value);
          const heightPct = (absValue / maxValue) * 100;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {/* Value label */}
              <span className={`text-xs font-semibold ${bar.textColor}`}>
                {bar.isPositive ? "+" : "-"}{formatCurrency(bar.value)}
              </span>

              {/* Bar */}
              <div className="w-full flex items-end" style={{ height: "140px" }}>
                <div
                  className={`w-full ${bar.color} rounded-t-md transition-all duration-700 ease-out`}
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    opacity: bar.isPositive ? 1 : 0.75,
                  }}
                />
              </div>

              {/* Label */}
              <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight">
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
