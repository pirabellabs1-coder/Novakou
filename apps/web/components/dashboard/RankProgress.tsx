"use client";

import { cn } from "@/lib/utils";
import { getUserRank, getNextRank, RANK_LEVELS } from "@/lib/rank-utils";

interface RankProgressProps {
  completedSales: number;
  className?: string;
}

export function RankProgress({ completedSales, className = "" }: RankProgressProps) {
  const currentRank = getUserRank(completedSales);
  const { nextRank, salesNeeded, progress } = getNextRank(completedSales);

  return (
    <div className={cn("bg-neutral-dark rounded-xl border border-border-dark p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-sm">Votre rang</h3>
        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", `${currentRank.color} bg-white/5`)}>
          <span className="material-symbols-outlined text-sm">{currentRank.icon}</span>
          {currentRank.label}
        </div>
      </div>

      {/* Progress to next rank */}
      {nextRank ? (
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">
              Progression vers <span className={cn("font-semibold", nextRank.color)}>{nextRank.label}</span>
            </span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-border-dark rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {completedSales} / {nextRank.minSales} ventes completees
            <span className="text-slate-600"> — encore {salesNeeded} vente{salesNeeded > 1 ? "s" : ""}</span>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="material-symbols-outlined text-sm">emoji_events</span>
          Rang maximum atteint ! Vous etes un Elite Expert.
        </div>
      )}

      {/* All ranks preview */}
      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border-dark">
        {RANK_LEVELS.map((rank, i) => {
          const isAchieved = completedSales >= rank.minSales;
          const isCurrent = rank.level === currentRank.level;
          return (
            <div key={rank.level} className="flex items-center gap-1">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all",
                  isCurrent
                    ? "bg-primary text-white ring-2 ring-primary/30"
                    : isAchieved
                      ? "bg-primary/20 text-primary"
                      : "bg-border-dark text-slate-600"
                )}
                title={`${rank.label} (${rank.minSales}+ ventes)`}
              >
                <span className="material-symbols-outlined text-xs">{rank.icon}</span>
              </div>
              {i < RANK_LEVELS.length - 1 && (
                <div className={cn("w-4 h-0.5", isAchieved ? "bg-primary/30" : "bg-border-dark")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
