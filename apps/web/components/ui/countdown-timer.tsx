"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /** Target date to count down to */
  deadline: string | Date;
  /** Total duration in ms (for progress bar calculation) */
  totalDurationMs: number;
  /** Label shown above the timer */
  label: string;
  /** Description shown below the timer */
  description?: string;
  /** Warning text for when expired */
  expiredText?: string;
  /** Color theme */
  variant?: "amber" | "blue" | "red";
  /** Called when countdown reaches zero */
  onExpired?: () => void;
}

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "Expire";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}j ${hours}h ${minutes}min`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}min ${seconds}s`;
  }
  return `${minutes}min ${seconds}s`;
}

const VARIANT_STYLES = {
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    textSub: "text-amber-400/70",
    bar: "bg-amber-500",
    barBg: "bg-amber-500/20",
    icon: "schedule",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    textSub: "text-blue-400/70",
    bar: "bg-blue-500",
    barBg: "bg-blue-500/20",
    icon: "timer",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    textSub: "text-red-400/70",
    bar: "bg-red-500",
    barBg: "bg-red-500/20",
    icon: "warning",
  },
};

export function CountdownTimer({
  deadline,
  totalDurationMs,
  label,
  description,
  expiredText = "Delai depasse — action automatique en cours",
  variant = "amber",
  onExpired,
}: CountdownTimerProps) {
  const [timeLeftMs, setTimeLeftMs] = useState(() => {
    const target = new Date(deadline).getTime();
    return Math.max(0, target - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const target = new Date(deadline).getTime();
      const remaining = Math.max(0, target - Date.now());
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  const isExpired = timeLeftMs <= 0;
  const isUrgent = timeLeftMs > 0 && timeLeftMs < 24 * 60 * 60 * 1000; // Less than 24h
  const progressPercent = totalDurationMs > 0 ? Math.max(0, Math.min(100, (timeLeftMs / totalDurationMs) * 100)) : 0;

  const effectiveVariant = isExpired ? "red" : isUrgent ? "red" : variant;
  const styles = VARIANT_STYLES[effectiveVariant];

  return (
    <div className={cn("rounded-xl p-4 border-2", styles.bg, styles.border)}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("material-symbols-outlined text-lg", styles.text)}>
          {isExpired ? "warning" : styles.icon}
        </span>
        <p className={cn("font-bold text-sm", styles.text)}>{label}</p>
      </div>

      {isExpired ? (
        <p className={cn("text-sm font-semibold", styles.text)}>{expiredText}</p>
      ) : (
        <>
          {/* Timer display */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className={cn("text-2xl font-black tabular-nums", styles.text)}>
              {formatTimeLeft(timeLeftMs)}
            </span>
            <span className={cn("text-xs font-semibold", styles.textSub)}>restant</span>
          </div>

          {/* Progress bar */}
          <div className={cn("w-full h-2 rounded-full overflow-hidden", styles.barBg)}>
            <div
              className={cn("h-full rounded-full transition-all duration-1000", styles.bar)}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Description */}
          {description && (
            <p className={cn("text-xs mt-2", styles.textSub)}>{description}</p>
          )}
        </>
      )}
    </div>
  );
}
