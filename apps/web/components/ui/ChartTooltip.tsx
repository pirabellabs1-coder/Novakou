"use client";

import { TOOLTIP_STYLES } from "@/lib/design-tokens";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(String(label)) : label;

  return (
    <div
      className="rounded-lg px-3 py-2 shadow-xl border text-sm"
      style={{
        backgroundColor: TOOLTIP_STYLES.backgroundColor,
        borderColor: TOOLTIP_STYLES.borderColor,
      }}
    >
      {displayLabel && (
        <p className="text-xs mb-1.5 font-medium" style={{ color: TOOLTIP_STYLES.labelColor }}>
          {displayLabel}
        </p>
      )}
      {payload.map((entry, i) => {
        const displayValue = formatter
          ? formatter(entry.value ?? 0, entry.name ?? entry.dataKey ?? "")
          : entry.value?.toLocaleString("fr-FR");
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span style={{ color: TOOLTIP_STYLES.labelColor }} className="text-xs">
              {entry.name ?? entry.dataKey}:
            </span>
            <span className="font-semibold text-xs" style={{ color: TOOLTIP_STYLES.textColor }}>
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}
