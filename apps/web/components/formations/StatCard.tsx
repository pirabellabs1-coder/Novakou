"use client";

import { useId } from "react";
import { LucideIcon } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: number | null;
  color: string;
  bg: string;
  /** Données sparkline : [{value: number}] */
  sparkData?: { value: number }[];
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  trend,
  color,
  bg,
  sparkData,
}: StatCardProps) {
  const uniqueId = useId();
  const trendPositive = trend !== null && trend !== undefined && trend > 0;
  const trendNegative = trend !== null && trend !== undefined && trend < 0;
  const sparkColor = trendPositive ? "#10B981" : trendNegative ? "#EF4444" : "#6C2BD9";

  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend !== null && trend !== undefined && trend !== 0 && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              trendPositive
                ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                : "text-red-600 bg-red-50 dark:bg-red-900/20"
            }`}
          >
            {trendPositive ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
        {suffix && (
          <span className="text-base font-semibold text-slate-400 ml-0.5">
            {suffix}
          </span>
        )}
      </p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>

      {/* Sparkline */}
      {sparkData && sparkData.length > 1 && (
        <div className="absolute bottom-0 right-0 w-24 h-12 opacity-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparkColor}
                strokeWidth={1.5}
                fill={`url(#spark-${uniqueId})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
