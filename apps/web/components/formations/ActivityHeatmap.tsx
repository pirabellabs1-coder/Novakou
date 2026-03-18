"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  className?: string;
}

const INTENSITY_COLORS = [
  "bg-slate-100 dark:bg-slate-800",      // 0
  "bg-violet-200 dark:bg-violet-900",     // 1
  "bg-violet-300 dark:bg-violet-700",     // 2
  "bg-violet-500 dark:bg-violet-500",     // 3
  "bg-violet-700 dark:bg-violet-400",     // 4+
];

const DAY_LABELS_FR = ["Lun", "", "Mer", "", "Ven", "", ""];
const DAY_LABELS_EN = ["Mon", "", "Wed", "", "Fri", "", ""];

export default function ActivityHeatmap({ data, className = "" }: ActivityHeatmapProps) {
  const locale = useLocale();
  const fr = locale === "fr";
  const dayLabels = fr ? DAY_LABELS_FR : DAY_LABELS_EN;

  const { grid, maxCount, monthLabels } = useMemo(() => {
    const countMap = new Map<string, number>();
    let max = 0;
    for (const d of data) {
      countMap.set(d.date, d.count);
      if (d.count > max) max = d.count;
    }

    // Build 52 weeks × 7 days grid
    const today = new Date();
    const weeks: { date: string; count: number }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let w = 51; w >= 0; w--) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dayOffset = w * 7 + (6 - d);
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);
        const key = date.toISOString().split("T")[0];
        week.push({ date: key, count: countMap.get(key) ?? 0 });

        if (d === 0 && date.getMonth() !== lastMonth) {
          lastMonth = date.getMonth();
          months.push({
            label: date.toLocaleDateString(fr ? "fr-FR" : "en-US", { month: "short" }),
            weekIndex: 51 - w,
          });
        }
      }
      weeks.unshift(week);
    }

    return { grid: weeks, maxCount: max || 1, monthLabels: months };
  }, [data, fr]);

  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  return (
    <div className={`${className}`}>
      {/* Month labels */}
      <div className="flex ml-8 mb-1 text-xs text-slate-400">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: `${m.weekIndex * 14 + 32}px` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-[2px] relative mt-5">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] mr-1 text-xs text-slate-400">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[12px] flex items-center justify-end pr-1 w-6">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-[12px] h-[12px] rounded-sm ${INTENSITY_COLORS[getIntensity(day.count)]} transition-colors`}
                title={`${day.date}: ${day.count} ${fr ? "activités" : "activities"}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 ml-8 text-xs text-slate-400">
        <span>{fr ? "Moins" : "Less"}</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div key={i} className={`w-[12px] h-[12px] rounded-sm ${color}`} />
        ))}
        <span>{fr ? "Plus" : "More"}</span>
      </div>
    </div>
  );
}
