"use client";

import { cn } from "@/lib/utils";
import { getTrendStyle, formatTrend } from "@/lib/design-tokens";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  trend?: number;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  subtitle,
  className = "",
}: StatCardProps) {
  const trendStyle = trend !== undefined ? getTrendStyle(trend) : null;

  return (
    <div className={cn("bg-neutral-dark rounded-xl border border-border-dark p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
          <span className={cn("material-symbols-outlined text-xl", iconColor)}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trendStyle && trend !== undefined && (
          <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", trendStyle.bg, trendStyle.color)}>
            {formatTrend(trend)}
          </span>
        )}
        {subtitle && (
          <p className="text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Skeleton variant for loading state
export function StatCardSkeleton() {
  return (
    <div className="bg-neutral-dark rounded-xl border border-border-dark p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-border-dark rounded" />
        <div className="w-10 h-10 bg-border-dark rounded-lg" />
      </div>
      <div className="h-8 w-20 bg-border-dark rounded mt-2" />
      <div className="h-3 w-32 bg-border-dark rounded mt-3" />
    </div>
  );
}
